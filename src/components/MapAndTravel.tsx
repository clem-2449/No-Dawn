/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, MapPin, Footprints, Shield, AlertTriangle, Skull, ArrowRight } from 'lucide-react';
import { Location, DangerLevel } from '../engine/types';
import { formatRealEquivalentDuration } from '../engine/clock';

interface MapAndTravelProps {
  locations: Record<string, Location>;
  currentLocationId: string;
  timeDilation: number;
  onTravelTo: (targetLocId: string) => void;
  disabled?: boolean;
}

export const MapAndTravel: React.FC<MapAndTravelProps> = ({
  locations,
  currentLocationId,
  timeDilation,
  onTravelTo,
  disabled,
}) => {
  const currentLoc = locations[currentLocationId];
  if (!currentLoc) return null;

  const getDangerBadge = (danger: DangerLevel) => {
    switch (danger) {
      case 'safe':
        return (
          <span className="flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
            <Shield className="w-3 h-3" /> Sûr
          </span>
        );
      case 'contested':
        return (
          <span className="flex items-center gap-1 text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded font-mono">
            <AlertTriangle className="w-3 h-3" /> Contesté
          </span>
        );
      case 'infested':
        return (
          <span className="flex items-center gap-1 text-[10px] bg-orange-950 text-orange-400 border border-orange-800 px-1.5 py-0.5 rounded font-mono">
            <Skull className="w-3 h-3" /> Infesté
          </span>
        );
      case 'deadly':
        return (
          <span className="flex items-center gap-1 text-[10px] bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded font-mono">
            <Skull className="w-3 h-3" /> Mortel
          </span>
        );
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg p-4 text-stone-200">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
        <h3 className="font-bold text-stone-100 flex items-center gap-2 text-sm">
          <Compass className="w-4 h-4 text-amber-500" />
          <span>Région : {currentLoc.region}</span>
        </h3>
        <span className="text-[11px] font-mono text-stone-400">
          {Object.keys(locations).length} lieux cartographiés
        </span>
      </div>

      {/* Destinations accessibles directement depuis le lieu actuel */}
      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-stone-400 font-mono mb-2 flex items-center gap-1.5">
          <Footprints className="w-3.5 h-3.5 text-stone-400" />
          <span>Liaisons directes depuis {currentLoc.name}</span>
        </div>

        {currentLoc.connections.length === 0 ? (
          <p className="text-xs text-stone-400 italic">Aucune route sécurisée connue depuis ce point.</p>
        ) : (
          <div className="space-y-2">
            {currentLoc.connections.map((conn) => {
              const target = locations[conn.targetLocationId];
              if (!target) return null;
              return (
                <div
                  key={conn.targetLocationId}
                  className="p-2.5 rounded bg-stone-950/80 border border-stone-800 hover:border-stone-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-200 truncate">{target.name}</span>
                      {getDangerBadge(target.dangerLevel)}
                    </div>
                    <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">{conn.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-amber-400/90 font-mono">
                      <span>Trajet : {conn.travelTimeGameMinutes} min de jeu</span>
                      <span className="text-stone-400">({formatRealEquivalentDuration(conn.travelTimeGameMinutes, timeDilation)})</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onTravelTo(target.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-semibold rounded transition cursor-pointer shrink-0"
                  >
                    <span>Partir</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vue d'ensemble du réseau de lieux */}
      <div className="pt-3 border-t border-stone-800">
        <div className="text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-2">
          Vue d'ensemble du District
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.values(locations).map((loc) => {
            const isHere = loc.id === currentLocationId;
            return (
              <div
                key={loc.id}
                className={`p-2 rounded border transition ${
                  isHere
                    ? 'bg-amber-950/30 border-amber-500/60 text-amber-200'
                    : 'bg-stone-950/40 border-stone-800/80 text-stone-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`font-semibold truncate ${isHere ? 'text-amber-300' : 'text-stone-300'}`}>
                    {loc.name}
                  </span>
                  {isHere && <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span>{loc.isSafeZone ? 'Refuge' : loc.dangerLevel}</span>
                  <span className="font-mono text-stone-400">Fouille {loc.scavengePotential}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
