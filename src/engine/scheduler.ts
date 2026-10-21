/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Module `scheduler` — Ordonnanceur d'événements persistant & déterministe
 * Résolution idempotente des actions différées (déplacements, fouilles, repos).
 */

import { Character, Location, ScheduledEvent, WorldLogEntry, WorldState, InventoryItem } from './types';

export interface EventResolutionResult {
  updatedState: WorldState;
  resolvedEvents: ScheduledEvent[];
  newLogs: WorldLogEntry[];
}

/**
 * Résout tous les événements arrivés à échéance (completesAtGameMinutes <= currentGameMinutes).
 * Strictement idempotent : les événements terminés passent à 'completed' et ne sont jamais réexécutés.
 */
export function resolveScheduledEvents(
  state: WorldState,
  currentGameMinutes: number
): EventResolutionResult {
  let hasChanges = false;
  const characters = { ...state.characters };
  const events = [...state.events];
  const newLogs: WorldLogEntry[] = [];
  const resolvedEvents: ScheduledEvent[] = [];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.status !== 'pending') continue;

    if (ev.completesAtGameMinutes <= currentGameMinutes) {
      hasChanges = true;
      const character = characters[ev.characterId];
      if (!character) {
        // Personnage introuvable -> marquer comme annulé
        events[i] = { ...ev, status: 'cancelled' };
        continue;
      }

      const updatedChar = { ...character, stats: { ...character.stats }, inventory: [...character.inventory] };

      switch (ev.type) {
        case 'movement': {
          const targetLocId = ev.payload.targetLocationId;
          const targetLoc = state.locations[targetLocId];
          if (targetLoc) {
            updatedChar.currentLocationId = targetLocId;
            updatedChar.safeZoneProtection = targetLoc.isSafeZone;
            // Coût en fatigue
            const fatigueCost = ev.payload.fatigueCost || 10;
            updatedChar.stats.fatigue = Math.min(100, updatedChar.stats.fatigue + fatigueCost);

            newLogs.push({
              id: `log_move_${ev.id}`,
              gameTimeMinutes: ev.completesAtGameMinutes,
              realTimestampUtc: Date.now(),
              characterId: character.id,
              characterName: character.name,
              category: 'movement',
              title: `Arrivée à ${targetLoc.name}`,
              content: `${character.name} est arrivé(e) à destination (${targetLoc.name}). La zone est ${targetLoc.dangerLevel}.`,
            });
          }
          break;
        }

        case 'scavenge': {
          const location = state.locations[character.currentLocationId];
          const lootFound: InventoryItem[] = ev.payload.loot || [];
          
          // Ajouter le butin à l'inventaire
          for (const item of lootFound) {
            const existing = updatedChar.inventory.find(i => i.name === item.name);
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              updatedChar.inventory.push({ ...item });
            }
          }

          // Dépense de fatigue
          updatedChar.stats.fatigue = Math.min(100, updatedChar.stats.fatigue + 15);

          const lootDesc = lootFound.length > 0
            ? `Objets trouvés: ${lootFound.map(i => `${i.quantity}x ${i.name}`).join(', ')}.`
            : 'Aucun objet utile trouvé cette fois-ci.';

          newLogs.push({
            id: `log_scav_${ev.id}`,
            gameTimeMinutes: ev.completesAtGameMinutes,
            realTimestampUtc: Date.now(),
            characterId: character.id,
            characterName: character.name,
            category: 'action',
            title: `Fouille terminée (${location?.name || 'Lieu inconnu'})`,
            content: `${character.name} a terminé la fouille. ${lootDesc}`,
          });
          break;
        }

        case 'rest': {
          const fatigueRestored = ev.payload.fatigueRestored || 35;
          const healthRestored = ev.payload.healthRestored || 10;
          updatedChar.stats.fatigue = Math.max(0, updatedChar.stats.fatigue - fatigueRestored);
          updatedChar.stats.health = Math.min(updatedChar.stats.maxHealth, updatedChar.stats.health + healthRestored);

          newLogs.push({
            id: `log_rest_${ev.id}`,
            gameTimeMinutes: ev.completesAtGameMinutes,
            realTimestampUtc: Date.now(),
            characterId: character.id,
            characterName: character.name,
            category: 'recovery',
            title: 'Période de repos terminée',
            content: `${character.name} a terminé sa période de repos. Fatigue -${fatigueRestored}, Santé +${healthRestored}.`,
          });
          break;
        }
      }

      characters[ev.characterId] = updatedChar;
      const completedEvent: ScheduledEvent = { ...ev, status: 'completed' };
      events[i] = completedEvent;
      resolvedEvents.push(completedEvent);
    }
  }

  if (!hasChanges) {
    return {
      updatedState: state,
      resolvedEvents: [],
      newLogs: [],
    };
  }

  return {
    updatedState: {
      ...state,
      characters,
      events,
      logs: [...newLogs, ...state.logs].slice(0, 100), // Garder les 100 derniers logs
    },
    resolvedEvents,
    newLogs,
  };
}

/**
 * Crée un événement planifié vérifié pour un déplacement.
 */
export function scheduleMovement(
  character: Character,
  originLocation: Location,
  targetLocation: Location,
  connectionTravelMinutes: number,
  currentGameMinutes: number
): ScheduledEvent {
  return {
    id: `evt_move_${character.id}_${currentGameMinutes}_${Math.random().toString(36).slice(2, 6)}`,
    characterId: character.id,
    type: 'movement',
    startedAtGameMinutes: currentGameMinutes,
    completesAtGameMinutes: currentGameMinutes + connectionTravelMinutes,
    status: 'pending',
    payload: {
      originLocationId: originLocation.id,
      targetLocationId: targetLocation.id,
      fatigueCost: Math.max(5, Math.floor(connectionTravelMinutes / 3)),
    },
    description: `Déplacement vers ${targetLocation.name} (${connectionTravelMinutes} min de jeu)`,
  };
}

/**
 * Crée un événement de fouille.
 */
export function scheduleScavenge(
  character: Character,
  location: Location,
  durationGameMinutes: number,
  currentGameMinutes: number,
  potentialLoot: InventoryItem[]
): ScheduledEvent {
  return {
    id: `evt_scav_${character.id}_${currentGameMinutes}_${Math.random().toString(36).slice(2, 6)}`,
    characterId: character.id,
    type: 'scavenge',
    startedAtGameMinutes: currentGameMinutes,
    completesAtGameMinutes: currentGameMinutes + durationGameMinutes,
    status: 'pending',
    payload: {
      locationId: location.id,
      loot: potentialLoot,
    },
    description: `Fouille approfondie de ${location.name} (${durationGameMinutes} min de jeu)`,
  };
}
