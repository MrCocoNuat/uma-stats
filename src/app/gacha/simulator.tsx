"use client"

import { useState, useEffect, useRef } from "react";
import { GachaType, PullType, PullRates, PullResult, Rarity } from "./types";
import { GachaPrize } from "./assets";

//TODO: results should probably be state in GachaSimulator
export default function GachaSimulator(
        {pullRates, gachaType}: {pullRates: PullRates, gachaType: GachaType}
){
    return (
        <div className="p-4 mb-4 border flex flex-col items-center">
            <h2 className="text-2xl font-bold">Simulator</h2>
            <Puller gachaType={gachaType} pullRates={pullRates} />
        </div>
    );
}


const PRIZE_INTERVAL_MILLIS = 15;
const PRIZE_FADEIN_MILLIS = 300;

function Puller({ gachaType, pullRates }: { gachaType: GachaType, pullRates: PullRates }) {
    const [result, setResult] = useState<PullResult | null>(null);
    const [visiblePrizes, setVisiblePrizes] = useState(0);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const timeoutsRef = useRef<number[]>([]);

    useEffect(() => {
        setResult(null);
        setVisiblePrizes(0);
        setIsFadingOut(false);
        // Clear any timeouts on gachaType change
        timeoutsRef.current.forEach(id => clearTimeout(id));
        timeoutsRef.current = [];
    }, [gachaType]);

    const handlePull = (pulls: PullType) => {
        // Clear any previous timeouts
        timeoutsRef.current.forEach(id => clearTimeout(id));
        timeoutsRef.current = [];
        setIsFadingOut(true); // Instantly hide all prizes (no transition)
        setVisiblePrizes(0);
        setTimeout(() => {
            setResult(null); // Remove previous prizes
            setIsFadingOut(false); // Enable fade-in for new prizes
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
                console.error("Rates do not sum to 1! ", rates);
                return Rarity.R; // fallback, should not happen if rates sum to 1
            }) as PullResult;
            setResult(results);
            results.forEach((_, i) => {
                const timeoutId = window.setTimeout(() => setVisiblePrizes(v => Math.max(v, i + 1)), i * PRIZE_INTERVAL_MILLIS);
                timeoutsRef.current.push(timeoutId);
            });
        }, 10); // Small delay to ensure opacity-0 is rendered first
    };

    return (
        <div className="mt-4 flex flex-col items-center">
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
                <div
                    className={`grid ${result.length === 1 ? "grid-cols-1" : "grid-cols-5"} gap-2 justify-items-center`}
                >
                    {result.map((rarity, idx) => (
                        <div
                            key={idx}
                            className={`${isFadingOut ? '' : `transition-opacity duration-[${PRIZE_FADEIN_MILLIS}ms]`} ${idx < visiblePrizes ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <GachaPrize gachaType={gachaType} rarity={rarity} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

