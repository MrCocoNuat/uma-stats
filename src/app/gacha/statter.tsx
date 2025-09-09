"use client"

import React, { useState, useEffect, useMemo, useRef } from "react";
import { PullType, PullRates, Rarity, GachaType } from "./types";
import { negativeBinomialCdf } from "./stats";
import FunctionValueLineChart from "./testchart";

const MAX_BREAKS = 4;
const MAX_HITS = 5;
const HITS_PER_SPARK = 200; 
const MAX_PULLS = HITS_PER_SPARK*MAX_HITS; // 5 sparks is always enough, but maybe user does not want to spark

function PointOfInterestDisplay({ 
    setHandlePoi,
    gachaType,
    desiredBreaks,
    setDesiredBreaks,
    applySparks,
    setApplySparks,
    pullRates
}: { 
    setHandlePoi: (cb: (point: {x: number, y: number} | null) => void) => void,
    gachaType: GachaType,
    desiredBreaks: number,
    setDesiredBreaks: (breaks: number) => void,
    applySparks: boolean,
    setApplySparks: (v: boolean) => void,
    pullRates: PullRates
}) {
    const [pointOfInterest, setPointOfInterest] = useState<{x: number, y: number} | null>(null);

    // Register the setter with the parent so the chart can update it
    useEffect(() => {
        setHandlePoi(setPointOfInterest);
    }, [setHandlePoi]);

    return (
        <>
            <div className="flex items-center mb-2">
                <input
                    type="checkbox"
                    id="applySparks"
                    checked={applySparks}
                    onChange={() => setApplySparks(!applySparks)}
                    className="mr-2"
                />
                <label htmlFor="applySparks" className="text-gray-700 dark:text-gray-300">
                    Apply Sparks To Target
                </label>
            </div>
            {gachaType === GachaType.SUPPORT_CARD ? (
                <SupportCardPoiDisplay 
                    pointOfInterest={pointOfInterest}
                    desiredBreaks={desiredBreaks}
                    setDesiredBreaks={setDesiredBreaks}
                    applySparks={applySparks}
                    pullRates={pullRates}
                />
            ) : 
                <></>
                // <TraineePoiDisplay pointOfInterest={pointOfInterest} />
            }
        </>
    );
}
// NEXT: the range input to set desired breaks does not refresh the chart. Figure out the data flow
function SupportCardPoiDisplay({pointOfInterest, desiredBreaks, setDesiredBreaks, applySparks, pullRates}: {pointOfInterest: {x: number, y: number} | null, desiredBreaks: number, setDesiredBreaks : (breaks: number) => void, applySparks: boolean, pullRates: PullRates}) {
    return (
        
        <div>
            <div className="flex flex-row space-x-2 mb-2">
            {Array.from({ length: MAX_BREAKS + 1 }, (_, i) => (
                <button
                key={i}
                className={`px-2 py-1 rounded border ${desiredBreaks === i ? "bg-blue-100 border-blue-500" : "bg-white border-gray-300"} flex items-center`}
                onClick={() => setDesiredBreaks(i)}
                aria-label={`Set desired breaks to ${i}`}
                type="button"
                >
                {Array.from({ length: MAX_BREAKS }, (_, j) =>
                    j < i ? (
                    // filled blue vertical rhombus
                    <svg key={j} width="16" height="16" viewBox="0 0 16 16" className="mx-0.5" aria-hidden="true">
                        <polygon points="8,2 14,8 8,14 2,8" fill="#2563eb" stroke="#2563eb" strokeWidth="1"/>
                    </svg>
                    ) : (
                    // empty rhombus
                    <svg key={j} width="16" height="16" viewBox="0 0 16 16" className="mx-0.5" aria-hidden="true">
                        <polygon points="8,2 14,8 8,14 2,8" fill="none" stroke="#2563eb" strokeWidth="1"/>
                    </svg>
                    )
                )}
                </button>
            ))}
            </div>
            {pointOfInterest ? (
            <div className="flex flex-col">
                <p>Probability of achieving the desired result in {pointOfInterest.x} pulls is {(pointOfInterest.y * 100).toFixed(2)}%</p>
            </div>
            ) : (
            <p>No point of interest selected.</p>
            )}
        </div>
    )
}


