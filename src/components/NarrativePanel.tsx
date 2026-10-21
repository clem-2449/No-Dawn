/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Send, Sparkles, AlertCircle, Clock, CheckCircle2, Compass, Search, Bed, Shield } from 'lucide-react';
import { Character, Location, ScheduledEvent, WorldLogEntry } from '../engine/types';
import { formatGameTime, realSecondsUntilGameMinute } from '../engine/clock';

interface NarrativePanelProps {
  character: Character;
  currentLocation: Location;
  currentGameMinutes: number;
  pendingEvent?: ScheduledEvent;
  logs: WorldLogEntry[];
  onSubmitAction: (rawText: string) => void;
  lastNarrativeOutput?: {
    feedback: string;
    narrative: string;
    success: boolean;
  };
}

export const NarrativePanel: React.FC<NarrativePanelProps> = ({
  character,
  currentLocation,
  currentGameMinutes,
  pendingEvent,
  logs,
  onSubmitAction,
  lastNarrativeOutput,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || pendingEvent) return;
    onSubmitAction(inputText.trim());
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (pendingEvent) return;
    onSubmitAction(prompt);
  };

  // Calcul du temps restant sur l'action en cours
  let eventProgressPercent = 0;
  let remainingMinutes = 0;
  if (pendingEvent) {
    const totalDuration = pendingEvent.completesAtGameMinutes - pendingEvent.startedAtGameMinutes;
    const elapsed = currentGameMinutes - pendingEvent.startedAtGameMinutes;
    eventProgressPercent = Math.min(100, Math.max(0, Math.round((elapsed / (totalDuration || 1)) * 100)));
    remainingMinutes = Math.max(0, pendingEvent.completesAtGameMinutes - currentGameMinutes);
  }

  // Filtrer les logs récents concernant ce personnage ou le système
  const relevantLogs = logs
    .filter(l => !l.characterId || l.characterId === character.id)
    .slice(0, 8);

  return (
    <div className="flex flex-col h-full bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
      {/* En-tête du lieu actuel */}
      <div className="bg-stone-950 p-4 border-b border-stone-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-400 font-mono flex items-center gap-1.5">
              <span>Lieu Actuel • {currentLocation.region}</span>
              {currentLocation.isSafeZone ? (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-sans flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Zone Sûre / Refuge
                </span>
              ) : (
                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-sans border ${
                  currentLocation.dangerLevel === 'deadly'
                    ? 'bg-rose-950 text-rose-400 border-rose-800'
                    : currentLocation.dangerLevel === 'infested'
                    ? 'bg-amber-950 text-amber-400 border-amber-800'
                    : 'bg-stone-800 text-stone-300 border-stone-700'
                }`}>
                  Menace : {currentLocation.dangerLevel}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-stone-100 mt-0.5">{currentLocation.name}</h2>
          </div>

          <div className="text-right text-xs text-stone-400 font-mono">
            <span>Potentiel de fouille : </span>
            <span className="text-amber-400 font-bold">{currentLocation.scavengePotential}%</span>
          </div>
        </div>

        <p className="text-sm text-stone-300 mt-2 leading-relaxed bg-stone-900/60 p-2.5 rounded border border-stone-800/80 italic">
          "{currentLocation.description}"
        </p>
      </div>

      {/* Action en cours (Bloquante avec barre de progression déterministe) */}
      {pendingEvent && (
        <div className="bg-amber-950/40 border-b border-amber-900/60 p-3 text-xs">
          <div className="flex items-center justify-between text-amber-200 mb-1.5">
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              Action en cours : {pendingEvent.description}
            </span>
            <span className="font-mono text-amber-300">
              {remainingMinutes} min de jeu restantes ({eventProgressPercent}%)
            </span>
          </div>
          <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-amber-900/50">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${eventProgressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-amber-400/80 mt-1">
            Le moteur déterministe résoudra cette action dès que l'horloge atteindra t={pendingEvent.completesAtGameMinutes} min.
          </p>
        </div>
      )}

      {/* Zone de Narration & Historique récent */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-serif">
        {/* Dernier retour d'action narratif */}
        {lastNarrativeOutput && (
          <div
            className={`p-3.5 rounded-lg border text-sm transition-all ${
              lastNarrativeOutput.success
                ? 'bg-stone-950/80 border-amber-900/50 text-stone-200'
                : 'bg-rose-950/40 border-rose-900/60 text-rose-200'
            }`}
          >
            <div className="font-sans text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
              {lastNarrativeOutput.success ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold font-mono">Conséquence validée</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400 font-semibold font-mono">Action refusée par les règles</span>
                </>
              )}
              <span className="text-stone-400">• {lastNarrativeOutput.feedback}</span>
            </div>
            <p className="text-stone-200 leading-relaxed font-sans">{lastNarrativeOutput.narrative}</p>
          </div>
        )}

        {/* Historique chronologique des événements du monde */}
        <div className="space-y-2.5 pt-2">
          <div className="font-sans text-xs uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <span>Journal du Monde & Événements</span>
            <span className="h-px bg-stone-800 flex-1" />
          </div>

          {relevantLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded bg-stone-950/50 border border-stone-800/80 text-xs text-stone-300 font-sans"
            >
              <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                <span className="font-semibold text-stone-200 flex items-center gap-1">
                  {log.category === 'movement' && <Compass className="w-3 h-3 text-cyan-400" />}
                  {log.category === 'action' && <Search className="w-3 h-3 text-amber-400" />}
                  {log.category === 'recovery' && <Bed className="w-3 h-3 text-emerald-400" />}
                  {log.category === 'hazard' && <AlertCircle className="w-3 h-3 text-rose-400" />}
                  {log.title}
                </span>
                <span className="font-mono text-stone-400">
                  {formatGameTime(log.gameTimeMinutes).formattedString}
                </span>
              </div>
              <p className="text-stone-300 leading-normal">{log.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions rapides d'actions en langage naturel */}
      <div className="p-3 bg-stone-950/60 border-t border-stone-800">
        <div className="text-[11px] text-stone-400 mb-1.5 flex items-center gap-1 font-mono">
          <Sparkles className="w-3 h-3 text-amber-400" /> Exemples d'intentions libres :
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={!!pendingEvent}
            onClick={() => handleQuickPrompt('Je fouille discrètement les lieux pour trouver des vivres ou médicaments.')}
            className="text-[11px] bg-stone-900 hover:bg-stone-800 border border-stone-700 disabled:opacity-40 text-stone-300 hover:text-amber-300 px-2.5 py-1 rounded transition text-left cursor-pointer"
          >
            🔍 Fouiller discrètement la zone
          </button>
          <button
            type="button"
            disabled={!!pendingEvent}
            onClick={() => handleQuickPrompt("J'observe les mouvements des zombies avant d'agir.")}
            className="text-[11px] bg-stone-900 hover:bg-stone-800 border border-stone-700 disabled:opacity-40 text-stone-300 hover:text-amber-300 px-2.5 py-1 rounded transition text-left cursor-pointer"
          >
            👀 Observer et guetter les menaces
          </button>
          <button
            type="button"
            disabled={!!pendingEvent}
            onClick={() => handleQuickPrompt('Je barricade un recoin et je prépare un endroit pour dormir.')}
            className="text-[11px] bg-stone-900 hover:bg-stone-800 border border-stone-700 disabled:opacity-40 text-stone-300 hover:text-amber-300 px-2.5 py-1 rounded transition text-left cursor-pointer"
          >
            🛏️ Se reposer / Bivouac
          </button>
          <button
            type="button"
            disabled={!!pendingEvent}
            onClick={() => handleQuickPrompt('Je me soigne avec du matériel médical.')}
            className="text-[11px] bg-stone-900 hover:bg-stone-800 border border-stone-700 disabled:opacity-40 text-stone-300 hover:text-amber-300 px-2.5 py-1 rounded transition text-left cursor-pointer"
          >
            🩹 Appliquer des soins
          </button>
        </div>
      </div>

      {/* Champ d'action libre en langage naturel */}
      <form onSubmit={handleSubmit} className="p-3 bg-stone-950 border-t border-stone-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={!!pendingEvent}
          placeholder={
            pendingEvent
              ? "Action en cours de résolution..."
              : "Décrivez librement votre action (ex: « Je fouille les tiroirs », « Je me déplace vers la station »)..."
          }
          className="flex-1 bg-stone-900 border border-stone-700 focus:border-amber-500 rounded px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none disabled:opacity-50 font-sans"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || !!pendingEvent}
          className="bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-semibold px-4 py-2 rounded text-sm flex items-center gap-1.5 transition cursor-pointer"
        >
          <span>Agir</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
