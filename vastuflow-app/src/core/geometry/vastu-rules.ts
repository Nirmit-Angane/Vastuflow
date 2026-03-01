import { VastuDirection } from "./types";

export type PlacementStatus = "best" | "good" | "bad" | "worst";

export type VastuItem =
    | "Pooja/Mandir"
    | "Kitchen"
    | "Master Bedroom"
    | "Kids Bedroom"
    | "Locker"
    | "Water Pump/Bore"
    | "Toilets"
    | "Washing Machine"
    | "Study Table"
    | "Dining Table"
    | "Office Desk"
    | "Trophies and Medals"
    | "Family Photo"
    | "Overhead Watertank"
    | "Underground Watertank"
    | "Entrance";

// Maps a given VastuItem to specific Devta fields that override the general 16-zone rule.
// E.g., placing a Toilet mapping in "Yama" is worst, but in "Bhrisha" might be okay.
export const DEVTA_PLACEMENT_OVERRIDES: Partial<Record<VastuItem, Record<string, PlacementStatus>>> = {
    "Entrance": {
        // Based on 32 Entrance grids
        "Jayant": "best", "Mahendra": "best",
        "Vitatha": "good", "Brihatkshat": "good",
        "Sugreev": "good", "Pushpdant": "best", "Varun": "good",
        "Mukhya": "good", "Bhallat": "best", "Soma": "good"
    },
    "Toilets": {
        "Bhrisha": "good", // ESE toilet
        "Pusha": "good", // SSE toilet
        "Sugreev": "good", // SSW toilet
        "Asur": "good", // WNW toilet
        "Shosha": "good", // WNW toilet
        "Papyakshma": "good" // WNW/NW toilet
    },
    "Kitchen": {
        "Parjanya": "worst", // NE
        "Shikhi": "worst", // NE
        "Bhrisha": "good", // SE
        "Antariksh": "good", // SE
        "Anil": "good", // SE
        "Pusha": "good"
    }
};

// Extracted from the provided Vastu rules chart.
export const VASTU_PLACEMENT_RULES: Record<VastuItem, Partial<Record<VastuDirection, PlacementStatus>>> = {
    "Pooja/Mandir": {
        NNW: "bad", N: "bad", NNE: "good", NE: "good", ENE: "good", E: "bad", ESE: "bad", SE: "bad", SSE: "bad", S: "bad", SSW: "bad", SW: "bad", WSW: "bad", W: "good", WNW: "bad", NW: "bad"
    },
    "Kitchen": {
        NNW: "bad", N: "bad", NNE: "bad", NE: "worst", ENE: "bad", E: "bad", ESE: "bad", SE: "good", SSE: "good", S: "good", SSW: "bad", SW: "bad", WSW: "bad", W: "good", WNW: "bad", NW: "bad"
    },
    "Master Bedroom": {
        NNW: "good", N: "good", NNE: "bad", NE: "bad", ENE: "good", E: "good", ESE: "bad", SE: "good", SSE: "good", S: "best", SSW: "best", SW: "best", WSW: "good", W: "best", WNW: "worst", NW: "good"
    },
    "Kids Bedroom": {
        NNW: "good", N: "good", NNE: "good", NE: "good", ENE: "good", E: "good", ESE: "bad", SE: "good", SSE: "good", S: "good", SSW: "worst", SW: "good", WSW: "good", W: "good", WNW: "worst", NW: "good"
    },
    "Locker": {
        NNW: "bad", N: "good", NNE: "bad", NE: "bad", ENE: "bad", E: "bad", ESE: "bad", SE: "bad", SSE: "bad", S: "bad", SSW: "bad", SW: "good", WSW: "best", W: "best", WNW: "bad", NW: "bad"
    },
    "Water Pump/Bore": {
        NNW: "good", N: "good", NNE: "good", NE: "good", ENE: "good", E: "good", ESE: "bad", SE: "bad", SSE: "bad", S: "bad", SSW: "bad", SW: "bad", WSW: "bad", W: "bad", WNW: "bad", NW: "bad"
    },
    "Toilets": {
        NNW: "bad", N: "bad", NNE: "bad", NE: "worst", ENE: "bad", E: "bad", ESE: "good", SE: "bad", SSE: "bad", S: "bad", SSW: "good", SW: "bad", WSW: "bad", W: "bad", WNW: "good", NW: "bad"
    },
    "Washing Machine": {
        NNW: "bad", N: "bad", NNE: "bad", NE: "worst", ENE: "bad", E: "bad", ESE: "good", SE: "bad", SSE: "bad", S: "bad", SSW: "good", SW: "bad", WSW: "bad", W: "bad", WNW: "good", NW: "bad"
    },
    "Study Table": {
        NNW: "bad", N: "good", NNE: "good", NE: "best", ENE: "bad", E: "good", ESE: "bad", SE: "good", SSE: "good", S: "good", SSW: "worst", SW: "good", WSW: "best", W: "good", WNW: "worst", NW: "good"
    },
    "Dining Table": {
        NNW: "good", N: "good", NNE: "good", NE: "good", ENE: "good", E: "good", ESE: "good", SE: "good", SSE: "good", S: "good", SSW: "worst", SW: "good", WSW: "good", W: "good", WNW: "bad", NW: "good"
    },
    "Office Desk": {
        NNW: "good", N: "good", NNE: "good", NE: "good", ENE: "good", E: "good", ESE: "good", SE: "good", SSE: "good", S: "good", SSW: "worst", SW: "good", WSW: "good", W: "best", WNW: "bad", NW: "good"
    },
    "Trophies and Medals": {
        NNW: "good", N: "good", NNE: "good", NE: "good", ENE: "good", E: "good", ESE: "bad", SE: "good", SSE: "good", S: "best", SSW: "worst", SW: "good", WSW: "good", W: "best", WNW: "worst", NW: "good"
    },
    "Family Photo": {
        NNW: "good", N: "good", NNE: "good", NE: "good", ENE: "good", E: "good", ESE: "bad", SE: "good", SSE: "good", S: "good", SSW: "worst", SW: "best", WSW: "good", W: "good", WNW: "worst", NW: "best"
    },
    "Overhead Watertank": {
        NNW: "bad", N: "bad", NNE: "bad", NE: "worst", ENE: "bad", E: "bad", ESE: "bad", SE: "bad", SSE: "good", S: "good", SSW: "good", SW: "bad", WSW: "good", W: "good", WNW: "good", NW: "good"
    },
    "Underground Watertank": {
        NNW: "good", N: "good", NNE: "good", NE: "good", ENE: "good", E: "good", ESE: "bad", SE: "bad", SSE: "bad", S: "bad", SSW: "bad", SW: "bad", WSW: "bad", W: "bad", WNW: "bad", NW: "bad"
    },
    "Entrance": {
        // We will default the entrance mapping logic to simple directional bad/good later based on specific entrance degrees
        // A placeholder mapping for now since the chart mainly covers inner items:
        NNW: "bad", N: "good", NNE: "best", NE: "bad", ENE: "best", E: "good", ESE: "bad", SE: "bad", SSE: "bad", S: "best", SSW: "bad", SW: "worst", WSW: "bad", W: "best", WNW: "bad", NW: "good"
    }
};