const MemoizedFunctionValueLineChart = React.memo(FunctionValueLineChart);

export default function GachaStatter({pullRates, gachaType} : {pullRates: PullRates, gachaType: GachaType}){

    const [desiredBreaks, setDesiredBreaks] = useState(MAX_BREAKS);
    const [applySparks, setApplySparks] = useState(true); // need to config this based off of desired rarity

    // callback registered by child chart to receive point of interest updates -- performance optimization
    // Store the setter for point of interest in a ref
    const handlePoiRef = useRef<((point: {x: number, y: number} | null) => void) | null>(null);
    // and allow child display component to set it
    const setHandlePoi = (setter: (point: {x: number, y: number} | null) => void) => {
        handlePoiRef.current = setter;
    };
    // Pass a callback to the chart that will call the latest setter
    const handleNewPoi = (point: {x: number, y: number} | null) => {
        if (handlePoiRef.current) handlePoiRef.current(point);
    };
    return (
        <div className="p-4 mb-4 border flex flex-col">
            <StatGraph pullRates={pullRates} setPointOfInterest={handleNewPoi} applySparks={applySparks} desiredBreaks={desiredBreaks} setDesiredBreaks={setDesiredBreaks}/>
            <div className="flex flex-col">
                <PointOfInterestDisplay setHandlePoi={setHandlePoi} gachaType={gachaType} desiredBreaks={desiredBreaks} setDesiredBreaks={setDesiredBreaks} applySparks={applySparks} setApplySparks={setApplySparks} pullRates={pullRates} />
            </div>
        </div>
    );

}



// shows, given number of hits, the cumdistribution of number of pulls needed to get that many hits
// line graph: x axis = number of hits, y axis = probability
function StatGraph({pullRates, setPointOfInterest, applySparks, desiredBreaks, setDesiredBreaks}: {pullRates: PullRates, setPointOfInterest: (point : {x: number, y: number} | null) => void, applySparks: boolean, desiredBreaks: number, setDesiredBreaks: (breaks: number) => void}){

    // using statistics.js, create a NB distribution for SSR_FOCUS and SR_FOCUS rarities based on the pull rates
    // Example: SSR_FOCUS and SR_FOCUS are keys in pullRates with probability values
    const ssrFocusProb = pullRates[PullType.ONE][0][Rarity.SSR_FOCUS];
    const srFocusProb = 0.0225;

    // construct the negative binomial distribution for number of pulls to get r hits
    const distributions = useMemo(() => {
        // First, build the base distributions as before
        const base = Array.from({length: 5}, (_, r) => {
            const cdf = negativeBinomialCdf(r + 1, ssrFocusProb, MAX_PULLS);
            // Pad with zeros for the impossibility of getting r hits in fewer than r pulls
            return Array(r + 1).fill(0).concat(cdf).slice(0, MAX_PULLS);
        });

        if (!applySparks) return base;

        // apply sparking if requested. Each spark effectively reduces the required hits by 1
        return base.map((dataset, r) =>
            dataset.map((_, i) => {
                const sparks = Math.floor((i + 1) / HITS_PER_SPARK);
                if (sparks >= r + 1) return 1.0;
                const targetR = r - sparks;
                if (targetR < 0) return 1.0;
                // dataset[targetR] may be shorter, so check bounds
                const arr = base[targetR];
                return arr && arr[i] !== undefined ? arr[i] : 1.0;
            })
        );
    }, [ssrFocusProb, applySparks]);
    
    return <div>
        <MemoizedFunctionValueLineChart xLabel={"Number of Pulls"} data={distributions} highlightDataset={desiredBreaks} setHighlightDataset={setDesiredBreaks} setPointOfInterest={setPointOfInterest}/>
    </div>
}
