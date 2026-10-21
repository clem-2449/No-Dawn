/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RPG Zombie — Types fondamentaux du moteur de jeu déterministe
 */

export type CharacterStatus = 'connected' | 'disconnected_safe' | 'disconnected_hazard';

export interface CharacterStats {
  health: number; // 0 - 100
  maxHealth: number;
  fatigue: number; // 0 (reposé) - 100 (épuisé)
  hunger: number; // 0 (rassasié) - 100 (affamé)
  thirst: number; // 0 (hydraté) - 100 (déshydraté)
  morale: number; // 0 - 100
}

export interface CharacterAttributes {
  strength: number;
  agility: number;
  intelligence: number;
  endurance: number;
  perception: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'medical' | 'weapon' | 'food' | 'water' | 'tool' | 'resource';
  quantity: number;
  condition: number; // 0 - 100%
  description: string;
  weightKg: number;
}

export interface Character {
  id: string;
  name: string;
  archetype: string;
  biography: string;
  currentLocationId: string;
  status: CharacterStatus;
  stats: CharacterStats;
  attributes: CharacterAttributes;
  inventory: InventoryItem[];
  lastDisconnectUtc?: number; // epoch ms
  safeZoneProtection: boolean;
  avatarUrl?: string;
  createdUtc: number;
}

export type DangerLevel = 'safe' | 'contested' | 'infested' | 'deadly';

export interface LocationConnection {
  targetLocationId: string;
  travelTimeGameMinutes: number;
  riskFactor: number; // 0 to 1
  description: string;
}

export interface Location {
  id: string;
  name: string;
  region: string;
  description: string;
  isSafeZone: boolean;
  safeZoneDetails?: {
    shelterName: string;
    defenseRating: number;
    medicAvailable: boolean;
    waterAccess: boolean;
    alertStatus: 'calm' | 'alert' | 'crisis';
  };
  dangerLevel: DangerLevel;
  scavengePotential: number; // 0 to 100
  connections: LocationConnection[];
}

export type EventType = 'movement' | 'scavenge' | 'rest' | 'craft' | 'crisis';

export interface ScheduledEvent {
  id: string;
  characterId: string;
  type: EventType;
  startedAtGameMinutes: number;
  completesAtGameMinutes: number;
  status: 'pending' | 'completed' | 'cancelled';
  payload: Record<string, any>;
  description: string;
}

export interface WorldClockState {
  realEpochStartUtc: number; // Reference time in real-world UTC ms
  gameEpochStartMinutes: number; // Starting game time in minutes since outbreak
  timeDilation: number; // Default 5: 1 real min = 5 game min
  isPaused: boolean;
  pausedAtUtc?: number;
}

export interface WorldLogEntry {
  id: string;
  gameTimeMinutes: number;
  realTimestampUtc: number;
  characterId?: string;
  characterName?: string;
  category: 'system' | 'narrative' | 'action' | 'movement' | 'hazard' | 'recovery';
  title: string;
  content: string;
}

export interface WorldState {
  worldId: string;
  name: string;
  clock: WorldClockState;
  locations: Record<string, Location>;
  characters: Record<string, Character>;
  events: ScheduledEvent[];
  logs: WorldLogEntry[];
}
