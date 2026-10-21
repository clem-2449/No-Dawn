/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WorldClockHeader } from './components/WorldClockHeader';
import { NarrativePanel } from './components/NarrativePanel';
import { CharacterSheet } from './components/CharacterSheet';
import { InventoryView } from './components/InventoryView';
import { MapAndTravel } from './components/MapAndTravel';
import { DisconnectModal } from './components/DisconnectModal';
import { TechArchitectureModal } from './components/TechArchitectureModal';
import {
  loadPersistedWorld,
  saveWorldState,
  resetWorldToGenesis,
  getActiveCharacterId,
  setActiveCharacterId,
} from './engine/store';
import { calculateCurrentGameMinutes } from './engine/clock';
import { resolveScheduledEvents, scheduleMovement } from './engine/scheduler';
import { parsePlayerIntent, executeValidatedAction, ActionResult } from './engine/actionParser';
import { simulateOfflineProgress } from './engine/safety';
import { WorldState, InventoryItem } from './engine/types';
import { MapPin, User, Backpack, ScrollText, AlertTriangle } from 'lucide-react';

export default function App() {
  const [worldState, setWorldState] = useState<WorldState>(() => loadPersistedWorld().state);
  const [activeCharId, setActiveCharIdState] = useState<string>(() => getActiveCharacterId());
  const [nowUtc, setNowUtc] = useState<number>(Date.now());
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'narrative' | 'character' | 'inventory' | 'map'>('narrative');
  const [lastActionResult, setLastActionResult] = useState<{
    feedback: string;
    narrative: string;
    success: boolean;
  } | undefined>();

  // Calcul du temps mondial courant (minutes depuis le début de l'épidémie)
  const currentGameMinutes = useMemo(() => {
    return calculateCurrentGameMinutes(worldState.clock, nowUtc);
  }, [worldState.clock, nowUtc]);

  // Personnage et lieu actifs
  const activeChar = worldState.characters[activeCharId] || Object.values(worldState.characters)[0];
  const currentLoc = worldState.locations[activeChar?.currentLocationId] || Object.values(worldState.locations)[0];

  // Action planifiée en cours pour le personnage actif
  const pendingEvent = worldState.events.find(
    (e) => e.characterId === activeChar?.id && e.status === 'pending'
  );

  // Boucle de simulation temporelle (tick continu d'1 seconde)
  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = Date.now();
      setNowUtc(currentNow);

      const gameMins = calculateCurrentGameMinutes(worldState.clock, currentNow);

      // Résoudre les événements programmés
      const pendingCount = worldState.events.filter((e) => e.status === 'pending').length;
      if (pendingCount > 0) {
        const { updatedState, resolvedEvents } = resolveScheduledEvents(worldState, gameMins);
        if (resolvedEvents.length > 0) {
          setWorldState(updatedState);
          saveWorldState(updatedState);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [worldState]);

  // Changement de personnage actif
  const handleSelectCharacter = useCallback((id: string) => {
    setActiveCharIdState(id);
    setActiveCharacterId(id);
    setLastActionResult(undefined);
  }, []);

  // Soumission d'une action libre en langage naturel
  const handleActionSubmit = useCallback((rawText: string) => {
    if (!activeChar || !currentLoc) return;

    const intent = parsePlayerIntent(
      rawText,
      activeChar,
      currentLoc,
      worldState.locations
    );

    const result: ActionResult = executeValidatedAction(
      intent,
      activeChar,
      worldState,
      currentGameMinutes
    );

    setLastActionResult({
      feedback: result.feedbackMessage,
      narrative: result.narrativeDescription,
      success: result.success,
    });

    if (result.success) {
      setWorldState((prev) => {
        const updatedChars = { ...prev.characters };
        const char = { ...updatedChars[activeChar.id] };

        // Appliquer deltas de stats
        if (result.statDeltas) {
          char.stats = { ...char.stats, ...result.statDeltas };
        }

        // Retirer objets consommés
        if (result.inventoryConsumed && result.inventoryConsumed.length > 0) {
          char.inventory = char.inventory
            .map((item) => {
              if (result.inventoryConsumed?.includes(item.id)) {
                return { ...item, quantity: item.quantity - 1 };
              }
              return item;
            })
            .filter((item) => item.quantity > 0);
        }

        // Ajouter objets trouvés
        if (result.inventoryAdded && result.inventoryAdded.length > 0) {
          for (const added of result.inventoryAdded) {
            const existing = char.inventory.find((i) => i.name === added.name);
            if (existing) {
              existing.quantity += added.quantity;
            } else {
              char.inventory.push(added);
            }
          }
        }

        updatedChars[activeChar.id] = char;

        // Ajouter événement planifié si applicable
        const updatedEvents = result.createdEvent
          ? [...prev.events, result.createdEvent]
          : prev.events;

        // Journaliser
        const newLog = {
          id: `log_act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          gameTimeMinutes: currentGameMinutes,
          realTimestampUtc: Date.now(),
          characterId: activeChar.id,
          characterName: activeChar.name,
          category: 'action' as const,
          title: `Action libre : "${rawText.slice(0, 32)}${rawText.length > 32 ? '...' : ''}"`,
          content: result.narrativeDescription,
        };

        const newState: WorldState = {
          ...prev,
          characters: updatedChars,
          events: updatedEvents,
          logs: [newLog, ...prev.logs].slice(0, 100),
        };

        saveWorldState(newState);
        return newState;
      });
    }
  }, [activeChar, currentLoc, worldState, currentGameMinutes]);

  // Déplacement direct depuis la carte
  const handleTravelTo = useCallback((targetLocId: string) => {
    if (!activeChar || !currentLoc) return;
    const targetLoc = worldState.locations[targetLocId];
    if (!targetLoc) return;

    const connection = currentLoc.connections.find((c) => c.targetLocationId === targetLocId);
    if (!connection) return;

    if (pendingEvent) return;

    const moveEvent = scheduleMovement(
      activeChar,
      currentLoc,
      targetLoc,
      connection.travelTimeGameMinutes,
      currentGameMinutes
    );

    setWorldState((prev) => {
      const newState: WorldState = {
        ...prev,
        events: [...prev.events, moveEvent],
        logs: [
          {
            id: `log_start_move_${Date.now()}`,
            gameTimeMinutes: currentGameMinutes,
            realTimestampUtc: Date.now(),
            characterId: activeChar.id,
            characterName: activeChar.name,
            category: 'movement',
            title: `Départ vers ${targetLoc.name}`,
            content: `${activeChar.name} quitte ${currentLoc.name} en direction de ${targetLoc.name}. Durée estimée : ${connection.travelTimeGameMinutes} min de jeu.`,
          },
          ...prev.logs,
        ].slice(0, 100),
      };
      saveWorldState(newState);
      return newState;
    });

    setLastActionResult({
      feedback: `En route vers ${targetLoc.name} (${connection.travelTimeGameMinutes} min de jeu).`,
      narrative: `Vous quittez prudemment ${currentLoc.name}. Vous progressez le long de l'itinéraire prévu avec vigilance.`,
      success: true,
    });
  }, [activeChar, currentLoc, worldState, pendingEvent, currentGameMinutes]);

  // Utilisation rapide d'un objet d'inventaire
  const handleUseItem = useCallback((item: InventoryItem) => {
    if (!activeChar) return;
    if (item.category === 'medical') {
      handleActionSubmit(`Je me soigne avec ${item.name}.`);
    } else if (item.category === 'water' || item.category === 'food') {
      handleActionSubmit(`Je consomme ${item.name}.`);
    }
  }, [activeChar, handleActionSubmit]);

  // Confirmation de déconnexion
  const handleConfirmDisconnect = useCallback(() => {
    if (!activeChar || !currentLoc) return;
    const newStatus = currentLoc.isSafeZone ? 'disconnected_safe' : 'disconnected_hazard';

    setWorldState((prev) => {
      const updatedChars = {
        ...prev.characters,
        [activeChar.id]: {
          ...activeChar,
          status: newStatus,
          lastDisconnectUtc: Date.now(),
        },
      };

      const newState: WorldState = {
        ...prev,
        characters: updatedChars,
        logs: [
          {
            id: `log_disc_${Date.now()}`,
            gameTimeMinutes: currentGameMinutes,
            realTimestampUtc: Date.now(),
            characterId: activeChar.id,
            characterName: activeChar.name,
            category: 'system',
            title: currentLoc.isSafeZone ? 'Déconnexion en Refuge' : 'Déconnexion en Zone Hostile',
            content: `${activeChar.name} s'est déconnecté(e) à ${currentLoc.name}. ${
              currentLoc.isSafeZone
                ? 'Protection active du refuge.'
                : 'Attention : le personnage reste exposé au monde persistant.'
            }`,
          },
          ...prev.logs,
        ].slice(0, 100),
      };

      saveWorldState(newState);
      return newState;
    });
  }, [activeChar, currentLoc, currentGameMinutes]);

  // Reconnexion avec simulation du temps passé
  const handleReconnect = useCallback(() => {
    if (!activeChar || !currentLoc) return;

    // Simulation de l'évolution offline
    const lastMinutes = currentGameMinutes - 120; // simule 2h de jeu d'absence si non renseigné
    const simResult = simulateOfflineProgress(
      activeChar,
      currentLoc,
      currentGameMinutes,
      lastMinutes
    );

    setWorldState((prev) => {
      const updatedChars = {
        ...prev.characters,
        [activeChar.id]: {
          ...simResult.updatedCharacter,
          status: 'connected',
        },
      };

      const newState: WorldState = {
        ...prev,
        characters: updatedChars,
        logs: [...simResult.logs, ...prev.logs].slice(0, 100),
      };

      saveWorldState(newState);
      return newState;
    });

    setLastActionResult({
      feedback: `${activeChar.name} est de retour en jeu.`,
      narrative: `Vous ouvrez les yeux à ${currentLoc.name}. Le temps a continué de s'écouler dans la vallée.`,
      success: true,
    });
  }, [activeChar, currentLoc, currentGameMinutes]);

  // Réinitialiser le monde
  const handleResetWorld = useCallback(() => {
    if (confirm('Voulez-vous réinitialiser le monde persistant à son état de départ (Genesis) ?')) {
      const fresh = resetWorldToGenesis();
      setWorldState(fresh);
      setActiveCharIdState('char_marcus');
      setLastActionResult(undefined);
    }
  }, []);

  if (!activeChar || !currentLoc) {
    return <div className="p-8 text-stone-200">Chargement du monde...</div>;
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Horloge mondiale et barre de contrôle */}
      <WorldClockHeader
        clock={worldState.clock}
        currentGameMinutes={currentGameMinutes}
        characters={worldState.characters}
        activeCharacterId={activeCharId}
        onSelectCharacter={handleSelectCharacter}
        onReset={handleResetWorld}
        onOpenTechModal={() => setIsTechModalOpen(true)}
      />

      {/* Avertissement si le personnage est déconnecté */}
      {activeChar.status !== 'connected' && (
        <div className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
          activeChar.status === 'disconnected_safe'
            ? 'bg-cyan-950/60 border-cyan-900 text-cyan-200'
            : 'bg-rose-950/80 border-rose-900 text-rose-200'
        }`}>
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {activeChar.name} est actuellement <strong>hors ligne</strong> ({
                activeChar.status === 'disconnected_safe'
                  ? 'Abrité en zone sûre'
                  : 'Exposé sans protection en zone contestée'
              }). Les événements du monde continuent d'évoluer.
            </span>
            <button
              onClick={handleReconnect}
              className="ml-auto underline font-bold cursor-pointer hover:text-white"
            >
              Reprendre la partie
            </button>
          </div>
        </div>
      )}

      {/* Navigation mobile par onglets */}
      <div className="lg:hidden flex border-b border-stone-800 bg-stone-900 text-xs">
        <button
          onClick={() => setActiveTab('narrative')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium ${
            activeTab === 'narrative' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-stone-400'
          }`}
        >
          <ScrollText className="w-3.5 h-3.5" />
          <span>Narration</span>
        </button>
        <button
          onClick={() => setActiveTab('character')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium ${
            activeTab === 'character' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-stone-400'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Fiche</span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium ${
            activeTab === 'inventory' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-stone-400'
          }`}
        >
          <Backpack className="w-3.5 h-3.5" />
          <span>Sac ({activeChar.inventory.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium ${
            activeTab === 'map' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-stone-400'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Carte</span>
        </button>
      </div>

      {/* Disposition principale sur grand écran (Grid 3 colonnes) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Colonne Gauche : Fiche de Personnage & Inventaire (4 colonnes) */}
        <div className={`lg:col-span-4 space-y-4 ${activeTab !== 'character' && activeTab !== 'inventory' ? 'hidden lg:block' : ''}`}>
          <div className={activeTab === 'character' || window.innerWidth >= 1024 ? 'block' : 'hidden'}>
            <CharacterSheet
              character={activeChar}
              currentLocation={currentLoc}
              onOpenDisconnectModal={() => setIsDisconnectModalOpen(true)}
            />
          </div>
          <div className={activeTab === 'inventory' || window.innerWidth >= 1024 ? 'block' : 'hidden'}>
            <InventoryView
              items={activeChar.inventory}
              onUseItem={handleUseItem}
              disabled={!!pendingEvent}
            />
          </div>
        </div>

        {/* Colonne Centrale : Narration & Actions Libres (5 colonnes) */}
        <div className={`lg:col-span-5 h-[calc(100vh-140px)] min-h-[500px] ${activeTab !== 'narrative' ? 'hidden lg:block' : ''}`}>
          <NarrativePanel
            character={activeChar}
            currentLocation={currentLoc}
            currentGameMinutes={currentGameMinutes}
            pendingEvent={pendingEvent}
            logs={worldState.logs}
            onSubmitAction={handleActionSubmit}
            lastNarrativeOutput={lastActionResult}
          />
        </div>

        {/* Colonne Droite : Carte, Déplacements & Contexte (3 colonnes) */}
        <div className={`lg:col-span-3 space-y-4 ${activeTab !== 'map' ? 'hidden lg:block' : ''}`}>
          <MapAndTravel
            locations={worldState.locations}
            currentLocationId={currentLoc.id}
            timeDilation={worldState.clock.timeDilation}
            onTravelTo={handleTravelTo}
            disabled={!!pendingEvent}
          />

          {/* Guide Rapide des 6 Piliers */}
          <div className="bg-stone-900 border border-stone-800 rounded-lg p-3.5 text-xs text-stone-300">
            <h4 className="font-bold text-stone-200 uppercase font-mono tracking-wider text-[11px] mb-2">
              Piliers du Moteur Persistant
            </h4>
            <ul className="space-y-1.5 text-stone-400 text-[11px]">
              <li>• <strong>Liberté :</strong> Entrez vos intentions en français.</li>
              <li>• <strong>Monde 24/7 :</strong> L'horloge progresse continuellement.</li>
              <li>• <strong>Règles strictes :</strong> Pas de création arbitraire d'objets.</li>
              <li>• <strong>Sécurité :</strong> Déconnexion en refuge = soins & récupération.</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Modale d'évaluation de déconnexion */}
      <DisconnectModal
        isOpen={isDisconnectModalOpen}
        character={activeChar}
        location={currentLoc}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirmDisconnect={handleConfirmDisconnect}
        onReconnect={handleReconnect}
      />

      {/* Modale d'architecture technique et feuille de route */}
      <TechArchitectureModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
      />
    </div>
  );
}
