"use client"

import { useState } from "react";
import { DOUBLE_FOCUS_RATES, SINGLE_FOCUS_RATES } from "./rates";
import GachaSimulator from "./simulator";
import GachaStatter from "./statter";
import { GachaType, PullType, PullRates, Rarity, SimpleRates } from "./types";

export default function Gacha(){
    // pull rates are global state for both simulator and statter
    const [pullRates, setPullRates] = useState<PullRates>(SINGLE_FOCUS_RATES);
    // Lift gachaType state to parent
    const [gachaType, setGachaType] = useState<GachaType>(GachaType.SUPPORT_CARD);

    return <div>
        <GachaTypeSelector gachaType={gachaType} setGachaType={setGachaType} />
        <RateEditor rates={pullRates} setPullRates={setPullRates} />
        <GachaStatter pullRates={pullRates}/>
        <GachaSimulator pullRates={pullRates} gachaType={gachaType}/>

        </div>
    }

// ctor from PullRates by taking the first entry of 1-pull rates
function fromPullRates(rates: PullRates): SimpleRates {
        return { ...rates[PullType.ONE][0] }; 
}

// Helper to compute the rates object for both 1-pull and 10-pull cases from SimpleRate
function computeFullRates(simpleRates: SimpleRates) : PullRates {
    // Calculate the remainder R
    const rRate =
        1 -
            ((simpleRates[Rarity.SSR] ?? 0) +
            (simpleRates[Rarity.SSR_FOCUS] ?? 0) +
            (simpleRates[Rarity.SR] ?? 0) +
            (simpleRates[Rarity.SR_FOCUS] ?? 0));

    // 1-pull rates: as-is, plus R as "r"
    const single = { ...simpleRates, [Rarity.R]: rRate };

    // 10-pull rates:
    //  - 9 pulls: same as single
    //  - 10th pull: transfer R into SR
    const tenthSR = (simpleRates[Rarity.SR] ?? 0) + rRate;
    const tenth = {
        ...simpleRates,
        sr: tenthSR,
        r: 0,
    };

    return {
        [PullType.ONE]: [single],
        [PullType.TEN]: Array(9).fill(single).concat([tenth]),
    };
}

function RateEditor({ rates, setPullRates: setRates }: { rates: PullRates, setPullRates: (rates: PullRates) => void }) {
    const [error, setError] = useState<string | null>(null);

    const simpleRates = fromPullRates(rates);

    const handleChange = (key: keyof SimpleRates, value: number) => {
        const newRates = { ...simpleRates, [key]: value };
        const sum =
            (newRates[Rarity.SSR] ?? 0) +
            (newRates[Rarity.SSR_FOCUS] ?? 0) +
            (newRates[Rarity.SR] ?? 0) +
            (newRates[Rarity.SR_FOCUS] ?? 0);
        
            if (sum > 1) {
            setError("Sum of rates cannot exceed 1");
        } else {
            setRates(computeFullRates(newRates));
            setError(null);
        }
    };

    const rateFields = [
        { key: Rarity.SSR, label: "SSR", writable: true },
        { key: Rarity.SSR_FOCUS, label: "SSR Focus", writable: true },
        { key: Rarity.SR, label: "SR", writable: true },
        { key: Rarity.SR_FOCUS, label: "SR Focus", writable: true },
        { key: Rarity.R, label: "N", writable: false },
    ];

    return (
        <div className="border-1 mb-4 p-4 flex gap-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">Edit Rates</h2>
                <div className="flex gap-2 mb-2">
                    {rateFields.map(({ key, label }) => (
                        <div key={key}>
                            <label className="block text-xs">{label}</label>
                            <input
                                type="number"
                                min={0}
                                max={1}
                                step={0.0025}
                                value={simpleRates[key]}
                                onChange={e => handleChange(key, parseFloat(e.target.value) || 0)}
                                className="border rounded px-2 py-1 w-20"
                            />
                        </div>
                    ))}
                </div>
                <div className="self-end text-sm text-gray-500 italic">
                    Note: R rate is auto-calculated as the remainder from 100%
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
            </div>
            <div className="flex flex-col" >
                <div>Presets</div>
                {[{
                    type: "Single Focus",
                    rates: SINGLE_FOCUS_RATES,
                },
                {
                    type: "Double Focus",
                    rates: DOUBLE_FOCUS_RATES
                }].map(({ type, rates: presetRates }) => (
                    <button
                        key={type}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
                        onClick={() => setRates(presetRates)}
                    >
                        {type}
                    </button>
                ))}
                {[{
                    type: "Banner Placeholder 1",
                    rates: SINGLE_FOCUS_RATES,
                },
                {
                    type: "Banner Placeholder 2",
                    rates: DOUBLE_FOCUS_RATES,
                }].map(({ type, rates: presetRates }) => (
                    <button
                        key={type}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
                        onClick={() => setRates(presetRates)}
                    >
                        {type}
                    </button>
                ))
                }
            </div>
                
        </div>
    );
}

function GachaTypeSelector({ gachaType, setGachaType }: { gachaType: GachaType, setGachaType: (type: GachaType) => void }) {
    return (
        <div className="mb-4 border-1 flex flex-col items-center"> 
            <div className="flex justify-center gap-2 w-full">
                {[{ type: GachaType.TRAINEE, label: "Trainee" }, { type: GachaType.SUPPORT_CARD, label: "Support Card" }].map(({ type, label }) => {
                    const selected = gachaType === type;
                    return (
                        <button
                            key={type}
                            type="button"
                            className={
                                "p-2 rounded transition-colors " +
                                (selected
                                    ? "bg-gradient-to-br from-red-700 to-green-700 text-white"
                                    : "bg-gradient-to-br text-white hover:from-green-800 hover:to-blue-800 border border-gray-700")
                            }
                            onClick={() => setGachaType(type)}
                            style={{ minWidth: 120 }}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}