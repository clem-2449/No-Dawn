/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Module `world` — Horloge mondiale persistante & continue
 * Formule déterministe:
 * GameMinutes = gameEpochStartMinutes + ((CurrentRealUtc - realEpochStartUtc) / 60000) * timeDilation
 * 
 * Par défaut: timeDilation = 5 (1 min réelle = 5 min de jeu).
 */

import { WorldClockState } from './types';

export const DEFAULT_TIME_DILATION = 5;

/**
 * Calcule l'heure de jeu courante en minutes de jeu depuis le début du monde.
 */
export function calculateCurrentGameMinutes(
  clock: WorldClockState,
  currentRealUtcMs: number = Date.now()
): number {
  if (clock.isPaused && clock.pausedAtUtc) {
    const elapsedRealMs = Math.max(0, clock.pausedAtUtc - clock.realEpochStartUtc);
    const elapsedRealMinutes = elapsedRealMs / 60000;
    return Math.floor(clock.gameEpochStartMinutes + elapsedRealMinutes * clock.timeDilation);
  }

  const elapsedRealMs = Math.max(0, currentRealUtcMs - clock.realEpochStartUtc);
  const elapsedRealMinutes = elapsedRealMs / 60000;
  return Math.floor(clock.gameEpochStartMinutes + elapsedRealMinutes * clock.timeDilation);
}

export interface FormattedGameTime {
  totalMinutes: number;
  day: number;
  hour: number;
  minute: number;
  formattedString: string;
  isNight: boolean;
}

/**
 * Convertit un total de minutes de jeu en structure lisible (Jour, Heure, Minute).
 * Début à Jour 1, 06:00 (Aube post-effondrement).
 */
export function formatGameTime(totalGameMinutes: number): FormattedGameTime {
  const MINUTES_PER_DAY = 1440; // 24 * 60
  const day = Math.floor(totalGameMinutes / MINUTES_PER_DAY) + 1;
  const minuteOfDay = totalGameMinutes % MINUTES_PER_DAY;
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedString = `Jour ${day}, ${pad(hour)}:${pad(minute)}`;
  const isNight = hour >= 21 || hour < 6;

  return {
    totalMinutes: totalGameMinutes,
    day,
    hour,
    minute,
    formattedString,
    isNight,
  };
}

/**
 * Calcule le temps réel restant en secondes pour atteindre une minute de jeu cible.
 */
export function realSecondsUntilGameMinute(
  targetGameMinutes: number,
  clock: WorldClockState,
  currentRealUtcMs: number = Date.now()
): number {
  const currentGameMinutes = calculateCurrentGameMinutes(clock, currentRealUtcMs);
  const remainingGameMinutes = Math.max(0, targetGameMinutes - currentGameMinutes);
  if (remainingGameMinutes === 0 || clock.timeDilation <= 0) return 0;

  const remainingRealMinutes = remainingGameMinutes / clock.timeDilation;
  return Math.ceil(remainingRealMinutes * 60);
}

/**
 * Convertit des minutes de jeu en durée réelle lisible (ex: "3 min réelles").
 */
export function formatRealEquivalentDuration(gameMinutes: number, timeDilation: number = DEFAULT_TIME_DILATION): string {
  const realMinutes = gameMinutes / timeDilation;
  if (realMinutes < 1) {
    const realSec = Math.round(realMinutes * 60);
    return `${realSec}s réelles`;
  }
  if (realMinutes >= 60) {
    const hours = Math.floor(realMinutes / 60);
    const mins = Math.round(realMinutes % 60);
    return `${hours}h ${mins}m réelles`;
  }
  return `${Math.round(realMinutes * 10) / 10} min réelles`;
}
