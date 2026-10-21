/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Module `safety` — Gestion des refuges (zones sûres), déconnexions et calcul des risques
 */

import { Character, Location, WorldLogEntry } from './types';

export interface DisconnectEvaluation {
  isSafe: boolean;
  warnings: string[];
  recommendations: string[];
  projectedRecovery: {
    fatiguePerHour: number;
    healthPerHour: number;
  };
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical';
}

/**
 * Évalue la sécurité d'un personnage pour une déconnexion à son emplacement actuel.
 */
export function evaluateDisconnection(character: Character, location: Location): DisconnectEvaluation {
  if (location.isSafeZone) {
    const isCrisis = location.safeZoneDetails?.alertStatus === 'crisis';
    return {
      isSafe: !isCrisis,
      warnings: isCrisis
        ? ['ATTENTION: Ce refuge est actuellement en état de CRISE. La protection peut être compromise.']
        : [],
      recommendations: [
        'Votre personnage bénéficie de la protection du refuge.',
        'La fatigue diminuera progressivement.',
        'Les blessures guériront lentement avec le temps de jeu.',
      ],
      projectedRecovery: {
        fatiguePerHour: isCrisis ? 2 : 10,
        healthPerHour: 3,
      },
      riskLevel: isCrisis ? 'moderate' : 'none',
    };
  }

  // Zone non sûre
  const warnings: string[] = [
    `DANGER: ${location.name} n'est PAS une zone sécurisée (${location.dangerLevel.toUpperCase()}).`,
    'Votre personnage restera physiquement présent dans le monde pendant votre absence.',
    'Il reste exposé aux rôdeurs, pillards et intempéries.',
  ];

  let riskLevel: DisconnectEvaluation['riskLevel'] = 'moderate';
  if (location.dangerLevel === 'deadly' || location.dangerLevel === 'infested') {
    riskLevel = 'critical';
    warnings.push('Zone hautement infestée : risque d\'attaque mortelle durant votre sommeil ou absence !');
  }

  return {
    isSafe: false,
    warnings,
    recommendations: [
      'Il est fortement conseillé de rejoindre un refuge avant de quitter la partie.',
      'Si vous devez partir maintenant, trouvez une cachette ou barricadez un point d\'accès.',
    ],
    projectedRecovery: {
      fatiguePerHour: 1, // Récupération très faible à cause de la tension
      healthPerHour: 0,
    },
    riskLevel,
  };
}

export interface DisconnectSimulationResult {
  updatedCharacter: Character;
  elapsedGameMinutes: number;
  logs: WorldLogEntry[];
}

/**
 * Simule le temps écoulé pour un personnage déconnecté (ex: à sa reconnexion).
 * Déterministe et idempotent : basé sur l'heure de dernière déconnexion et l'heure actuelle.
 */
export function simulateOfflineProgress(
  character: Character,
  location: Location,
  currentGameMinutes: number,
  lastKnownGameMinutes: number
): DisconnectSimulationResult {
  const elapsedMinutes = Math.max(0, currentGameMinutes - lastKnownGameMinutes);
  if (elapsedMinutes === 0) {
    return {
      updatedCharacter: { ...character },
      elapsedGameMinutes: 0,
      logs: [],
    };
  }

  const updated: Character = {
    ...character,
    stats: { ...character.stats },
  };

  const logs: WorldLogEntry[] = [];
  const hoursElapsed = elapsedMinutes / 60;

  if (character.status === 'disconnected_safe' && location.isSafeZone) {
    // Récupération progressive
    const fatigueRecovered = Math.min(updated.stats.fatigue, Math.floor(hoursElapsed * 8));
    const healthHealed = Math.min(
      updated.stats.maxHealth - updated.stats.health,
      Math.floor(hoursElapsed * 2)
    );

    updated.stats.fatigue = Math.max(0, updated.stats.fatigue - fatigueRecovered);
    updated.stats.health = Math.min(updated.stats.maxHealth, updated.stats.health + healthHealed);

    // Faim et soif augmentent modérément
    updated.stats.hunger = Math.min(100, updated.stats.hunger + Math.floor(hoursElapsed * 2));
    updated.stats.thirst = Math.min(100, updated.stats.thirst + Math.floor(hoursElapsed * 3));

    logs.push({
      id: `offline_rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      gameTimeMinutes: currentGameMinutes,
      realTimestampUtc: Date.now(),
      characterId: character.id,
      characterName: character.name,
      category: 'recovery',
      title: 'Repos en zone sûre',
      content: `${character.name} s'est reposé(e) en sécurité à ${location.name} pendant ${Math.floor(elapsedMinutes)} minutes de jeu. Fatigue -${fatigueRecovered}, Santé +${healthHealed}.`,
    });
  } else if (character.status === 'disconnected_hazard' || !location.isSafeZone) {
    // Exposition aux risques
    const fatigueIncrease = Math.min(30, Math.floor(hoursElapsed * 3));
    updated.stats.fatigue = Math.min(100, updated.stats.fatigue + fatigueIncrease);
    updated.stats.hunger = Math.min(100, updated.stats.hunger + Math.floor(hoursElapsed * 3));
    updated.stats.thirst = Math.min(100, updated.stats.thirst + Math.floor(hoursElapsed * 4));

    // Si zone infestée ou mortelle, dégâts possibles de stress / rôdeurs
    if (location.dangerLevel === 'infested' || location.dangerLevel === 'deadly') {
      const dangerDmg = Math.min(25, Math.floor(hoursElapsed * 4));
      updated.stats.health = Math.max(10, updated.stats.health - dangerDmg);
      logs.push({
        id: `offline_haz_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        gameTimeMinutes: currentGameMinutes,
        realTimestampUtc: Date.now(),
        characterId: character.id,
        characterName: character.name,
        category: 'hazard',
        title: 'Exposition aux dangers nocturnes',
        content: `${character.name} est resté(e) sans protection à ${location.name} pendant ${Math.floor(elapsedMinutes)} minutes de jeu. Sommeil agité, santé éprouvée (-${dangerDmg} PV).`,
      });
    } else {
      logs.push({
        id: `offline_haz_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        gameTimeMinutes: currentGameMinutes,
        realTimestampUtc: Date.now(),
        characterId: character.id,
        characterName: character.name,
        category: 'hazard',
        title: 'Bivouac précaire',
        content: `${character.name} a passé ${Math.floor(elapsedMinutes)} minutes de jeu hors refuge. Le repos a été incomplet.`,
      });
    }
  }

  return {
    updatedCharacter: updated,
    elapsedGameMinutes: elapsedMinutes,
    logs,
  };
}
