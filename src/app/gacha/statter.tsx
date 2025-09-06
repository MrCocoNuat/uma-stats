"use client"

import { useState, useEffect, useMemo } from "react";
import { PullRates, STATTER_TYPE } from "./types";
import { negativeBinomialCdf } from "./stats";
import FunctionValueLineChart from "./testchart";

const MAX_BREAKS = 4;
const MAX_HITS = 5;
const HITS_PER_SPARK = 200; 
const MAX_PULLS = HITS_PER_SPARK*MAX_HITS; // 5 sparks is always enough, but maybe user does not want to spark


export default function GachaStatter({pullRates} : {pullRates: PullRates}){
    // use state two modes, type is STATTER_TYPE
    const [mode, setMode] = useState<STATTER_TYPE>(STATTER_TYPE.N_HITS);
    const [pointOfInterest, setPointOfInterest] = useState<{x: number, y: number} | null>(null);

    return (
        <div className="p-4 border rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Gacha Statistics</h2>
            <StatTypeSelector mode={mode} setMode={setMode} />
            <div>
                {mode === STATTER_TYPE.N_HITS ? (
                    <p>You have selected to view statistics by set Number of Hits.</p>
                ) : (
                    <p>You have selected to view statistics by set Number of Pulls.</p>
                )}
            </div>
            <text>Point of Interest: {pointOfInterest ? `(${pointOfInterest.x}, ${pointOfInterest.y.toFixed(4)})` : "None"}</text>
            {mode === STATTER_TYPE.N_PULLS ?
                <NPullsStatter pullRates={pullRates}/> :
                <NHitsStatter pullRates={pullRates} setPointOfInterest={setPointOfInterest}/>
            }
        </div>
    );

}

// shows, given number of pulls, the distribution of number of hits of each rarity
// line graph: x axis = number of pulls, y axis = probability, lines = categorical of >= # hits

// oh man, it is the same distribution altogether

//specs:
// 
function NPullsStatter({pullRates}: {pullRates: PullRates}){

    // using statistics.js, create a Bin distribution for SSR_FOCUS and SR_FOCUS rarities based on the pull rates 
    // Example: SSR_FOCUS and SR_FOCUS are keys in pullRates with probability values
    const ssrFocusProb = 0.0075;


    return <div>NPullsStatter</div>
}


// shows, given number of hits, the cumdistribution of number of pulls needed to get that many hits
// line graph: x axis = number of hits, y axis = probability
function NHitsStatter({pullRates, setPointOfInterest}: {pullRates: PullRates, setPointOfInterest: (point : {x: number, y: number} | null) => void}){
    const [desiredBreaks, setDesiredBreaks] = useState(MAX_BREAKS);
    // A slider to select desired hits, between 0 and MAX_BREAKS
    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDesiredBreaks(parseInt(event.target.value));
    }

    // using statistics.js, create a NB distribution for SSR_FOCUS and SR_FOCUS rarities based on the pull rates
    // Example: SSR_FOCUS and SR_FOCUS are keys in pullRates with probability values
    const ssrFocusProb = 0.0075;
    const srFocusProb = 0.0225;

    // construct the negative binomial distribution for number of pulls to get r hits
    // TODO: allow specifying sparks
    const distributions = useMemo(() => 
        Array.from({length: 5}, (_, r) => 
            negativeBinomialCdf(r+1, ssrFocusProb, MAX_PULLS)
        )
    , [ssrFocusProb]);
    
    return <div>
                <label htmlFor="hitsRange" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Desired Limit Breaks: {desiredBreaks}
        </label>
        <input
            type="range"
            id="hitsRange"
            name="hitsRange"
            min="0"
            max={MAX_BREAKS}
            value={desiredBreaks}
            onChange={handleSliderChange}
            className="w-full"
        />
        <FunctionValueLineChart data={distributions} highlightDataset={desiredBreaks} setHighlightDataset={i => {console.debug(i); if (typeof i === "number") setDesiredBreaks(i);}} setPointOfInterest={setPointOfInterest}/>
    </div>
}

// helper component for selecting the stat type
function StatTypeSelector({ mode, setMode }: { mode: STATTER_TYPE, setMode: (mode: STATTER_TYPE) => void }) {
    return (
        <div className="flex gap-2 mb-4">
            <button
                className={`px-4 py-2 rounded ${mode === STATTER_TYPE.N_HITS ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'}`}
                onClick={() => setMode(STATTER_TYPE.N_HITS)}
            >
                By Number of Hits
            </button>
            <button
                className={`px-4 py-2 rounded ${mode === STATTER_TYPE.N_PULLS ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'}`}
                onClick={() => setMode(STATTER_TYPE.N_PULLS)}
            >
                By Number of Pulls
            </button>
        </div>
    );
}
