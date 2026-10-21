/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Tests unitaires de l'analyseur d'intentions et validation des actions libres
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePlayerIntent, executeValidatedAction } from './actionParser';
import { createInitialWorldState } from './initialData';

test('ActionParser: Détection sémantique d\'une fouille en langage naturel', () => {
  const world = createInitialWorldState();
  const marcus = world.characters.char_marcus;
  const loc = world.locations[marcus.currentLocationId];

  const intent = parsePlayerIntent(
    'Je fouille discrètement la pharmacie pour trouver des antibiotiques.',
    marcus,
    loc,
    world.locations
  );

  assert.equal(intent.type, 'scavenge');
  assert.ok(intent.confidence >= 0.8);
});

test('ActionParser: Détection sémantique de déplacement vers un lieu existant', () => {
  const world = createInitialWorldState();
  const marcus = world.characters.char_marcus;
  const loc = world.locations[marcus.currentLocationId];

  const intent = parsePlayerIntent(
    'Je me déplace vers la Pharmacie Saint-Martin avec prudence.',
    marcus,
    loc,
    world.locations
  );

  assert.equal(intent.type, 'movement');
  assert.equal(intent.targetLocationId, 'loc_pharmacie');
});

test('ActionParser: Validation déterministe bloque une action si le personnage est déjà occupé', () => {
  const world = createInitialWorldState();
  const marcus = world.characters.char_marcus;
  // Ajouter un événement en cours
  world.events.push({
    id: 'evt_test',
    characterId: marcus.id,
    type: 'movement',
    startedAtGameMinutes: 360,
    completesAtGameMinutes: 380,
    status: 'pending',
    payload: {},
    description: 'En route...',
  });

  const intent = parsePlayerIntent('Fouiller la zone', marcus, world.locations[marcus.currentLocationId], world.locations);
  const result = executeValidatedAction(intent, marcus, world, 365);

  assert.equal(result.success, false);
  assert.ok(result.feedbackMessage.includes('déjà engagé'));
});
