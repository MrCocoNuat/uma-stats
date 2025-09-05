"use client"

import { useState } from "react";
import { GACHA_TYPE, PULL_TYPE, PullRates, PullResult, RARITY, SimpleRates } from "./types";
import { DOUBLE_FOCUS_RATES, SINGLE_FOCUS_RATES } from "./rates";

//TODO: results should probably be state in GachaSimulator
export default function GachaSimulator(
        {pullRates}: {pullRates: PullRates}
){
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
            
            <Puller gachaType={gachaType} pullRates={pullRates} />
        </div>
    );
}


function Puller({ gachaType, pullRates }: { gachaType: GACHA_TYPE, pullRates: PullRates }) {
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
                    className={`px-4 py-2 rounded ${gachaType === GACHA_TYPE.TRAINEE ? "bg-blue-600 text-white" : "bg-gray-800 text-white"}`}
                    onClick={() => setGachaType(GACHA_TYPE.TRAINEE)}
                >
                    Trainee
                </button>
                <button
                    type="button"
                    className={`px-4 py-2 rounded ${gachaType === GACHA_TYPE.SUPPORT_CARD ? "bg-blue-600 text-white" : "bg-gray-800 text-white"}`}
                    onClick={() => setGachaType(GACHA_TYPE.SUPPORT_CARD)}
                >
                    Support Card
                </button>
            </div>
        </div>
    );
}