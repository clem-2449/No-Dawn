/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Backpack, Crosshair, Droplets, Utensils, Wrench, Shield, Sparkles, Heart } from 'lucide-react';
import { InventoryItem } from '../engine/types';

interface InventoryViewProps {
  items: InventoryItem[];
  onUseItem?: (item: InventoryItem) => void;
  disabled?: boolean;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  onUseItem,
  disabled,
}) => {
  const totalWeight = items.reduce((sum, item) => sum + item.weightKg * item.quantity, 0);

  const getCategoryIcon = (category: InventoryItem['category']) => {
    switch (category) {
      case 'medical':
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      case 'weapon':
        return <Crosshair className="w-3.5 h-3.5 text-amber-400" />;
      case 'water':
        return <Droplets className="w-3.5 h-3.5 text-cyan-400" />;
      case 'food':
        return <Utensils className="w-3.5 h-3.5 text-amber-500" />;
      case 'tool':
        return <Wrench className="w-3.5 h-3.5 text-stone-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg p-4 text-stone-200">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
        <h3 className="font-bold text-stone-100 flex items-center gap-2 text-sm">
          <Backpack className="w-4 h-4 text-amber-500" />
          <span>Inventaire & Sac à dos</span>
        </h3>
        <span className="text-xs font-mono text-stone-400">
          Poids : <span className="text-stone-200 font-semibold">{totalWeight.toFixed(1)} kg</span> / 25.0 kg
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-4 text-center text-stone-500 text-xs italic">
          Sac à dos vide. Fouillez les lieux pour trouver des ressources.
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded bg-stone-950/70 border border-stone-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="p-1.5 rounded bg-stone-900 border border-stone-800 shrink-0">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-200 truncate">{item.name}</span>
                    <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.2 rounded font-mono">
                      x{item.quantity}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">{item.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-stone-500 font-mono">
                    <span>État : {item.condition}%</span>
                    <span>{(item.weightKg * item.quantity).toFixed(1)} kg</span>
                  </div>
                </div>
              </div>

              {/* Action rapide selon le type d'objet */}
              {onUseItem && (item.category === 'medical' || item.category === 'food' || item.category === 'water') && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onUseItem(item)}
                  className="px-2.5 py-1 text-[11px] bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 rounded border border-stone-700 hover:border-amber-500 transition cursor-pointer shrink-0"
                >
                  {item.category === 'medical' ? 'Soigner' : item.category === 'water' ? 'Boire' : 'Manger'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
