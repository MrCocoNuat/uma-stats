"use client"

import { useState } from "react";
import { GACHA_TYPE, PULL_TYPE, PullRates, PullResult, RARITY, SimpleRates } from "./types";
import { DOUBLE_FOCUS_RATES, SINGLE_FOCUS_RATES } from "./rates";

export default function GachaSimulator(){
    // store the gacha type in state
    const [gachaType, setGachaType] = useState<GACHA_TYPE>(GACHA_TYPE.TRAINEE);
    
    return (
        <div className="p-4 border rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Pull Simulator</h2>
            <GachaTypeSelector gachaType={gachaType} setGachaType={setGachaType} />

            <div>
                {gachaType === GACHA_TYPE.TRAINEE ? (
                    <p>You have selected the Trainee Gacha.</p>
                ) : (
                    <p>You have selected the Support Card Gacha.</p>
                )}
            </div>
            
            <Puller gachaType={gachaType} />
        </div>
    );
}


function Puller({ gachaType }: { gachaType: GACHA_TYPE }) {
    // state for rates definition, using the Rates type
    const [pullRates, setPullRates] = useState<PullRates>(SINGLE_FOCUS_RATES);
    const [result, setResult] = useState<PullResult | null>(null);

    const handlePull = (pulls: PULL_TYPE) => {
        const selectedRates = pullRates[pulls];

        const results = selectedRates.map((rates) => {
            // generate a result in rates based on the defined rates, picking according to the probabilities defined for each key
            // random number between 0 and 1
            const rand = Math.random();
            let cumulative = 0;
            for (const rarity in rates) {
                cumulative += rates[rarity as RARITY];
                if (rand < cumulative) {
                    return rarity as RARITY;
                }
            }
            return RARITY.R; // fallback, should not happen if rates sum to 1
        }) as PullResult;
        setResult(results);
    };

    return (
        <div className="mt-4">
            <div className="flex gap-2 mb-2">
                <button
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={() => handlePull(PULL_TYPE.ONE)}
                >
                    Pull 1
                </button>
                <button
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={() => handlePull(PULL_TYPE.TEN)}
                >
                    Pull 10
                </button>
            </div>

            {result && (
                <div className="flex gap-2">
                    {result.map((rarity, idx) => (
                        <span key={idx} className="px-2 py-1 border rounded bg-yellow-900">{rarity}</span>
                    ))}
                </div>
            )}

            <RateEditor rates={pullRates} setPullRates={setPullRates} />
        </div>
    );
}

// ctor from PullRates by taking the first entry of 1-pull rates
function fromPullRates(rates: PullRates): SimpleRates {
        return { ...rates[PULL_TYPE.ONE][0] }; 
}

function RateEditor({ rates, setPullRates: setRates }: { rates: PullRates, setPullRates: (rates: PullRates) => void }) {
    const [error, setError] = useState<string | null>(null);

    const simpleRates = fromPullRates(rates);

    // Helper to compute the rates object for both 1-pull and 10-pull cases from SimpleRate
    function computeFullRates(simpleRates: SimpleRates) : PullRates {
        // Calculate the remainder R
        const rRate =
            1 -
                ((simpleRates[RARITY.SSR] ?? 0) +
                (simpleRates[RARITY.SSR_FOCUS] ?? 0) +
                (simpleRates[RARITY.SR] ?? 0) +
                (simpleRates[RARITY.SR_FOCUS] ?? 0));

        // 1-pull rates: as-is, plus R as "r"
        const single = { ...simpleRates, [RARITY.R]: rRate };

        // 10-pull rates:
        //  - 9 pulls: same as single
        //  - 10th pull: transfer R into SR
        const tenthSR = (simpleRates[RARITY.SR] ?? 0) + rRate;
        const tenth = {
            ...simpleRates,
            sr: tenthSR,
            r: 0,
        };

        return {
            [PULL_TYPE.ONE]: [single],
            [PULL_TYPE.TEN]: Array(9).fill(single).concat([tenth]),
        };
    }

    const handleChange = (key: keyof SimpleRates, value: number) => {
        const newRates = { ...simpleRates, [key]: value };
        const sum =
            (newRates[RARITY.SSR] ?? 0) +
            (newRates[RARITY.SSR_FOCUS] ?? 0) +
            (newRates[RARITY.SR] ?? 0) +
            (newRates[RARITY.SR_FOCUS] ?? 0);

        if (sum > 1) {
            setError("Sum of rates cannot exceed 1");
        } else {
            setError(null);
        }
        setRates(computeFullRates(newRates));
    };

    return (
        <div className="mb-4">
            <label className="block font-medium mb-2">Edit Rates:</label>
            <div className="flex gap-2 mb-2">
                <div>
                    <label className="block text-xs">SSR</label>
                    <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.001}
                        value={simpleRates[RARITY.SSR]}
                        onChange={e => handleChange(RARITY.SSR, parseFloat(e.target.value) || 0)}
                        className="border rounded px-2 py-1 w-20"
                    />
                </div>
                <div>
                    <label className="block text-xs">SSR Focus</label>
                    <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.001}
                        value={simpleRates[RARITY.SSR_FOCUS]}
                        onChange={e => handleChange(RARITY.SSR_FOCUS, parseFloat(e.target.value) || 0)}
                        className="border rounded px-2 py-1 w-20"
                    />
                </div>
                <div>
                    <label className="block text-xs">SR</label>
                    <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.001}
                        value={simpleRates[RARITY.SR]}
                        onChange={e => handleChange(RARITY.SR, parseFloat(e.target.value) || 0)}
                        className="border rounded px-2 py-1 w-20"
                    />
                </div>
                <div>
                    <label className="block text-xs">SR Focus</label>
                    <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.001}
                        value={simpleRates[RARITY.SR_FOCUS]}
                        onChange={e => handleChange(RARITY.SR_FOCUS, parseFloat(e.target.value) || 0)}
                        className="border rounded px-2 py-1 w-20"
                    />
                </div>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
    );
}

function GachaTypeSelector({ gachaType, setGachaType }: { gachaType: GACHA_TYPE, setGachaType: (type: GACHA_TYPE) => void }) {
    return (
        <div className="mb-4">
            <label className="block mb-2 font-medium">Select Gacha Type:</label>
            <div className="flex gap-2">
                <button
                    type="button"
                    className={`px-4 py-2 rounded ${gachaType === GACHA_TYPE.TRAINEE ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    onClick={() => setGachaType(GACHA_TYPE.TRAINEE)}
                >
                    Trainee
                </button>
                <button
                    type="button"
                    className={`px-4 py-2 rounded ${gachaType === GACHA_TYPE.SUPPORT_CARD ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    onClick={() => setGachaType(GACHA_TYPE.SUPPORT_CARD)}
                >
                    Support Card
                </button>
            </div>
        </div>
    );
}