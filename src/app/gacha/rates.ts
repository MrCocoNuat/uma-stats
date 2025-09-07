
// return some default rates:

import { PullType, PullRates, Rarity } from "./types";

// "Double SSR focus"
// One pull: SSR = 3% of which 1.5% focus, SR = 18%, R = the rest (79%)
// Ten pull: same as one pull, but 10th pull cannot be R (SR = 97%)
export const DOUBLE_FOCUS_RATES: PullRates = {
    [PullType.ONE]: [
        {
            [Rarity.SSR_FOCUS]: 0.015,
            [Rarity.SSR]: 0.015,
            [Rarity.SR_FOCUS]: 0,
            [Rarity.SR]: 0.18,
            [Rarity.R_FOCUS]: 0,
            [Rarity.R]: 0.79,
        }
    ],
    [PullType.TEN]: [
            // first 9 pulls
            ...Array(9).fill({
                [Rarity.SSR_FOCUS]: 0.015,
                [Rarity.SSR]: 0.015,
                [Rarity.SR_FOCUS]: 0.09,
                [Rarity.SR]: 0.09,
                [Rarity.R_FOCUS]: 0,
                [Rarity.R]: 0.79,
            }),
            // 10th pull (guaranteed SR or above)
            {
                [Rarity.SSR_FOCUS]: 0.015,
                [Rarity.SSR]: 0.015,
                [Rarity.SR_FOCUS]: 0.441,
                [Rarity.SR]: 0.441,
                [Rarity.R_FOCUS]: 0,
                [Rarity.R]: 0,
            }
        ],
};

// "SSR/SR focus"
// One pull: SSR = 3% of which 0.75% focus, SR = 18% of which 2.25% focus, R = the rest (79%)
// Ten pull: same as one pull, but 10th pull cannot be R (SR = 97%)
export const SINGLE_FOCUS_RATES: PullRates = {
    [PullType.ONE]: [
        {
            [Rarity.SSR_FOCUS]: 0.0075,
            [Rarity.SSR]: 0.0225,
            [Rarity.SR_FOCUS]: 0.0225,
            [Rarity.SR]: 0.1575,
            [Rarity.R_FOCUS]: 0,
            [Rarity.R]: 0.79,
        }
    ],
    [PullType.TEN]: [
            // first 9 pulls
            ...Array(9).fill({
                [Rarity.SSR_FOCUS]: 0.0075,
                [Rarity.SSR]: 0.0225,
                [Rarity.SR_FOCUS]: 0.1125,
                [Rarity.SR]: 0.0675,
                [Rarity.R_FOCUS]: 0,
                [Rarity .R]: 0.79,
            }),
            // 10th pull (guaranteed SR or above)
            {
                [Rarity.SSR_FOCUS]: 0.0075,
                [Rarity.SSR]: 0.0225,
                [Rarity.SR_FOCUS]: 0.27675,
                [Rarity.SR]: 0.69375,
                [Rarity.R_FOCUS]: 0,
                [Rarity.R]: 0,
            }
        ],
};