/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Tests unitaires de l'ordonnanceur d'événements et de l'idempotence
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveScheduledEvents, scheduleMovement } from './scheduler';
import { WorldState, Character, Location } from './types';

const baseLocationA: Location = {
  id: 'loc_a',
  name: 'Refuge Sécurisé',
  region: 'Ouest',
  description: 'Un abri fortifié.',
  isSafeZone: true,
  dangerLevel: 'safe',
  scavengePotential: 10,
  connections: [],
};

const baseLocationB: Location = {
  id: 'loc_b',
  name: 'Entrepôt Abandonné',
  region: 'Nord',
  description: 'Entrepôt silencieux mais suspect.',
  isSafeZone: false,
  dangerLevel: 'contested',
  scavengePotential: 50,
  connections: [],
};

const baseCharacter: Character = {
  id: 'char_elena',
  name: 'Elena Rostova',
  archetype: 'Mécanicienne',
  biography: 'Débrouillarde et vigilante.',
  currentLocationId: 'loc_a',
  status: 'connected',
  stats: {
    health: 95,
    maxHealth: 100,
    fatigue: 20,
    hunger: 10,
    thirst: 15,
    morale: 80,
  },
  attributes: {
    strength: 14,
    agility: 13,
    intelligence: 15,
    endurance: 12,
    perception: 11,
  },
  inventory: [],
  safeZoneProtection: true,
  createdUtc: Date.now(),
};

test('Scheduler: Déplacement programmé et résolu quand l\'heure est atteinte', () => {
  const movementEvent = scheduleMovement(baseCharacter, baseLocationA, baseLocationB, 30, 100);
  assert.equal(movementEvent.startedAtGameMinutes, 100);
  assert.equal(movementEvent.completesAtGameMinutes, 130);
  assert.equal(movementEvent.status, 'pending');

  const initialState: WorldState = {
    worldId: 'world_test',
    name: 'Terre Déchue',
    clock: {
      realEpochStartUtc: Date.now(),
      gameEpochStartMinutes: 100,
      timeDilation: 5,
      isPaused: false,
    },
    locations: { loc_a: baseLocationA, loc_b: baseLocationB },
    characters: { char_elena: baseCharacter },
    events: [movementEvent],
    logs: [],
  };

  // 1. À t = 120 (avant la fin) : rien n'est résolu
  const stepBefore = resolveScheduledEvents(initialState, 120);
  assert.equal(stepBefore.resolvedEvents.length, 0);
  assert.equal(stepBefore.updatedState.characters.char_elena.currentLocationId, 'loc_a');

  // 2. À t = 135 (après la fin) : résolu avec succès
  const stepAfter = resolveScheduledEvents(initialState, 135);
  assert.equal(stepAfter.resolvedEvents.length, 1);
  assert.equal(stepAfter.resolvedEvents[0].status, 'completed');
  assert.equal(stepAfter.updatedState.characters.char_elena.currentLocationId, 'loc_b');
  assert.equal(stepAfter.updatedState.characters.char_elena.safeZoneProtection, false);
  assert.ok(stepAfter.newLogs.length > 0);

  // 3. IDEMPOTENCE : Réexécuter la même fonction sur l'état déjà résolu ne doit pas réappliquer l'événement
  const stepReplay = resolveScheduledEvents(stepAfter.updatedState, 140);
  assert.equal(stepReplay.resolvedEvents.length, 0);
  assert.equal(stepReplay.newLogs.length, 0);
});
