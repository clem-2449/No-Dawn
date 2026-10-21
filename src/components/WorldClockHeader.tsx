/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Moon, Sun, FastForward, RotateCcw, Users, Shield, ShieldAlert, Cpu } from 'lucide-react';
import { formatGameTime, formatRealEquivalentDuration } from '../engine/clock';
import { WorldClockState, Character } from '../engine/types';

interface WorldClockHeaderProps {
  clock: WorldClockState;
  currentGameMinutes: number;
  characters: Record<string, Character>;
  activeCharacterId: string;
  onSelectCharacter: (id: string) => void;
  onFastForward: (gameMinutes: number) => void;
  onReset: () => void;
  onOpenTechModal: () => void;
}

export const WorldClockHeader: React.FC<WorldClockHeaderProps> = ({
  clock,
  currentGameMinutes,
  characters,
  activeCharacterId,
  onSelectCharacter,
  onFastForward,
  onReset,
  onOpenTechModal,
}) => {
  const timeInfo = formatGameTime(currentGameMinutes);
  const activeChar = characters[activeCharacterId];

  return (
    <header className="bg-stone-950 border-b border-stone-800 text-stone-200 px-4 py-3 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Titre & Horloge du Monde */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Moteur mondial actif" />
            <h1 className="font-bold text-stone-100 tracking-wider uppercase text-sm md:text-base flex items-center gap-2">
              <span>Projet : Monde Persistant</span>
              <span className="text-xs bg-stone-800 text-amber-400 font-mono px-2 py-0.5 rounded border border-stone-700">
                Phase 1 MVP
              </span>
            </h1>
          </div>

          <div className="h-4 w-px bg-stone-800 hidden sm:block" />

          {/* Horloge Continue */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-900 border border-stone-800 px-2.5 sm:px-3 py-1.5 rounded-md font-mono text-xs whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-stone-300 font-semibold">{timeInfo.formattedString}</span>
            <div className="flex items-center gap-1 text-[11px] text-stone-400 border-l border-stone-800 pl-2">
              {timeInfo.isNight ? (
                <span className="flex items-center gap-1 text-indigo-400">
                  <Moon className="w-3 h-3" /> <span className="hidden xs:inline">Nuit</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400">
                  <Sun className="w-3 h-3" /> <span className="hidden xs:inline">Jour</span>
                </span>
              )}
            </div>
            <span className="text-[10px] text-stone-400 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 hidden sm:inline" title="Vitesse du temps">
              1m = {clock.timeDilation}m
            </span>
          </div>
        </div>

        {/* Contrôles de simulation temporelle (Accélération & Test de persistance) */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden lg:flex items-center gap-1 bg-stone-900 border border-stone-800 px-2 py-1 rounded">
            <span className="text-stone-400 font-mono text-[11px]">Saut temporel test :</span>
            <button
              onClick={() => onFastForward(15)}
              className="px-2 py-0.5 hover:bg-stone-800 text-stone-300 hover:text-amber-400 rounded transition font-mono"
              title="Avancer de 15 minutes de jeu (3 minutes réelles)"
            >
              +15m
            </button>
            <button
              onClick={() => onFastForward(60)}
              className="px-2 py-0.5 hover:bg-stone-800 text-stone-300 hover:text-amber-400 rounded transition font-mono"
              title="Avancer de 1 heure de jeu (12 minutes réelles)"
            >
              +1h
            </button>
            <button
              onClick={() => onFastForward(300)}
              className="px-2 py-0.5 hover:bg-stone-800 text-amber-400 rounded transition font-mono"
              title="Avancer de 5 heures de jeu (1 heure réelle)"
            >
              +5h
            </button>
          </div>

          {/* Sélecteur de personnage (Multijoueur Asynchrone) */}
          <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded">
            <Users className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-[11px] text-stone-400 hidden sm:inline">Survivant :</span>
            <select
              value={activeCharacterId}
              onChange={(e) => onSelectCharacter(e.target.value)}
              className="bg-transparent text-stone-200 font-medium cursor-pointer focus:outline-none text-xs"
            >
              {Object.values(characters).map((char) => (
                <option key={char.id} value={char.id} className="bg-stone-900 text-stone-200">
                  {char.name} ({char.archetype})
                </option>
              ))}
            </select>
            {activeChar?.safeZoneProtection ? (
              <span title="Protégé par refuge sûr">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
              </span>
            ) : (
              <span title="Hors refuge : exposé aux risques">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              </span>
            )}
          </div>

          {/* Bouton Documentation & Architecture Socle */}
          <button
            onClick={onOpenTechModal}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-amber-400 px-2.5 py-1.5 rounded transition cursor-pointer"
            title="Consulter le socle technique, diagramme modulaire et tests"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Socle Technique & Plan</span>
          </button>

          {/* Reset Genesis */}
          <button
            onClick={onReset}
            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded transition"
            title="Réinitialiser l'état persistant du monde"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
