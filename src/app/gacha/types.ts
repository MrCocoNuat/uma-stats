// 1 or 10 pulls
export type PullResult = [RARITY] | [RARITY, RARITY, RARITY, RARITY, RARITY, RARITY, RARITY, RARITY, RARITY, RARITY];

// trainee and support card rarities have the same forms
export enum RARITY {
    R = "R",
    R_FOCUS = "R Focus",
    SR = "SR",
    SR_FOCUS = "SR Focus",
    SSR = "SSR",
    SSR_FOCUS = "SSR Focus",
}

export enum GACHA_TYPE {
    SUPPORT_CARD = "Support Card",
    TRAINEE = "Trainee",
}

export enum PULL_TYPE {
    ONE = 1,
    TEN = 10,
}

// with multi-pulls, rates can change per pull (e.g. guaranteed SR on 10th pull)
export type PullRates = {
    [key in PULL_TYPE]: 
        { [rarity in RARITY]: number }[];
};

export type SimpleRates = {
    [rarity in RARITY]: number;
}

export enum STATTER_TYPE {
    N_HITS = "N Hits",
    N_PULLS = "N Pulls",
}