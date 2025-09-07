"use client"

import { useState } from "react";
import { SINGLE_FOCUS_RATES } from "./rates";
import GachaSimulator from "./simulator";
import GachaStatter from "./statter";
import { GachaType, PullType, PullRates, Rarity, SimpleRates } from "./types";

export default function Gacha(){
    // pull rates are global state for both simulator and statter
    const [pullRates, setPullRates] = useState<PullRates>(SINGLE_FOCUS_RATES);
    // Lift gachaType state to parent
    const [gachaType, setGachaType] = useState<GachaType>(GachaType.SUPPORT_CARD);

    return <div>
        <RateEditor rates={pullRates} setPullRates={setPullRates} />
        <GachaTypeSelector gachaType={gachaType} setGachaType={setGachaType} />
        <GachaSimulator pullRates={pullRates} gachaType={gachaType}/>
        <GachaStatter pullRates={pullRates}/>
        </div>
    }

// ctor from PullRates by taking the first entry of 1-pull rates
function fromPullRates(rates: PullRates): SimpleRates {
        return { ...rates[PullType.ONE][0] }; 
}

function RateEditor({ rates, setPullRates: setRates }: { rates: PullRates, setPullRates: (rates: PullRates) => void }) {
    const [error, setError] = useState<string | null>(null);

    const simpleRates = fromPullRates(rates);

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
                        value={simpleRates[Rarity.SSR]}
                        onChange={e => handleChange(Rarity.SSR, parseFloat(e.target.value) || 0)}
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
                        value={simpleRates[Rarity.SSR_FOCUS]}
                        onChange={e => handleChange(Rarity.SSR_FOCUS, parseFloat(e.target.value) || 0)}
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
                        value={simpleRates[Rarity.SR]}
                        onChange={e => handleChange(Rarity.SR, parseFloat(e.target.value) || 0)}
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
                        value={simpleRates[Rarity.SR_FOCUS]}
                        onChange={e => handleChange(Rarity.SR_FOCUS, parseFloat(e.target.value) || 0)}
                        className="border rounded px-2 py-1 w-20"
                    />
                </div>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
    );
}

function GachaTypeSelector({ gachaType, setGachaType }: { gachaType: GachaType, setGachaType: (type: GachaType) => void }) {
    return (
        <div className="mb-4">
            <label className="block mb-2 font-medium">Select Gacha Type:</label>
            <div className="flex gap-2">
                <button
                    type="button"
                    className={`px-4 py-2 rounded ${gachaType === GachaType.TRAINEE ? "bg-blue-600 text-white" : "bg-gray-800 text-white"}`}
                    onClick={() => setGachaType(GachaType.TRAINEE)}
                >
                    Trainee
                </button>
                <button
                    type="button"
                    className={`px-4 py-2 rounded ${gachaType === GachaType.SUPPORT_CARD ? "bg-blue-600 text-white" : "bg-gray-800 text-white"}`}
                    onClick={() => setGachaType(GachaType.SUPPORT_CARD)}
                >
                    Support Card
                </button>
            </div>
        </div>
    );
}