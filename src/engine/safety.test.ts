/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Tests unitaires du module de sécurité et déconnexion
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDisconnection, simulateOfflineProgress } from './safety';
import { Character, Location } from './types';

const mockSafeLocation: Location = {
  id: 'loc_refuge',
  name: 'Refuge de la Vieille Église',
  region: 'Secteur Ouest',
  description: 'Un sanctuaire fortifié tenu par une communauté de survivants.',
  isSafeZone: true,
  safeZoneDetails: {
    shelterName: 'La Nef Fortifiée',
    defenseRating: 85,
    medicAvailable: true,
    waterAccess: true,
    alertStatus: 'calm',
  },
  dangerLevel: 'safe',
  scavengePotential: 10,
  connections: [],
};

const mockDangerousLocation: Location = {
  id: 'loc_pharmacie',
  name: 'Pharmacie du Carrefour',
  region: 'Centre-ville',
  description: 'Bâtiment aux vitres brisées entouré de rôdeurs.',
  isSafeZone: false,
  dangerLevel: 'infested',
  scavengePotential: 75,
  connections: [],
};

const mockCharacter: Character = {
  id: 'char_marcus',
  name: 'Marcus Vance',
  archetype: 'Ancien infirmier',
  biography: 'Méthodique et calme sous la pression.',
  currentLocationId: 'loc_refuge',
  status: 'connected',
  stats: {
    health: 70,
    maxHealth: 100,
    fatigue: 80,
    hunger: 20,
    thirst: 20,
    morale: 65,
  },
  attributes: {
    strength: 12,
    agility: 10,
    intelligence: 16,
    endurance: 13,
    perception: 14,
  },
  inventory: [],
  safeZoneProtection: true,
  createdUtc: Date.now(),
};

test('Sécurité: Évaluation positive dans un refuge calme', () => {
  const evalResult = evaluateDisconnection(mockCharacter, mockSafeLocation);
  assert.equal(evalResult.isSafe, true);
  assert.equal(evalResult.riskLevel, 'none');
  assert.equal(evalResult.warnings.length, 0);
  assert.ok(evalResult.projectedRecovery.fatiguePerHour > 0);
});

test('Sécurité: Évaluation d\'alerte en zone infestée', () => {
  const evalResult = evaluateDisconnection(mockCharacter, mockDangerousLocation);
  assert.equal(evalResult.isSafe, false);
  assert.equal(evalResult.riskLevel, 'critical');
  assert.ok(evalResult.warnings.length > 0);
  assert.ok(evalResult.warnings.some(w => w.includes('DANGER')));
});

test('Sécurité: Déconnexion en refuge permet la récupération de fatigue et santé', () => {
  const disconnectedChar: Character = {
    ...mockCharacter,
    status: 'disconnected_safe',
  };

  // Simulation de 180 minutes de jeu (3 heures de jeu = 36 minutes réelles)
  const result = simulateOfflineProgress(
    disconnectedChar,
    mockSafeLocation,
    540, // currentGameMinutes
    360  // lastKnownGameMinutes
  );

  assert.ok(result.updatedCharacter.stats.fatigue < disconnectedChar.stats.fatigue);
  assert.ok(result.updatedCharacter.stats.health >= disconnectedChar.stats.health);
  assert.equal(result.logs.length, 1);
  assert.equal(result.logs[0].category, 'recovery');
});

test('Sécurité: Déconnexion hors refuge expose le personnage aux risques', () => {
  const exposedChar: Character = {
    ...mockCharacter,
    currentLocationId: 'loc_pharmacie',
    status: 'disconnected_hazard',
  };

  // Simulation de 300 minutes de jeu (5 heures) en zone infestée
  const result = simulateOfflineProgress(
    exposedChar,
    mockDangerousLocation,
    660,
    360
  );

  // La santé diminue à cause du danger et la fatigue ne diminue pas
  assert.ok(result.updatedCharacter.stats.health < exposedChar.stats.health);
  assert.equal(result.logs.length, 1);
  assert.equal(result.logs[0].category, 'hazard');
});
