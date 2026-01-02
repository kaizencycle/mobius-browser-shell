// components/Hive/HiveDiceRoller.tsx
// ============================================
// HIVE Dice-Ethics Roller Component
// Rolls don't decide if you win — they decide what kind of cost your choice carries
// ============================================

import React, { useState, useEffect, useCallback } from "react";
import { HIVE_SHARDS, type ShardId, getShardById } from "./shards";
import { 
  rollWithShard, 
  getOutcomeStyles, 
  generateDiceAnimation,
  calculateMicDelta 
} from "./dice";
import type { DiceOutcome, ShardValues } from "./types";
import { OUTCOME_BANDS } from "./types";
import { Dices, Target, History, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface HiveDiceRollerProps {
  shardValues: ShardValues;
  onRollComplete?: (outcome: DiceOutcome, micDelta: number) => void;
}

export const HiveDiceRoller: React.FC<HiveDiceRollerProps> = ({
  shardValues,
  onRollComplete,
}) => {
  const [selectedShard, setSelectedShard] = useState<ShardId>("ASH");
  const [lastOutcome, setLastOutcome] = useState<DiceOutcome | null>(null);
  const [intentText, setIntentText] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [animatedDice, setAnimatedDice] = useState<number | null>(null);
  const [rollHistory, setRollHistory] = useState<DiceOutcome[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const selectedShardInfo = getShardById(selectedShard);
  const shardValue = shardValues[selectedShard] ?? 0;

  const handleRoll = useCallback(() => {
    if (isRolling) return;

    setIsRolling(true);
    setLastOutcome(null);

    // Perform the actual roll
    const outcome = rollWithShard(selectedShard, shardValue, intentText || undefined);

    // Animate dice
    const animationFrames = generateDiceAnimation(outcome.rawRoll, 10);
    let frameIndex = 0;

    const animationInterval = setInterval(() => {
      setAnimatedDice(animationFrames[frameIndex]);
      frameIndex++;

      if (frameIndex >= animationFrames.length) {
        clearInterval(animationInterval);
        setIsRolling(false);
        setLastOutcome(outcome);
        setRollHistory((prev) => [outcome, ...prev].slice(0, 10)); // Keep last 10

        // Notify parent of roll completion
        if (onRollComplete) {
          const micDelta = calculateMicDelta(outcome.band);
          onRollComplete(outcome, micDelta);
        }
      }
    }, 80);
  }, [isRolling, selectedShard, shardValue, intentText, onRollComplete]);

  // Reset animated dice when not rolling
  useEffect(() => {
    if (!isRolling) {
      const timer = setTimeout(() => setAnimatedDice(null), 500);
      return () => clearTimeout(timer);
    }
  }, [isRolling]);

  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 to-purple-900 text-white px-4 py-3">
        <div className="flex items-center space-x-2">
          <Dices className="w-5 h-5" />
          <h2 className="text-sm font-semibold tracking-wide">Dice-Ethics Roll</h2>
        </div>
        <p className="text-xs text-indigo-200 mt-1">
          Dice don't decide success — they decide what kind of cost your choice carries
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Intent Input */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <Target className="w-3.5 h-3.5 text-stone-500" />
            <label className="text-xs font-medium text-stone-600">Intent (what are you trying to do?)</label>
          </div>
          <textarea
            className="w-full border border-stone-200 rounded px-3 py-2 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
            placeholder="E.g. Shut down the failing Frostworks reactor before it melts the district..."
            value={intentText}
            onChange={(e) => setIntentText(e.target.value)}
          />
        </div>

        {/* Shard Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-stone-600">
            Shard to lean on
          </label>
          <select
            className="w-full border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-white"
            value={selectedShard}
            onChange={(e) => setSelectedShard(e.target.value as ShardId)}
          >
            {HIVE_SHARDS.map((shard) => (
              <option key={shard.id} value={shard.id}>
                {shard.name} — {shard.tagline} (Value: {shardValues[shard.id] ?? 0})
              </option>
            ))}
          </select>
          {selectedShardInfo && (
            <div className={`text-xs p-2 rounded ${selectedShardInfo.bgColor} ${selectedShardInfo.color}`}>
              <p className="font-medium">
                You're choosing which part of yourself takes the hit.
              </p>
              <p className="mt-1 text-stone-600">
                {selectedShardInfo.domain}
              </p>
            </div>
          )}
        </div>

        {/* Roll Button & Dice Display */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleRoll}
            disabled={isRolling}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
              isRolling
                ? "bg-indigo-400 text-white cursor-wait"
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
            }`}
          >
            <Dices className={`w-5 h-5 ${isRolling ? "animate-spin" : ""}`} />
            <span>{isRolling ? "Rolling..." : "Roll d12 + Shard"}</span>
          </button>

          {/* Dice Animation Display */}
          <div className="flex items-center space-x-2">
            <div className={`w-16 h-16 flex items-center justify-center rounded-lg border-2 text-2xl font-bold transition-all ${
              animatedDice || lastOutcome
                ? "bg-stone-100 border-stone-300 text-stone-800"
                : "bg-stone-50 border-stone-200 text-stone-300"
            } ${isRolling ? "animate-pulse" : ""}`}>
              {animatedDice || (lastOutcome?.rawRoll) || "?"}
            </div>
            {lastOutcome && (
              <div className="text-xs text-stone-500 space-y-0.5">
                <div>d12: {lastOutcome.rawRoll}</div>
                <div>+{lastOutcome.shardBonus} ({selectedShard})</div>
                <div className="font-bold text-stone-700">= {lastOutcome.total}</div>
              </div>
            )}
          </div>
        </div>

        {/* Outcome Display */}
        {lastOutcome && (
          <div className={`border rounded-lg p-4 space-y-3 ${getOutcomeStyles(lastOutcome.band).bg} ${getOutcomeStyles(lastOutcome.band).border}`}>
            <div className="flex items-center justify-between">
              <div className={`text-lg font-bold ${getOutcomeStyles(lastOutcome.band).text}`}>
                {lastOutcome.title}
              </div>
              <div className="flex items-center space-x-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className={`text-sm font-mono ${calculateMicDelta(lastOutcome.band) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {calculateMicDelta(lastOutcome.band) >= 0 ? '+' : ''}{calculateMicDelta(lastOutcome.band)} MIC-XP
                </span>
              </div>
            </div>

            <div className="text-xs text-stone-600 space-y-1">
              <p>
                <span className="font-medium">Roll:</span> {lastOutcome.rawRoll} + {lastOutcome.shardBonus} ({lastOutcome.shardId}) = {lastOutcome.total}
              </p>
              {lastOutcome.intent && (
                <p>
                  <span className="font-medium">Intent:</span>{" "}
                  <span className="italic">{lastOutcome.intent}</span>
                </p>
              )}
            </div>

            <p className={`text-sm ${getOutcomeStyles(lastOutcome.band).text}`}>
              {lastOutcome.narrative}
            </p>

            <div className="pt-2 border-t border-stone-200/50">
              <p className="text-xs text-stone-500">
                🔮 In a future version, this outcome will be written to your civic ledger as an EPICON-style event.
              </p>
            </div>
          </div>
        )}

        {/* Outcome Guide (Collapsible) */}
        <div className="border border-stone-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 transition-colors"
          >
            <span>Outcome Bands Guide</span>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showGuide && (
            <div className="p-3 space-y-2">
              {OUTCOME_BANDS.map((band) => (
                <div key={band.id} className={`flex items-start space-x-2 p-2 rounded ${band.bgColor}`}>
                  <span className="text-xs font-mono font-bold text-stone-500 w-10">{band.range}</span>
                  <div>
                    <span className={`text-xs font-bold ${band.color}`}>{band.name}</span>
                    <p className="text-xs text-stone-600">{band.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Roll History (Collapsible) */}
        {rollHistory.length > 0 && (
          <div className="border border-stone-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 transition-colors"
            >
              <div className="flex items-center space-x-1">
                <History className="w-3.5 h-3.5" />
                <span>Roll History ({rollHistory.length})</span>
              </div>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showHistory && (
              <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                {rollHistory.map((outcome, idx) => {
                  const styles = getOutcomeStyles(outcome.band);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${styles.bg}`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-stone-500">
                          {outcome.rawRoll}+{outcome.shardBonus}={outcome.total}
                        </span>
                        <span className={`font-medium ${styles.text}`}>{outcome.title}</span>
                      </div>
                      <span className="text-stone-400 text-[10px]">
                        {outcome.shardId}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
