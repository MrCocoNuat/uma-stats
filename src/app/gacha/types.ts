// 1 or 10 pulls
export type PullResult = [Rarity] | [Rarity, Rarity, Rarity, Rarity, Rarity, Rarity, Rarity, Rarity, Rarity, Rarity];

// trainee and support card rarities have the same forms
export enum Rarity {
    R = "R",
    R_FOCUS = "R Focus",
    SR = "SR",
    SR_FOCUS = "SR Focus",
    SSR = "SSR",
    SSR_FOCUS = "SSR Focus",
}

export enum GachaType {
    SUPPORT_CARD = "Support Card",
    TRAINEE = "Trainee",
}

export enum PullType {
    ONE = 1,
    TEN = 10,
}

// with multi-pulls, rates can change per pull (e.g. guaranteed SR on 10th pull)
export type PullRates = {
    [key in PullType]: 
        { [rarity in Rarity]: number }[];
};

export type SimpleRates = {
    [rarity in Rarity]: number;
}

export enum StatterType {
    N_HITS = "N Hits",
    N_PULLS = "N Pulls",
}