import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "lib/apiClient";

import {
    fetchTaxonomy,
    readCachedTaxonomy,
    TAXONOMY_CACHE_KEY,
    TAXONOMY_CACHE_VERSION,
    type Taxonomy,
} from "features/library/services/taxonomyService";

// The service imports the named `apiClient`, so both exports must be the same
// object for the assertions below to see the call.
jest.mock("lib/apiClient", () => {
    const client = { get: jest.fn() };
    return { __esModule: true, default: client, apiClient: client };
});

jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() },
}));

const mockGet = (apiClient as unknown as { get: jest.Mock }).get;
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

const taxonomy: Taxonomy = {
    areas: [{ key: "PUTTING", label: "Putting", golfer_label: "Putting", blurb: "On the green", sort: 0 }],
    goals: [{ key: "DISTANCE", label: "Distance", golfer_label: "More distance", blurb: null, sort: 0 }],
    misses: [],
    misses_by_area: {
        PUTTING: [
            { key: "SHORT", label: "Short", golfer_label: "I leave it short", blurb: null, sort: 0, area: "PUTTING" },
        ],
    },
    kinds: ["fault", "skill"],
    default_area: "FULL_SWING",
    default_kind: "fault",
};

describe("taxonomyService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetItem.mockResolvedValue(null);
        mockSetItem.mockResolvedValue(undefined);
    });

    it("fetches from the taxonomy endpoint and writes through to the cache", async () => {
        mockGet.mockResolvedValue(taxonomy);

        const result = await fetchTaxonomy();

        expect(mockGet).toHaveBeenCalledWith("/api/v1/taxonomy/");
        expect(result).toEqual(taxonomy);
        expect(mockSetItem).toHaveBeenCalledWith(
            TAXONOMY_CACHE_KEY,
            JSON.stringify({ version: TAXONOMY_CACHE_VERSION, data: taxonomy })
        );
    });

    it("still resolves when the cache write fails", async () => {
        mockGet.mockResolvedValue(taxonomy);
        mockSetItem.mockRejectedValue(new Error("disk full"));

        await expect(fetchTaxonomy()).resolves.toEqual(taxonomy);
    });

    it("reads back what it wrote", async () => {
        mockGetItem.mockResolvedValue(
            JSON.stringify({ version: TAXONOMY_CACHE_VERSION, data: taxonomy })
        );

        await expect(readCachedTaxonomy()).resolves.toEqual(taxonomy);
    });

    it("reports no cache when nothing is stored", async () => {
        await expect(readCachedTaxonomy()).resolves.toBeNull();
    });

    it("discards a blob written under a different cache version", async () => {
        mockGetItem.mockResolvedValue(
            JSON.stringify({ version: TAXONOMY_CACHE_VERSION + 1, data: taxonomy })
        );

        await expect(readCachedTaxonomy()).resolves.toBeNull();
    });

    it("discards an unversioned blob from an older build", async () => {
        mockGetItem.mockResolvedValue(JSON.stringify(taxonomy));

        await expect(readCachedTaxonomy()).resolves.toBeNull();
    });

    it("discards unparseable content", async () => {
        mockGetItem.mockResolvedValue("{not json");

        await expect(readCachedTaxonomy()).resolves.toBeNull();
    });

    it("discards a blob of the right version but the wrong shape", async () => {
        mockGetItem.mockResolvedValue(
            JSON.stringify({
                version: TAXONOMY_CACHE_VERSION,
                data: { areas: [{ key: "PUTTING" }], goals: [], misses_by_area: {} },
            })
        );

        await expect(readCachedTaxonomy()).resolves.toBeNull();
    });

    it("treats a storage failure as no cache rather than throwing", async () => {
        mockGetItem.mockRejectedValue(new Error("storage unavailable"));

        await expect(readCachedTaxonomy()).resolves.toBeNull();
    });
});
