"use client"

import { useState } from "react";
import { SINGLE_FOCUS_RATES } from "./rates";
import GachaSimulator from "./simulator";
import GachaStatter from "./statter";
import { PULL_TYPE, PullRates, RARITY, SimpleRates } from "./types";

export default function Gacha(){
    // pull rates are global state for both simulator and statter
    const [pullRates, setPullRates] = useState<PullRates>(SINGLE_FOCUS_RATES);
    return <div>
        <RateEditor rates={pullRates} setPullRates={setPullRates} />
        <GachaSimulator pullRates={pullRates}/>
        <GachaStatter pullRates={pullRates}/>
        </div>
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