/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Données initiales conformes au cahier des charges Phase 1:
 * - 1 monde persistant
 * - 1 petite région explorable reliée
 * - 1 refuge sûr (Refuge de la Vieille Église)
 * - 2 personnages de test (Marcus Vance & Elena Rostova)
 */

import { WorldState, Location, Character } from './types';

export const INITIAL_LOCATIONS: Record<string, Location> = {
  loc_refuge: {
    id: 'loc_refuge',
    name: 'Refuge de la Vieille Église',
    region: 'District du Crépuscule',
    description: 'Une ancienne église en pierre dont le cloître et les portails ont été consolidés par des bastaings et barbelés. Une poignée de survivants y veille au calme.',
    isSafeZone: true,
    safeZoneDetails: {
      shelterName: 'Sanctuaire de Sainte-Geneviève',
      defenseRating: 85,
      medicAvailable: true,
      waterAccess: true,
      alertStatus: 'calm',
    },
    dangerLevel: 'safe',
    scavengePotential: 15,
    connections: [
      {
        targetLocationId: 'loc_pharmacie',
        travelTimeGameMinutes: 15,
        riskFactor: 0.25,
        description: 'Rue pavée longeant le cimetière et la place centrale.',
      },
      {
        targetLocationId: 'loc_station',
        travelTimeGameMinutes: 25,
        riskFactor: 0.35,
        description: 'Avenue de la République, jonchée de carcasses de véhicules calcinés.',
      },
    ],
  },
  loc_pharmacie: {
    id: 'loc_pharmacie',
    name: 'Pharmacie Saint-Martin',
    region: 'District du Crépuscule',
    description: 'La vitrine est fracassée, les étals renversés. Une odeur d\'antiseptique rance flotte dans l\'air. Deux rôdeurs errent au carrefour voisin.',
    isSafeZone: false,
    dangerLevel: 'infested',
    scavengePotential: 80,
    connections: [
      {
        targetLocationId: 'loc_refuge',
        travelTimeGameMinutes: 15,
        riskFactor: 0.2,
        description: 'Repli vers le clocher de la vieille église.',
      },
      {
        targetLocationId: 'loc_station',
        travelTimeGameMinutes: 20,
        riskFactor: 0.4,
        description: 'Ruelle étroite derrière les entrepôts de livraison.',
      },
      {
        targetLocationId: 'loc_barricade',
        travelTimeGameMinutes: 30,
        riskFactor: 0.5,
        description: 'Boulevard périphérique bordé de barricades éventrées.',
      },
    ],
  },
  loc_station: {
    id: 'loc_station',
    name: 'Station-Service des Pins',
    region: 'District du Crépuscule',
    description: 'Pompes à essence déconnectées, magasin de station pillé mais l\'atelier mécanique à l\'arrière possède encore une porte blindée semi-verrouillée.',
    isSafeZone: false,
    dangerLevel: 'contested',
    scavengePotential: 65,
    connections: [
      {
        targetLocationId: 'loc_refuge',
        travelTimeGameMinutes: 25,
        riskFactor: 0.35,
        description: 'Retour vers le sanctuaire par l\'avenue.',
      },
      {
        targetLocationId: 'loc_pharmacie',
        travelTimeGameMinutes: 20,
        riskFactor: 0.35,
        description: 'Passage par la cour des livraisons.',
      },
    ],
  },
  loc_barricade: {
    id: 'loc_barricade',
    name: 'Poste de Contrôle Militaire Est',
    region: 'District du Crépuscule',
    description: 'Sacs de sable affaissés, mirador en bois instable et carcasse de camion blindé. Point de passage vers les zones non cartographiées.',
    isSafeZone: false,
    dangerLevel: 'deadly',
    scavengePotential: 90,
    connections: [
      {
        targetLocationId: 'loc_pharmacie',
        travelTimeGameMinutes: 30,
        riskFactor: 0.55,
        description: 'Axe principal vers le centre médical.',
      },
    ],
  },
};

