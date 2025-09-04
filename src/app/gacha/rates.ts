
// return some default rates:

import { PULL_TYPE, PullRates, RARITY } from "./types";

// "Double SSR focus"
// One pull: SSR = 3% of which 1.5% focus, SR = 18%, R = the rest (79%)
// Ten pull: same as one pull, but 10th pull cannot be R (SR = 97%)
export const DOUBLE_FOCUS_RATES: PullRates = {
    [PULL_TYPE.ONE]: [
        {
            [RARITY.SSR_FOCUS]: 0.015,
            [RARITY.SSR]: 0.015,
            [RARITY.SR_FOCUS]: 0,
            [RARITY.SR]: 0.18,
            [RARITY.R_FOCUS]: 0,
            [RARITY.R]: 0.79,
        }
    ],
    [PULL_TYPE.TEN]: [
            // first 9 pulls
            ...Array(9).fill({
                [RARITY.SSR_FOCUS]: 0.015,
                [RARITY.SSR]: 0.015,
                [RARITY.SR_FOCUS]: 0.09,
                [RARITY.SR]: 0.09,
                [RARITY.R_FOCUS]: 0,
                [RARITY.R]: 0.79,
            }),
            // 10th pull (guaranteed SR or above)
            {
                [RARITY.SSR_FOCUS]: 0.015,
                [RARITY.SSR]: 0.015,
                [RARITY.SR_FOCUS]: 0.441,
                [RARITY.SR]: 0.441,
                [RARITY.R_FOCUS]: 0,
                [RARITY.R]: 0,
            }
        ],
};

// "SSR/SR focus"
// One pull: SSR = 3% of which 0.75% focus, SR = 18% of which 2.25% focus, R = the rest (79%)
// Ten pull: same as one pull, but 10th pull cannot be R (SR = 97%)
export const SINGLE_FOCUS_RATES: PullRates = {
    [PULL_TYPE.ONE]: [
        {
            [RARITY.SSR_FOCUS]: 0.0075,
            [RARITY.SSR]: 0.0225,
            [RARITY.SR_FOCUS]: 0.0225,
            [RARITY.SR]: 0.1575,
            [RARITY.R_FOCUS]: 0,
            [RARITY.R]: 0.79,
        }
    ],
    [PULL_TYPE.TEN]: [
            // first 9 pulls
            ...Array(9).fill({
                [RARITY.SSR_FOCUS]: 0.0075,
                [RARITY.SSR]: 0.0225,
                [RARITY.SR_FOCUS]: 0.1125,
                [RARITY.SR]: 0.0675,
                [RARITY.R_FOCUS]: 0,
                [RARITY .R]: 0.79,
            }),
            // 10th pull (guaranteed SR or above)
            {
                [RARITY.SSR_FOCUS]: 0.0075,
                [RARITY.SSR]: 0.0225,
                [RARITY.SR_FOCUS]: 0.27675,
                [RARITY.SR]: 0.69375,
                [RARITY.R_FOCUS]: 0,
                [RARITY.R]: 0,
            }
        ],
};