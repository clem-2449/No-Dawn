/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Shield, ShieldAlert, AlertTriangle, Heart, Activity, CheckCircle2, LogOut, ArrowRight } from 'lucide-react';
import { Character, Location } from '../engine/types';
import { evaluateDisconnection } from '../engine/safety';

interface DisconnectModalProps {
  isOpen: boolean;
  character: Character;
  location: Location;
  onClose: () => void;
  onConfirmDisconnect: () => void;
  onReconnect: () => void;
}

export const DisconnectModal: React.FC<DisconnectModalProps> = ({
  isOpen,
  character,
  location,
  onClose,
  onConfirmDisconnect,
  onReconnect,
}) => {
  if (!isOpen) return null;

  const evaluation = evaluateDisconnection(character, location);
  const isDisconnected = character.status !== 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-lg w-full text-stone-200 overflow-hidden shadow-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2">
            {evaluation.isSafe ? (
              <Shield className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            )}
            <h3 className="font-bold text-stone-100 text-base">
              {isDisconnected ? 'Personnage Hors Ligne' : 'Évaluation de Déconnexion'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          {/* État actuel */}
          <div className="bg-stone-950 p-3 rounded border border-stone-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-stone-400">Emplacement actuel</div>
              <div className="font-semibold text-stone-200">{location.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-stone-400">Statut du lieu</div>
              <div className={`font-mono text-xs uppercase font-bold ${
                evaluation.isSafe ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {evaluation.isSafe ? 'Refuge Sécurisé' : `Zone non sûre (${location.dangerLevel})`}
              </div>
            </div>
          </div>

          {/* Alertes & Avertissements */}
          {evaluation.warnings.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-900/80 p-3 rounded space-y-1.5 text-rose-200 text-xs">
              <div className="font-semibold flex items-center gap-1.5 uppercase font-mono text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                Avertissement de survie :
              </div>
              {evaluation.warnings.map((warn, i) => (
                <p key={i} className="pl-5 leading-relaxed">• {warn}</p>
              ))}
            </div>
          )}

          {/* Recommandations & Projections */}
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-stone-300 font-mono uppercase tracking-wider">
              Conséquences de l'absence :
            </div>
            {evaluation.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-stone-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>

          {/* Projection horaire */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-stone-950 rounded border border-stone-800 text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-stone-400 text-[10px]">Fatigue / heure de jeu</div>
                <div className="font-mono font-semibold text-stone-200">
                  {evaluation.projectedRecovery.fatiguePerHour > 0
                    ? `-${evaluation.projectedRecovery.fatiguePerHour}%`
                    : '+0% (tension)'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <div>
                <div className="text-stone-400 text-[10px]">Santé / heure de jeu</div>
                <div className="font-mono font-semibold text-stone-200">
                  {evaluation.projectedRecovery.healthPerHour > 0
                    ? `+${evaluation.projectedRecovery.healthPerHour} PV`
                    : 'Risque de blessure'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page modal */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition cursor-pointer"
          >
            Fermer
          </button>

          {isDisconnected ? (
            <button
              onClick={() => {
                onReconnect();
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded transition cursor-pointer"
            >
              <span>Se Reconnecter au Monde</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                onConfirmDisconnect();
                onClose();
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded transition cursor-pointer ${
                evaluation.isSafe
                  ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>
                {evaluation.isSafe ? 'Quitter en Sécurité' : 'Déconnexion Malgré les Risques'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