export const INITIAL_CHARACTERS: Record<string, Character> = {
  char_marcus: {
    id: 'char_marcus',
    name: 'Marcus Vance',
    archetype: 'Ancien infirmier urgentiste',
    biography: 'Méthodique, pragmatique et résilient. Il a vu l\'effondrement de l\'hôpital général aux premières heures de la contagion.',
    currentLocationId: 'loc_refuge',
    status: 'connected',
    stats: {
      health: 85,
      maxHealth: 100,
      fatigue: 25,
      hunger: 30,
      thirst: 20,
      morale: 70,
    },
    attributes: {
      strength: 11,
      agility: 12,
      intelligence: 16,
      endurance: 13,
      perception: 15,
    },
    inventory: [
      {
        id: 'item_medikit_1',
        name: 'Trousse de premiers secours',
        category: 'medical',
        quantity: 2,
        condition: 90,
        description: 'Bandages compressifs, antiseptique et suture stérile.',
        weightKg: 0.8,
      },
      {
        id: 'item_water_1',
        name: 'Gourde filtrante (50cl)',
        category: 'water',
        quantity: 1,
        condition: 100,
        description: 'Eau potable filtrée.',
        weightKg: 0.6,
      },
      {
        id: 'item_knife_1',
        name: 'Bistouri de chasse',
        category: 'weapon',
        quantity: 1,
        condition: 85,
        description: 'Lame tranchante utile pour les soins comme pour la défense rapprochée.',
        weightKg: 0.3,
      },
    ],
    safeZoneProtection: true,
    createdUtc: Date.now() - 3600000,
  },
  char_elena: {
    id: 'char_elena',
    name: 'Elena Rostova',
    archetype: 'Mécanicienne & Bricoleuse',
    biography: 'Spécialiste de la survie industrielle, capable de réparer un groupe électrogène ou de fortifier une grille avec trois fois rien.',
    currentLocationId: 'loc_station',
    status: 'connected',
    stats: {
      health: 95,
      maxHealth: 100,
      fatigue: 45,
      hunger: 40,
      thirst: 35,
      morale: 65,
    },
    attributes: {
      strength: 15,
      agility: 14,
      intelligence: 14,
      endurance: 16,
      perception: 12,
    },
    inventory: [
      {
        id: 'item_crowbar_1',
        name: 'Pied-de-biche en acier',
        category: 'tool',
        quantity: 1,
        condition: 95,
        description: 'Outil idéal pour forcer les portes et briser des crânes de rôdeurs.',
        weightKg: 2.1,
      },
      {
        id: 'item_rations_1',
        name: 'Rations de survie MRE',
        category: 'food',
        quantity: 3,
        condition: 100,
        description: 'Repas lyophilisé haute densité calorique.',
        weightKg: 0.9,
      },
      {
        id: 'item_flashlight_1',
        name: 'Lampe torche dynamo',
        category: 'tool',
        quantity: 1,
        condition: 80,
        description: 'Fonctionne sans piles en actionnant la poignée.',
        weightKg: 0.4,
      },
    ],
    safeZoneProtection: false,
    createdUtc: Date.now() - 7200000,
  },
};

export function createInitialWorldState(): WorldState {
  const now = Date.now();
  return {
    worldId: 'world_genesis_01',
    name: 'Zone de Quarantaine — Vallée d\'Ombre',
    clock: {
      realEpochStartUtc: now - 3600000, // Début il y a 1h réelle
      gameEpochStartMinutes: 360, // Jour 1, 06:00
      timeDilation: 5, // 1 min réelle = 5 min de jeu
      isPaused: false,
    },
    locations: INITIAL_LOCATIONS,
    characters: INITIAL_CHARACTERS,
    events: [],
    logs: [
      {
        id: 'log_init_01',
        gameTimeMinutes: 360,
        realTimestampUtc: now - 3600000,
        category: 'system',
        title: 'Initialisation du Monde Persistant',
        content: 'Le monde persistant est actif. L\'horloge mondiale s\'écoule à la vitesse de 5 minutes de jeu par minute réelle.',
      },
      {
        id: 'log_init_02',
        gameTimeMinutes: 365,
        realTimestampUtc: now - 3500000,
        characterId: 'char_marcus',
        characterName: 'Marcus Vance',
        category: 'narrative',
        title: 'Sanctuaire établi',
        content: 'Marcus a sécurisé le porche de la Vieille Église. Les réserves d\'eau semblent stables pour les prochains jours.',
      },
      {
        id: 'log_init_03',
        gameTimeMinutes: 380,
        realTimestampUtc: now - 3200000,
        characterId: 'char_elena',
        characterName: 'Elena Rostova',
        category: 'narrative',
        title: 'Reconnaissance à la Station',
        content: 'Elena s\'est retranchée près des ateliers de la station-service. L\'ambiance est lourde, des gémissements lointains résonnent au carrefour.',
      },
    ],
  };
}
