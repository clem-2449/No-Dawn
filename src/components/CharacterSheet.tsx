/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Activity, Droplets, Utensils, Shield, ShieldAlert, LogOut, Brain, Zap, User } from 'lucide-react';
import { Character, Location } from '../engine/types';

interface CharacterSheetProps {
  character: Character;
  currentLocation: Location;
  onOpenDisconnectModal: () => void;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character,
  currentLocation,
  onOpenDisconnectModal,
}) => {
  const { stats, attributes } = character;

  // Calculs des couleurs des barres
  const healthColor = stats.health > 50 ? 'bg-emerald-500' : stats.health > 25 ? 'bg-amber-500' : 'bg-rose-600';
  const fatigueColor = stats.fatigue < 50 ? 'bg-emerald-500' : stats.fatigue < 80 ? 'bg-amber-500' : 'bg-rose-600';
  const hungerColor = stats.hunger < 50 ? 'bg-emerald-500' : stats.hunger < 80 ? 'bg-amber-500' : 'bg-rose-600';
  const thirstColor = stats.thirst < 50 ? 'bg-emerald-500' : stats.thirst < 80 ? 'bg-amber-500' : 'bg-rose-600';

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg p-4 text-stone-200">
      {/* Profil de base */}
      <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-500 font-bold text-lg font-mono">
            {character.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-stone-100 text-base leading-tight">{character.name}</h3>
            <p className="text-xs text-amber-400 font-mono">{character.archetype}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-stone-400 font-mono">
                Statut :
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                character.status === 'connected'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : character.status === 'disconnected_safe'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {character.status === 'connected' ? 'En ligne' : character.status === 'disconnected_safe' ? 'Déconnecté (Refuge)' : 'Déconnecté (Exposé)'}
              </span>
            </div>
          </div>
        </div>

        {/* Bouton de Déconnexion / Simulation de départ */}
        <button
          onClick={onOpenDisconnectModal}
          className="flex items-center gap-1.5 text-xs bg-stone-950 hover:bg-stone-800 border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-amber-400 px-2.5 py-1.5 rounded transition cursor-pointer"
          title="Simuler la déconnexion et évaluer la sécurité du lieu"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Jauges Vitales */}
      <div className="grid grid-cols-2 gap-2.5 my-3 text-xs">
        {/* Santé */}
        <div className="bg-stone-950/70 p-2 rounded border border-stone-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-400 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" /> Santé
            </span>
            <span className="font-mono text-stone-200">{stats.health} / {stats.maxHealth}</span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div className={`${healthColor} h-full transition-all`} style={{ width: `${stats.health}%` }} />
          </div>
        </div>

        {/* Fatigue */}
        <div className="bg-stone-950/70 p-2 rounded border border-stone-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-500" /> Fatigue
            </span>
            <span className="font-mono text-stone-200">{stats.fatigue}%</span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div className={`${fatigueColor} h-full transition-all`} style={{ width: `${stats.fatigue}%` }} />
          </div>
        </div>

        {/* Faim */}
        <div className="bg-stone-950/70 p-2 rounded border border-stone-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-400 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-amber-400" /> Faim
            </span>
            <span className="font-mono text-stone-200">{stats.hunger}%</span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div className={`${hungerColor} h-full transition-all`} style={{ width: `${stats.hunger}%` }} />
          </div>
        </div>

        {/* Soif */}
        <div className="bg-stone-950/70 p-2 rounded border border-stone-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-400 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Soif
            </span>
            <span className="font-mono text-stone-200">{stats.thirst}%</span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div className={`${thirstColor} h-full transition-all`} style={{ width: `${stats.thirst}%` }} />
          </div>
        </div>
      </div>

      {/* Attributs de Survie */}
      <div className="pt-2 border-t border-stone-800">
        <div className="text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-2 flex items-center justify-between">
          <span>Caractéristiques</span>
          <span className="text-stone-400 font-normal">Base 20</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          <div className="bg-stone-950 p-1.5 rounded border border-stone-800/80">
            <div className="text-[10px] text-stone-400 uppercase">FOR</div>
            <div className="font-mono font-bold text-amber-400 text-sm">{attributes.strength}</div>
          </div>
          <div className="bg-stone-950 p-1.5 rounded border border-stone-800/80">
            <div className="text-[10px] text-stone-400 uppercase">AGI</div>
            <div className="font-mono font-bold text-amber-400 text-sm">{attributes.agility}</div>
          </div>
          <div className="bg-stone-950 p-1.5 rounded border border-stone-800/80">
            <div className="text-[10px] text-stone-400 uppercase">INT</div>
            <div className="font-mono font-bold text-amber-400 text-sm">{attributes.intelligence}</div>
          </div>
          <div className="bg-stone-950 p-1.5 rounded border border-stone-800/80">
            <div className="text-[10px] text-stone-400 uppercase">END</div>
            <div className="font-mono font-bold text-amber-400 text-sm">{attributes.endurance}</div>
          </div>
          <div className="bg-stone-950 p-1.5 rounded border border-stone-800/80">
            <div className="text-[10px] text-stone-400 uppercase">PER</div>
            <div className="font-mono font-bold text-amber-400 text-sm">{attributes.perception}</div>
          </div>
        </div>
      </div>

      {/* Protection de refuge actuelle */}
      <div className="mt-3 p-2.5 rounded bg-stone-950 border border-stone-800 text-xs flex items-center gap-2">
        {currentLocation.isSafeZone ? (
          <>
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-stone-300">
              <span className="font-semibold text-emerald-400">Refuge actif :</span> {currentLocation.safeZoneDetails?.shelterName} (Défense {currentLocation.safeZoneDetails?.defenseRating}%)
            </div>
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="text-stone-300">
              <span className="font-semibold text-rose-400">Zone exposée :</span> Pas de protection garantie en cas d'inactivité.
            </div>
          </>
        )}
      </div>
    </div>
  );
};
