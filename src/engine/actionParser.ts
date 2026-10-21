/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Module `actions` — Interprétation des intentions en langage naturel & validation déterministe
 * L'action libre est interprétée en commande structurée, vérifiée rigoureusement
 * par les règles du moteur, puis résolue.
 */

import { Character, Location, ScheduledEvent, WorldState, InventoryItem } from './types';
import { scheduleMovement, scheduleScavenge } from './scheduler';

export interface ActionIntent {
  type: 'scavenge' | 'movement' | 'rest' | 'heal' | 'consume' | 'inspect' | 'unknown';
  targetLocationId?: string;
  itemId?: string;
  confidence: number;
  rawText: string;
  explanation: string;
}

export interface ActionResult {
  success: boolean;
  intent: ActionIntent;
  feedbackMessage: string;
  narrativeDescription: string;
  createdEvent?: ScheduledEvent;
  statDeltas?: Partial<Character['stats']>;
  inventoryConsumed?: string[];
  inventoryAdded?: InventoryItem[];
}

/**
 * Analyse l'intention du joueur en langage naturel.
 * (Moteur de reconnaissance déterministe avec motifs sémantiques).
 */
export function parsePlayerIntent(
  rawInput: string,
  character: Character,
  currentLocation: Location,
  availableLocations: Record<string, Location>
): ActionIntent {
  const text = rawInput.toLowerCase().trim();

  // 1. Déplacement
  if (
    text.includes('va') ||
    text.includes('aller') ||
    text.includes('déplace') ||
    text.includes('marche vers') ||
    text.includes('cours vers') ||
    text.includes('rejoint') ||
    text.includes('rejoindre') ||
    text.includes('direction') ||
    text.includes('move') ||
    text.includes('traverser la rue')
  ) {
    // Identifier la destination
    let targetLocId: string | undefined;
    for (const [id, loc] of Object.entries(availableLocations)) {
      const nameParts = loc.name.toLowerCase().split(' ');
      if (
        text.includes(loc.name.toLowerCase()) ||
        nameParts.some(part => part.length > 4 && text.includes(part))
      ) {
        targetLocId = id;
        break;
      }
    }

    if (targetLocId) {
      return {
        type: 'movement',
        targetLocationId: targetLocId,
        confidence: 0.9,
        rawText: rawInput,
        explanation: `Intention détectée : Déplacement vers ${availableLocations[targetLocId]?.name}`,
      };
    }
  }

  // 2. Fouille / Scavenge
  if (
    text.includes('fouille') ||
    text.includes('fouiller') ||
    text.includes('cherche') ||
    text.includes('chercher') ||
    text.includes('explorer') ||
    text.includes('trouver') ||
    text.includes('loot') ||
    text.includes('scavenge') ||
    text.includes('inspecter les placards') ||
    text.includes('antibiotique')
  ) {
    return {
      type: 'scavenge',
      confidence: 0.95,
      rawText: rawInput,
      explanation: `Intention détectée : Fouille des environs à ${currentLocation.name}`,
    };
  }

  // 3. Repos / Sommeil / Barricade
  if (
    text.includes('repose') ||
    text.includes('reposer') ||
    text.includes('dormir') ||
    text.includes('sommeil') ||
    text.includes('sieste') ||
    text.includes('barricade') ||
    text.includes('barricader') ||
    text.includes('bivouac') ||
    text.includes('endroit pour dormir')
  ) {
    return {
      type: 'rest',
      confidence: 0.9,
      rawText: rawInput,
      explanation: 'Intention détectée : Repos et récupération d\'énergie',
    };
  }

  // 4. Soins / Médical
  if (
    text.includes('soin') ||
    text.includes('soigner') ||
    text.includes('pansement') ||
    text.includes('bandage') ||
    text.includes('trousse') ||
    text.includes('médicament') ||
    text.includes('désinfecter')
  ) {
    return {
      type: 'heal',
      confidence: 0.85,
      rawText: rawInput,
      explanation: 'Intention détectée : Application de soins médicaux',
    };
  }

  // 5. Boire / Manger
  if (
    text.includes('bois') ||
    text.includes('boire') ||
    text.includes('eau') ||
    text.includes('gourde') ||
    text.includes('mange') ||
    text.includes('manger') ||
    text.includes('ration')
  ) {
    return {
      type: 'consume',
      confidence: 0.85,
      rawText: rawInput,
      explanation: 'Intention détectée : Consommation de vivres ou d\'eau',
    };
  }

  // 6. Observer / Guetter
  if (
    text.includes('observe') ||
    text.includes('observer') ||
    text.includes('regarde') ||
    text.includes('guette') ||
    text.includes('vigilance') ||
    text.includes('inspecte')
  ) {
    return {
      type: 'inspect',
      confidence: 0.8,
      rawText: rawInput,
      explanation: 'Intention détectée : Observation tactique du secteur',
    };
  }

  return {
    type: 'unknown',
    confidence: 0.2,
    rawText: rawInput,
    explanation: 'Intention non structurée automatiquement par les mots-clés.',
  };
}

