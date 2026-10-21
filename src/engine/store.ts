/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Gestionnaire d'état persistant du monde (Store)
 * Sauvegarde synchrone dans le localStorage (survit aux rechargements et redémarrages).
 */

import { WorldState, Character } from './types';
import { createInitialWorldState } from './initialData';
import { calculateCurrentGameMinutes } from './clock';
import { resolveScheduledEvents } from './scheduler';
import { simulateOfflineProgress } from './safety';

const STORAGE_KEY = 'zombie_rpg_world_state_v1';
const ACTIVE_CHAR_KEY = 'zombie_rpg_active_char_id';

export function loadPersistedWorld(): { state: WorldState; offlineNotes: string[] } {
  const offlineNotes: string[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialWorldState();
      saveWorldState(initial);
      return { state: initial, offlineNotes };
    }

    const state: WorldState = JSON.parse(raw);
    const nowUtc = Date.now();
    const currentGameMinutes = calculateCurrentGameMinutes(state.clock, nowUtc);

    // Résoudre les événements passés durant la fermeture/inactivité
    const { updatedState, resolvedEvents } = resolveScheduledEvents(state, currentGameMinutes);
    if (resolvedEvents.length > 0) {
      offlineNotes.push(`${resolvedEvents.length} action(s) planifiée(s) ont été résolue(s) pendant votre absence.`);
    }

    return { state: updatedState, offlineNotes };
  } catch (err) {
    console.error('Erreur chargement monde persistant:', err);
    const fresh = createInitialWorldState();
    return { state: fresh, offlineNotes: ['État réinitialisé suite à une anomalie de données.'] };
  }
}

export function saveWorldState(state: WorldState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Erreur sauvegarde monde:', err);
  }
}

export function resetWorldToGenesis(): WorldState {
  localStorage.removeItem(STORAGE_KEY);
  const initial = createInitialWorldState();
  saveWorldState(initial);
  return initial;
}

export function getActiveCharacterId(): string {
  return localStorage.getItem(ACTIVE_CHAR_KEY) || 'char_marcus';
}

export function setActiveCharacterId(charId: string): void {
  localStorage.setItem(ACTIVE_CHAR_KEY, charId);
}
