/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, GitBranch, CheckCircle2, Clock, Terminal, Layers, FileCode, Shield, Database, Cpu } from 'lucide-react';

interface TechArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechArchitectureModal: React.FC<TechArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-3xl w-full max-h-[85vh] text-stone-200 overflow-hidden flex flex-col shadow-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-stone-100 text-base">
                Socle Technique & Plan d'Implémentation
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                Branche active : <span className="text-amber-400">feature/project-skeleton</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Statut des tests automatisés */}
          <div className="bg-emerald-950/40 border border-emerald-800 p-3.5 rounded">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-emerald-300 font-mono uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tests Automatisés Validés (8/8 Passants)
              </span>
              <span className="text-[11px] font-mono text-emerald-400">node:test + tsx</span>
            </div>
            <p className="text-stone-300 leading-relaxed">
              Les règles critiques de l'horloge mondiale continue (1 min réelle = 5 min de jeu), de la persistance UTC, de la protection des refuges, de l'exposition aux risques lors d'une déconnexion dangereuse et de l'idempotence des événements planifiés sont couvertes par des suites de tests unitaires exécutables via <code className="bg-stone-900 text-amber-300 px-1 py-0.5 rounded font-mono">npx tsx --test</code>.
            </p>
          </div>

          {/* Découpage modulaire du Backend (Section 12 du cahier des charges) */}
          <div>
            <div className="font-semibold text-stone-200 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-500" />
              11 Modules du Moteur Déterministe
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-stone-950 border border-stone-800">
                <div className="font-mono font-bold text-amber-400">world</div>
                <div className="text-stone-400">Horloge mondiale UTC continue, ratio configurable, boucle de simulation.</div>
              </div>
              <div className="p-2.5 rounded bg-stone-950 border border-stone-800">
                <div className="font-mono font-bold text-amber-400">characters</div>
                <div className="text-stone-400">Fiches personnages, PV, fatigue, faim, soif, moral et attributs.</div>
              </div>
              <div className="p-2.5 rounded bg-stone-950 border border-stone-800">
                <div className="font-mono font-bold text-amber-400">inventory</div>
                <div className="text-stone-400">Objets catégorisés, usure en %, poids cumulé, consommables.</div>
              </div>
              <div className="p-2.5 rounded bg-stone-950 border border-stone-800">
                <div className="font-mono font-bold text-amber-400">locations</div>
                <div className="text-stone-400">Graphe de lieux, temps de trajet calculés, niveaux de menace.</div>
              </div>
              <div className="p-2.5 rounded bg-stone-950 border border-stone-800">
                <div className="font-mono font-bold text-amber-400">safety</div>
                <div className="text-stone-400">Règles des refuges, protection des absents, alertes et déconnexions exposées.</div>
              </div>
              <div className="p-2.5 rounded bg-stone-950 border border-stone-800">
                <div className="font-mono font-bold text-amber-400">actions</div>
                <div className="text-stone-400">Interprétation IA des intentions libres & validation déterministe par le moteur.</div>
              </div>
              <div className="p-2.5 rounded bg-stone-950 border border-stone-800">
                <div className="font-mono font-bold text-stone-500">encounters (Phase 2)</div>
                <div className="text-stone-500">Rencontres asynchrones au croisement des plages horaires et des lieux.</div>
              </div>
              <div className="p-2.5 rounded bg-stone-950 border border-stone-800">
                <div className="font-mono font-bold text-stone-500">npcs & factions (Phase 2)</div>
                <div className="text-stone-500">Mémoire locale des PNJ, objectifs autonomes, territoires des groupes.</div>
              </div>
            </div>
          </div>

          {/* Ordre des Tâches Concrètes pour feature/project-skeleton */}
          <div>
            <div className="font-semibold text-stone-200 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-amber-500" />
              Plan d'Implémentation Étape par Étape
            </div>
            <div className="space-y-2 border-l-2 border-stone-800 pl-3">
              <div className="relative">
                <div className="font-semibold text-stone-200">Étape 1 : Socle du Moteur & Horloge Persistante (Réalisée)</div>
                <p className="text-stone-400">
                  Définition des types fondamentaux, calcul d'horloge UTC déterministe (ratio 1m=5m), gestion des zones sûres et ordonnanceur d'actions avec tests unitaires.
                </p>
              </div>
              <div className="relative">
                <div className="font-semibold text-stone-200">Étape 2 : Interface Développeur & Simulateur de Persistance (Réalisée)</div>
                <p className="text-stone-400">
                  Interface web réactive permettant de tester les 10 critères de la Phase 1 : bascule entre Marcus et Elena, actions de fouille et repos, déplacements, simulation de déconnexion.
                </p>
              </div>
              <div className="relative">
                <div className="font-semibold text-stone-200">Étape 3 : Spécification des Modèles PostgreSQL & Schémas SQLAlchemy</div>
                <p className="text-stone-400">
                  Transposition des types en tables relationnelles (<code className="text-amber-300">worlds</code>, <code className="text-amber-300">characters</code>, <code className="text-amber-300">locations</code>, <code className="text-amber-300">scheduled_events</code>, <code className="text-amber-300">logs</code>) avec migrations Alembic.
                </p>
              </div>
              <div className="relative">
                <div className="font-semibold text-stone-200">Étape 4 : API FastAPI & Worker Déterministe d'Horloge</div>
                <p className="text-stone-400">
                  Endpoints REST pour la soumission d'actions en langage naturel, la récupération d'état mondial et le worker asynchrone qui résout les événements échus avec verrouillage transactionnel.
                </p>
              </div>
              <div className="relative">
                <div className="font-semibold text-stone-200">Étape 5 : Intégration LLM pour la Narration Maître de Jeu</div>
                <p className="text-stone-400">
                  Connexion au modèle pour la génération de descriptions riches à partir des résultats validés par le moteur sans jamais laisser l'IA modifier l'état arbitrairement.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
