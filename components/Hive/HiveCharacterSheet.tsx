// components/Hive/HiveCharacterSheet.tsx
// ============================================
// HIVE Character Sheet Component
// Define your character as a map of inner shards, not just stats
// ============================================

import React from "react";
import { 
  HIVE_SHARDS, 
  SHARD_VALUE_MIN, 
  SHARD_VALUE_MAX, 
  SHARD_VALUE_LABELS,
  type ShardId 
} from "./shards";
import { ORDER_DESCRIPTIONS, type HiveOrder, type ShardValues, calculateTotalShardPoints } from "./types";
import { User, Scroll, AlertCircle, Sparkles } from "lucide-react";

interface HiveCharacterSheetProps {
  name: string;
  order: HiveOrder;
  shardValues: ShardValues;
  onNameChange: (name: string) => void;
  onOrderChange: (order: HiveOrder) => void;
  onShardChange: (id: ShardId, value: number) => void;
  civicMemory: string;
  onCivicMemoryChange: (value: string) => void;
  unresolvedTrial: string;
  onUnresolvedTrialChange: (value: string) => void;
  micXp: number;
  isEditable?: boolean;
}

export const HiveCharacterSheet: React.FC<HiveCharacterSheetProps> = ({
  name,
  order,
  shardValues,
  onNameChange,
  onOrderChange,
  onShardChange,
  civicMemory,
  onCivicMemoryChange,
  unresolvedTrial,
  onUnresolvedTrialChange,
  micXp,
  isEditable = true,
}) => {
  // Calculate total shard points allocated
  const totalPoints = calculateTotalShardPoints(shardValues);
  const maxPoints = 14; // Suggested starting allocation

  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-900 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <h2 className="text-sm font-semibold tracking-wide">HIVE Character Sheet</h2>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-mono">{micXp} MIC-XP</span>
          </div>
        </div>
        <p className="text-xs text-stone-400 mt-1">
          Your character is a map of moral tensions, not power stats
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Name & Order */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-600">Name</label>
            <input
              className="w-full border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent"
              placeholder="E.g. Liora of the Frostworks"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              disabled={!isEditable}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-600">Order</label>
            <select
              className="w-full border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent bg-white"
              value={order}
              onChange={(e) => onOrderChange(e.target.value as HiveOrder)}
              disabled={!isEditable}
            >
              {(Object.entries(ORDER_DESCRIPTIONS) as [HiveOrder, typeof ORDER_DESCRIPTIONS[HiveOrder]][]).map(
                ([key, info]) => (
                  <option key={key} value={key}>
                    {info.name} — {info.description.slice(0, 40)}...
                  </option>
                )
              )}
            </select>
            <p className={`text-xs ${ORDER_DESCRIPTIONS[order].color}`}>
              {ORDER_DESCRIPTIONS[order].description}
            </p>
          </div>
        </div>

        {/* Shard Profile */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-700">Shard Profile</h3>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
              totalPoints > maxPoints ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500'
            }`}>
              {totalPoints} / {maxPoints} points
            </span>
          </div>
          <p className="text-xs text-stone-500">
            0 = Dormant · 1 = Emerging · 2 = Tempered · 3 = Burdened · 4 = Fractured · 5 = Legendary
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {HIVE_SHARDS.map((shard) => {
              const value = shardValues[shard.id] ?? 0;
              return (
                <div
                  key={shard.id}
                  className={`border rounded-lg p-3 transition-colors ${shard.borderColor} ${shard.bgColor}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className={`text-sm font-bold ${shard.color}`}>
                        {shard.name}
                      </div>
                      <div className="text-xs text-stone-500">{shard.tagline}</div>
                    </div>
                    {isEditable ? (
                      <input
                        type="number"
                        min={SHARD_VALUE_MIN}
                        max={SHARD_VALUE_MAX}
                        className="w-14 border border-stone-300 rounded px-2 py-1 text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
                        value={value}
                        onChange={(e) =>
                          onShardChange(
                            shard.id,
                            Math.min(
                              SHARD_VALUE_MAX,
                              Math.max(SHARD_VALUE_MIN, Number(e.target.value) || 0)
                            )
                          )
                        }
                      />
                    ) : (
                      <span className={`text-lg font-bold ${shard.color}`}>
                        {value}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-stone-600 space-y-0.5">
                    <p><span className="font-medium">Domain:</span> {shard.domain}</p>
                    <p className="text-emerald-700">✓ {shard.strength}</p>
                    <p className="text-red-700">✗ {shard.flaw}</p>
                  </div>
                  
                  {value > 0 && (
                    <div className="mt-2 pt-2 border-t border-stone-200/50">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${shard.bgColor} ${shard.color} font-medium`}>
                        {SHARD_VALUE_LABELS[value]}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Civic Memory & Unresolved Trial */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Scroll className="w-3.5 h-3.5 text-stone-500" />
              <label className="text-xs font-medium text-stone-600">Civic Memory Ledger</label>
            </div>
            <textarea
              className="w-full border border-stone-200 rounded px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent"
              placeholder="Moments of integrity, fracture, sacrifice, dissent..."
              value={civicMemory}
              onChange={(e) => onCivicMemoryChange(e.target.value)}
              disabled={!isEditable}
            />
            <p className="text-xs text-stone-400">Your character's story of growth and struggle</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <label className="text-xs font-medium text-stone-600">Unresolved Trial</label>
            </div>
            <textarea
              className="w-full border border-stone-200 rounded px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent"
              placeholder="The moral wound this character has not yet reconciled..."
              value={unresolvedTrial}
              onChange={(e) => onUnresolvedTrialChange(e.target.value)}
              disabled={!isEditable}
            />
            <p className="text-xs text-stone-400">Every character carries something unfinished</p>
          </div>
        </div>
      </div>
    </div>
  );
};
