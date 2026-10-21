/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Tests unitaires du module d'horloge persistante (node:test)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCurrentGameMinutes,
  formatGameTime,
  realSecondsUntilGameMinute,
  DEFAULT_TIME_DILATION,
} from './clock';
import { WorldClockState } from './types';

test('Horloge: 1 minute réelle équivaut exactement à 5 minutes de jeu par défaut', () => {
  const epoch = 1700000000000;
  const clock: WorldClockState = {
    realEpochStartUtc: epoch,
    gameEpochStartMinutes: 360, // Jour 1, 06:00
    timeDilation: 5,
    isPaused: false,
  };

  // Après 1 minute réelle (60 000 ms)
  const after1Min = calculateCurrentGameMinutes(clock, epoch + 60000);
  assert.equal(after1Min - clock.gameEpochStartMinutes, 5);

  // Après 1 heure réelle (3 600 000 ms) = 300 minutes de jeu (5 heures de jeu)
  const after1Hour = calculateCurrentGameMinutes(clock, epoch + 3600000);
  assert.equal(after1Hour - clock.gameEpochStartMinutes, 300);

  // Après 24 heures réelles = 5 jours de jeu (7200 minutes)
  const after24Hours = calculateCurrentGameMinutes(clock, epoch + 24 * 3600000);
  assert.equal(after24Hours - clock.gameEpochStartMinutes, 7200);
});

test('Horloge: Formatage Jour/Heure et détection jour/nuit', () => {
  // 360 minutes = 6h00 (Jour 1, Aube)
  const dawn = formatGameTime(360);
  assert.equal(dawn.day, 1);
  assert.equal(dawn.hour, 6);
  assert.equal(dawn.minute, 0);
  assert.equal(dawn.formattedString, 'Jour 1, 06:00');
  assert.equal(dawn.isNight, false);

  // 1380 minutes = 23h00 (Jour 1, Nuit)
  const night = formatGameTime(1380);
  assert.equal(night.isNight, true);

  // 1440 minutes = Jour 2, 00:00
  const nextDay = formatGameTime(1440);
  assert.equal(nextDay.day, 2);
  assert.equal(nextDay.hour, 0);
  assert.equal(nextDay.minute, 0);
});

test('Horloge: Calcul déterministe du compte à rebours réel pour un événement', () => {
  const epoch = 1700000000000;
  const clock: WorldClockState = {
    realEpochStartUtc: epoch,
    gameEpochStartMinutes: 0,
    timeDilation: 5,
    isPaused: false,
  };

  // Un événement prend 25 minutes de jeu -> doit prendre 5 minutes réelles = 300 secondes
  const targetMinute = 25;
  const remainingSeconds = realSecondsUntilGameMinute(targetMinute, clock, epoch);
  assert.equal(remainingSeconds, 300);
});
