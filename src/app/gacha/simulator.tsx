"use client"

import { useState } from "react";
import { GachaType, PullType, PullRates, PullResult, Rarity, SimpleRates } from "./types";
import { DOUBLE_FOCUS_RATES, SINGLE_FOCUS_RATES } from "./rates";
import { useEffect } from "react";
import { GachaPrize } from "./assets";

//TODO: results should probably be state in GachaSimulator
export default function GachaSimulator(
        {pullRates, gachaType}: {pullRates: PullRates, gachaType: GachaType}
){
    return (
        <div className="p-4 border rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Pull Simulator</h2>

            <div>
                {gachaType === GachaType.TRAINEE ? (
                    <p>You have selected the Trainee Gacha.</p>
                ) : (
                    <p>You have selected the Support Card Gacha.</p>
                )}
            </div>
            
            <Puller gachaType={gachaType} pullRates={pullRates} />
        </div>
    );
}


function Puller({ gachaType, pullRates }: { gachaType: GachaType, pullRates: PullRates }) {
    const [result, setResult] = useState<PullResult | null>(null);

    useEffect(() => {
        setResult(null);
    }, [gachaType]);

    const handlePull = (pulls: PullType) => {
        const selectedRates = pullRates[pulls];

        const results = selectedRates.map((rates) => {
            // generate a result in rates based on the defined rates, picking according to the probabilities defined for each key
            // random number between 0 and 1
            const rand = Math.random();
            let cumulative = 0;
            for (const rarity in rates) {
                cumulative += rates[rarity as Rarity];
                if (rand < cumulative) {
                    return rarity as Rarity;
                }
            }
            return Rarity.R; // fallback, should not happen if rates sum to 1
        }) as PullResult;
        setResult(results);
    };

    return (
        <div className="mt-4">
            <div className="flex gap-2 mb-2">
                <button
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={() => handlePull(PullType.ONE)}
                >
                    Pull 1
                </button>
                <button
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={() => handlePull(PullType.TEN)}
                >
                    Pull 10
                </button>
            </div>

            {result && (
                <div className="flex gap-2">
                    {result.map((rarity, idx) => (
                        <GachaPrize key={idx} gachaType={gachaType} rarity={rarity} />
                    ))}
                </div>
            )}
        </div>
    );
}