/**
 * Valide et applique l'action selon les règles strictes du moteur.
 */
export function executeValidatedAction(
  intent: ActionIntent,
  character: Character,
  worldState: WorldState,
  currentGameMinutes: number
): ActionResult {
  const currentLocation = worldState.locations[character.currentLocationId];

  // Vérifier si le personnage a déjà une action en cours
  const pendingEvent = worldState.events.find(
    e => e.characterId === character.id && e.status === 'pending'
  );
  if (pendingEvent) {
    return {
      success: false,
      intent,
      feedbackMessage: `Action impossible : ${character.name} est déjà engagé(e) dans "${pendingEvent.description}" jusqu'à t=${pendingEvent.completesAtGameMinutes} min.`,
      narrativeDescription: `Vous êtes actuellement occupé(e). Vous devez attendre l'achèvement de votre activité en cours avant d'en entreprendre une autre.`,
    };
  }

  switch (intent.type) {
    case 'movement': {
      if (!intent.targetLocationId) {
        return {
          success: false,
          intent,
          feedbackMessage: 'Destination inconnue ou non spécifiée.',
          narrativeDescription: 'Vous hésitez sur le chemin à emprunter. Aucun lieu accessible ne correspond à votre demande.',
        };
      }

      if (intent.targetLocationId === character.currentLocationId) {
        return {
          success: false,
          intent,
          feedbackMessage: 'Vous êtes déjà à cet emplacement.',
          narrativeDescription: 'Inutile de partir : vous vous trouvez déjà précisément ici.',
        };
      }

      const connection = currentLocation.connections.find(
        c => c.targetLocationId === intent.targetLocationId
      );
      if (!connection) {
        return {
          success: false,
          intent,
          feedbackMessage: `Aucun passage direct entre ${currentLocation.name} et ce lieu.`,
          narrativeDescription: 'Les rues sont bloquées ou trop lointaines pour s\'y rendre directement sans étape intermédiaire.',
        };
      }

      if (character.stats.fatigue >= 90) {
        return {
          success: false,
          intent,
          feedbackMessage: 'Fatigue critique : vous devez vous reposer avant de voyager.',
          narrativeDescription: 'Vos jambes tremblent, votre vision se brouille d\'épuisement. Tenter ce trajet maintenant serait suicidaire.',
        };
      }

      const targetLoc = worldState.locations[intent.targetLocationId];
      const moveEvent = scheduleMovement(
        character,
        currentLocation,
        targetLoc,
        connection.travelTimeGameMinutes,
        currentGameMinutes
      );

      return {
        success: true,
        intent,
        feedbackMessage: `Déplacement planifié vers ${targetLoc.name} (${connection.travelTimeGameMinutes} min de jeu).`,
        narrativeDescription: `Vous rassemblez vos affaires et commencez votre marche prudente vers ${targetLoc.name}. Vous observez les ombres et contournez les débris.`,
        createdEvent: moveEvent,
      };
    }

    case 'scavenge': {
      if (character.stats.fatigue >= 85) {
        return {
          success: false,
          intent,
          feedbackMessage: 'Trop fatigué(e) pour fouiller efficacement.',
          narrativeDescription: 'La fatigue émousse vos réflexes. Vous risqueriez d\'alerter les infectés en renversant du matériel.',
        };
      }

      // Générer du butin cohérent avec le lieu
      const potentialLoot: InventoryItem[] = [];
      if (currentLocation.id === 'loc_pharmacie') {
        potentialLoot.push({
          id: `loot_antibio_${Date.now()}`,
          name: 'Flacon d\'amoxicilline',
          category: 'medical',
          quantity: 1,
          condition: 90,
          description: 'Antibiotiques à large spectre vitaux contre les infections bactériennes secondaires.',
          weightKg: 0.2,
        });
      } else if (currentLocation.id === 'loc_station') {
        potentialLoot.push({
          id: `loot_tool_${Date.now()}`,
          name: 'Clé à molette 12mm',
          category: 'tool',
          quantity: 1,
          condition: 75,
          description: 'Robuste clé mécanique pour la tuyauterie ou le bricolage d\'armes.',
          weightKg: 0.8,
        });
      } else {
        potentialLoot.push({
          id: `loot_scraps_${Date.now()}`,
          name: 'Chiffons et bande adhésive',
          category: 'resource',
          quantity: 2,
          condition: 60,
          description: 'Matériaux de fortune pour colmater des blessures ou assembler des torches.',
          weightKg: 0.3,
        });
      }

      const scavDuration = 20; // 20 minutes de jeu
      const scavEvent = scheduleScavenge(
        character,
        currentLocation,
        scavDuration,
        currentGameMinutes,
        potentialLoot
      );

      return {
        success: true,
        intent,
        feedbackMessage: `Fouille enclenchée (${scavDuration} min de jeu).`,
        narrativeDescription: `Vous fouillez méticuleusement tiroirs, étagères et recoins sombres de ${currentLocation.name}, le souffle court et l'oreille aux aguets.`,
        createdEvent: scavEvent,
      };
    }

    case 'rest': {
      const restDuration = 60; // 1 heure de jeu
      const isShelter = currentLocation.isSafeZone;
      const fatigueRestored = isShelter ? 40 : 20;
      const healthRestored = isShelter ? 15 : 5;

      const restEvent: ScheduledEvent = {
        id: `evt_rest_${character.id}_${currentGameMinutes}_${Math.random().toString(36).slice(2, 6)}`,
        characterId: character.id,
        type: 'rest',
        startedAtGameMinutes: currentGameMinutes,
        completesAtGameMinutes: currentGameMinutes + restDuration,
        status: 'pending',
        payload: {
          fatigueRestored,
          healthRestored,
          isShelter,
        },
        description: `Repos réparateur (${restDuration} min de jeu)${isShelter ? ' en refuge' : ' sous haute vigilance'}`,
      };

      return {
        success: true,
        intent,
        feedbackMessage: `Repos en cours (${restDuration} min de jeu).`,
        narrativeDescription: isShelter
          ? `Vous vous allongez sur une paillasse sécurisée au sein de ${currentLocation.name}. L'atmosphère est calme, vous pouvez relâcher votre vigilance.`
          : `Vous barricadez sommairement une porte à ${currentLocation.name} et somnolez d'un œil, votre arme posée sur vos genoux.`,
        createdEvent: restEvent,
      };
    }

    case 'heal': {
      const medItem = character.inventory.find(i => i.category === 'medical' && i.quantity > 0);
      if (!medItem) {
        return {
          success: false,
          intent,
          feedbackMessage: 'Aucun matériel médical disponible dans votre inventaire.',
          narrativeDescription: 'Vous cherchez fébrilement dans votre sac mais ne trouvez ni pansement ni compresse stérilisée.',
        };
      }

      const healAmount = 25;
      return {
        success: true,
        intent,
        feedbackMessage: `Soins appliqués avec ${medItem.name} (+${healAmount} PV).`,
        narrativeDescription: `Vous appliquez minutieusement le matériel de soin sur vos plaies. La douleur diminue et le saignement s'arrête.`,
        statDeltas: {
          health: Math.min(character.stats.maxHealth, character.stats.health + healAmount),
        },
        inventoryConsumed: [medItem.id],
      };
    }

    case 'consume': {
      const consumable = character.inventory.find(i => (i.category === 'food' || i.category === 'water') && i.quantity > 0);
      if (!consumable) {
        return {
          success: false,
          intent,
          feedbackMessage: 'Ni eau ni vivre consommable dans votre inventaire.',
          narrativeDescription: 'Vous secouez votre gourde vide et fouillez vos poches sans trouver le moindre morceau de pain sec.',
        };
      }

      const isWater = consumable.category === 'water';
      return {
        success: true,
        intent,
        feedbackMessage: `${consumable.name} consommé(e).`,
        narrativeDescription: isWater
          ? 'Vous buvez de grandes gorgées d\'eau fraîche. Votre gorge sèche s\'apaise instantanément.'
          : 'Vous avalez vos rations. Votre organisme reprend des forces indispensables.',
        statDeltas: isWater ? { thirst: Math.max(0, character.stats.thirst - 40) } : { hunger: Math.max(0, character.stats.hunger - 40) },
        inventoryConsumed: [consumable.id],
      };
    }

    case 'inspect': {
      return {
        success: true,
        intent,
        feedbackMessage: `Observation terminée de ${currentLocation.name}.`,
        narrativeDescription: `Vous observez attentivement le secteur. Le niveau de menace est "${currentLocation.dangerLevel}". Le potentiel de fouille est estimé à ${currentLocation.scavengePotential}%. ${currentLocation.description}`,
      };
    }

    default: {
      return {
        success: false,
        intent,
        feedbackMessage: 'Intention non reconnue par le moteur de règles.',
        narrativeDescription: 'Votre action n\'a pas pu être traduite en une règle concrète de survie. Essayez d\'exprimer une intention comme "fouiller", "se déplacer vers [lieu]", "se reposer", ou "se soigner".',
      };
    }
  }
}
