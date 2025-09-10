import { GachaType, Rarity } from "./types";

// gacha simulator assets
export function GachaPrize({ gachaType, rarity }: { gachaType : GachaType, rarity: Rarity }) {
    const isFocus = (rarity === Rarity.SSR_FOCUS || rarity === Rarity.SR_FOCUS || rarity === Rarity.R_FOCUS);
    const names = {
        [GachaType.SUPPORT_CARD]: {
            [Rarity.R]: "R",
            [Rarity.R_FOCUS]: "R",
            [Rarity.SR]: "SR",
            [Rarity.SR_FOCUS]: "SR",
            [Rarity.SSR]: "SSR",
            [Rarity.SSR_FOCUS]: "SSR",
        },
        [GachaType.TRAINEE]: {
            [Rarity.R]: "★",
            [Rarity.R_FOCUS]: "★",
            [Rarity.SR]: "★★",
            [Rarity.SR_FOCUS]: "★★",
            [Rarity.SSR]: "★★★",
            [Rarity.SSR_FOCUS]: "★★★",
        }
    };
    // Card background and border for non-SSR
    const baseColorClasses = {
        [GachaType.SUPPORT_CARD]: {
            [Rarity.R]: "bg-gray-900 border-gray-400",
            [Rarity.R_FOCUS]: "bg-gray-900 border-gray-400",
            [Rarity.SR]: "bg-yellow-900 border-yellow-400",
            [Rarity.SR_FOCUS]: "bg-yellow-900 border-yellow-400",
        },
        [GachaType.TRAINEE]: {
            [Rarity.R]: "bg-gray-900 border-gray-400",
            [Rarity.R_FOCUS]: "bg-gray-900 border-gray-400",
            [Rarity.SR]: "bg-yellow-900 border-yellow-400",
            [Rarity.SR_FOCUS]: "bg-yellow-900 border-yellow-400",
        }
    };

    // SSR/SSR_FOCUS: use gradient border wrappers
    const isSSR = rarity === Rarity.SSR || rarity === Rarity.SSR_FOCUS;
    // SUPPORT_CARD: Tailwind diagonal gradient background (no border on inner div)
    if (isSSR && gachaType === GachaType.SUPPORT_CARD) {
        return (
            <div className="p-1 rounded h-16 md:h-20 aspect-square bg-gradient-to-br from-violet-400 via-blue-300 to-green-400 shadow-[0_0_8px_white]">
                <div className="p-0 flex flex-col h-full aspect-square items-center justify-center text-center bg-gradient-to-br from-violet-800 via-blue-800 to-green-800">
                    <span className="text-xl font-bold text-shadow-[0_0_2px_black,0_0_4px_yellow]">{names[gachaType][rarity]}</span>
                    {isFocus && <BannerFocusBadge />}
                </div>
            </div>
        );
    }
    // TRAINEE: conic gradient background (no border on inner div)
    if (isSSR && gachaType === GachaType.TRAINEE) {
        return (
            <div
                className="p-1 rounded h-16 md:h-20 aspect-square shadow-[0_0_8px_white]"
                style={{
                    background:
                        "conic-gradient(from 225deg at 50% 50%, #a78bfa 0deg, #60a5fa 60deg, #4ade80 120deg, #fbbf24 210deg, #f472b6 300deg, #a78bfa 360deg)",
                }}
            >
                <div
                    className="p-0 flex flex-col h-full aspect-square items-center justify-center text-center"
                    style={{
                        background:
                            "conic-gradient(from 225deg at 50% 50%, #5b21b6 0deg, #1e40af 60deg, #15803d 120deg, #b45309 210deg, #a21caf 300deg, #5b21b6 360deg)",
                    }}
                >
                    <span className="text-xl font-bold text-shadow-[0_0_2px_black,0_0_4px_yellow]">{names[gachaType][rarity]}</span>
                    {isFocus && <BannerFocusBadge />}
                </div>
            </div>
        );
    }

    // All other rarities: normal Tailwind color classes
    return (
        <div
            className={`p-0 flex flex-col h-16 md:h-20 aspect-square items-center justify-center border-4 rounded text-center ${baseColorClasses[gachaType][rarity as Exclude<Rarity, Rarity.SSR | Rarity.SSR_FOCUS>]}`}
        >
            <span className="text-xl font-bold text-shadow-[0_0_1px_black,0_0_2px_yellow]">{names[gachaType][rarity as Exclude<Rarity, Rarity.SSR | Rarity.SSR_FOCUS>]}</span>
            {isFocus && <BannerFocusBadge />}
        </div>
    );
}

function BannerFocusBadge() {
    return (
        <div className="text-xs font-semibold text-shadow-[0_0_2px_black,0_0_4px_yellow]">
            FOCUS
        </div>
    );
}