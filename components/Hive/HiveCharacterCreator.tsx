// components/Hive/HiveCharacterCreator.tsx
// ============================================
// Character Creation Wizard for new HIVE players
// ============================================

import React, { useState } from "react";
import { ORDER_DESCRIPTIONS, type HiveOrder, type HiveCharacter, createDefaultCharacter } from "./types";
import { HIVE_SHARDS, SHARD_VALUE_MAX, SHARD_VALUE_LABELS, type ShardId } from "./shards";
import { User, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";

interface HiveCharacterCreatorProps {
  onCharacterCreated: (character: HiveCharacter) => void;
}

type CreatorStep = "intro" | "name" | "order" | "shards" | "trial" | "complete";

export const HiveCharacterCreator: React.FC<HiveCharacterCreatorProps> = ({
  onCharacterCreated,
}) => {
  const [step, setStep] = useState<CreatorStep>("intro");
  const [name, setName] = useState("");
  const [order, setOrder] = useState<HiveOrder>("SCOUT");
  const [shardValues, setShardValues] = useState<Record<ShardId, number>>({
    ASH: 2,
    VEILS: 2,
    FROST: 2,
    SONG: 2,
    STONE: 2,
    ECHOES: 2,
    DAWN: 2,
  });
  const [unresolvedTrial, setUnresolvedTrial] = useState("");

  const totalPoints: number = (Object.values(shardValues) as number[]).reduce((sum, val) => sum + val, 0);
  const maxPoints = 14;
  const remainingPoints = maxPoints - totalPoints;

  const handleShardChange = (shardId: ShardId, delta: number) => {
    const current: number = shardValues[shardId];
    const newValue: number = Math.max(0, Math.min(SHARD_VALUE_MAX, current + delta));
    const newTotal: number = totalPoints - current + newValue;
    
    if (newTotal <= maxPoints) {
      setShardValues((prev) => ({ ...prev, [shardId]: newValue }));
    }
  };

  const handleComplete = () => {
    const character = createDefaultCharacter(name, order);
    character.shardValues = { ...shardValues };
    character.unresolvedTrial = unresolvedTrial;
    onCharacterCreated(character);
  };

  const canProceed = () => {
    switch (step) {
      case "name":
        return name.trim().length > 0;
      case "shards":
        return totalPoints <= maxPoints;
      default:
        return true;
    }
  };

  const steps: CreatorStep[] = ["intro", "name", "order", "shards", "trial", "complete"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-gradient-to-b from-stone-100 to-stone-200">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-stone-200">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* INTRO */}
          {step === "intro" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-800">Welcome to the HIVE</h1>
                <p className="text-stone-500 mt-2">
                  A civic RPG where choices echo through time
                </p>
              </div>
              <div className="text-left space-y-3 bg-stone-50 p-4 rounded-lg text-sm text-stone-600">
                <p>
                  In the HIVE, you are not a hero seeking power. You are a citizen navigating 
                  moral complexity.
                </p>
                <p>
                  Your character is defined by <span className="font-semibold">Seven Shards</span> — 
                  fragments of inner virtue that shape how you face challenges.
                </p>
                <p>
                  Every action has a cost. The dice don't decide if you win — they decide 
                  <span className="font-semibold"> what price you pay</span>.
                </p>
              </div>
              <button
                onClick={() => setStep("name")}
                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Begin Character Creation
              </button>
            </div>
          )}

          {/* NAME */}
          {step === "name" && (
            <div className="space-y-6">
              <div className="text-center">
                <User className="w-12 h-12 mx-auto text-indigo-500" />
                <h2 className="text-xl font-bold text-stone-800 mt-2">What is your name?</h2>
                <p className="text-stone-500 text-sm mt-1">
                  Choose a name that reflects who you wish to become
                </p>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Kira of the Eastern Dome"
                className="w-full px-4 py-3 border border-stone-300 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                autoFocus
              />
            </div>
          )}

          {/* ORDER */}
          {step === "order" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-stone-800">Choose Your Order</h2>
                <p className="text-stone-500 text-sm mt-1">
                  Each order represents a phase of civic growth
                </p>
              </div>
              <div className="space-y-2">
                {(Object.entries(ORDER_DESCRIPTIONS) as [HiveOrder, typeof ORDER_DESCRIPTIONS[HiveOrder]][]).map(
                  ([key, info]) => (
                    <button
                      key={key}
                      onClick={() => setOrder(key)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        order === key
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div className={`font-bold ${info.color}`}>{info.name}</div>
                      <p className="text-sm text-stone-600 mt-1">{info.description}</p>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* SHARDS */}
          {step === "shards" && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-stone-800">Allocate Your Shards</h2>
                <p className="text-stone-500 text-sm mt-1">
                  Distribute {maxPoints} points across your moral attributes
                </p>
                <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                  remainingPoints < 0 ? 'bg-red-100 text-red-600' : 
                  remainingPoints === 0 ? 'bg-emerald-100 text-emerald-600' : 
                  'bg-amber-100 text-amber-600'
                }`}>
                  {remainingPoints} points remaining
                </div>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {HIVE_SHARDS.map((shard) => {
                  const value = shardValues[shard.id];
                  return (
                    <div
                      key={shard.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${shard.borderColor} ${shard.bgColor}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm ${shard.color}`}>
                          {shard.name}
                          <span className="text-xs text-stone-500 font-normal ml-1">
                            ({shard.tagline})
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 truncate">
                          {SHARD_VALUE_LABELS[value]}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleShardChange(shard.id, -1)}
                          disabled={value <= 0}
                          className="w-8 h-8 rounded-full bg-white border border-stone-300 text-stone-600 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-bold text-lg">{value}</span>
                        <button
                          onClick={() => handleShardChange(shard.id, 1)}
                          disabled={value >= SHARD_VALUE_MAX || remainingPoints <= 0}
                          className="w-8 h-8 rounded-full bg-white border border-stone-300 text-stone-600 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TRIAL */}
          {step === "trial" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-stone-800">Your Unresolved Trial</h2>
                <p className="text-stone-500 text-sm mt-1">
                  Every character carries something unfinished
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-800">
                <p>
                  What moral wound does your character carry? What haunts them? 
                  What have they not yet reconciled?
                </p>
              </div>
              <textarea
                value={unresolvedTrial}
                onChange={(e) => setUnresolvedTrial(e.target.value)}
                placeholder="E.g. I abandoned my mentor when they needed me most, choosing my own safety over their survival..."
                className="w-full px-4 py-3 border border-stone-300 rounded-lg min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-xs text-stone-400 text-center">
                Optional — you can leave this blank and discover it through play
              </p>
            </div>
          )}

          {/* COMPLETE */}
          {step === "complete" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-800">
                  Welcome, {name}
                </h2>
                <p className={`font-medium ${ORDER_DESCRIPTIONS[order].color}`}>
                  {ORDER_DESCRIPTIONS[order].name} of the HIVE
                </p>
              </div>
              <div className="bg-stone-50 p-4 rounded-lg text-sm text-stone-600 text-left space-y-2">
                <p>
                  Your shards are set. Your path awaits.
                </p>
                <p>
                  Remember: in the HIVE, power is not rewarded for ambition — 
                  but for responsibility across time.
                </p>
                <p className="font-medium text-indigo-600">
                  "We heal as we walk."
                </p>
              </div>
              <button
                onClick={handleComplete}
                className="w-full py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Enter the HIVE
              </button>
            </div>
          )}

          {/* Navigation */}
          {step !== "intro" && step !== "complete" && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-200">
              <button
                onClick={() => setStep(steps[currentStepIndex - 1])}
                className="flex items-center space-x-1 px-4 py-2 text-sm text-stone-600 hover:text-stone-800"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(steps[currentStepIndex + 1])}
                disabled={!canProceed()}
                className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  canProceed()
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
