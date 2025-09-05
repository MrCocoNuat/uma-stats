// @ts-ignore
import Statistics from 'statistics.js';

// only really use static methods, so no need to meaningfully instantiate with data
const stats = new Statistics([], {});

export function negativeBinomialCdf(r: number, p: number, maxSupport?: number) : number[] {
    //default maxSupport to n + 10 / p
    if (maxSupport === undefined) {
        maxSupport = r + Math.ceil(10 / p);
    }

    // this is equal at each k to I_p(r,k+1) where I_p is the regularized incomplete beta function 0 to p
    return Array.from({length: maxSupport}).map((_, k) => 
        stats.regularisedBeta(p, r, k+1)
    );
}