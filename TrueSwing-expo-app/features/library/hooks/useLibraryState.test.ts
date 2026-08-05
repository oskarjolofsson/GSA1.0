import { renderHook, waitFor } from "@testing-library/react-native";

import { getIssueCatalog } from "features/issues/services/issueAuthoringService";
import { fetchTaxonomy, readCachedTaxonomy, type Taxonomy } from "features/library/services/taxonomyService";
import { useLibraryState } from "features/library/hooks/useLibraryState";

jest.mock("features/library/services/taxonomyService", () => ({
    fetchTaxonomy: jest.fn(),
    readCachedTaxonomy: jest.fn(),
}));

jest.mock("features/issues/services/issueAuthoringService", () => ({
    getIssueCatalog: jest.fn(),
}));

const mockFetchTaxonomy = fetchTaxonomy as jest.Mock;
const mockReadCache = readCachedTaxonomy as jest.Mock;
const mockCatalog = getIssueCatalog as jest.Mock;

const taxonomy: Taxonomy = {
    areas: [
        { key: "FULL_SWING", label: "Full swing", golfer_label: "Full swing", blurb: null, sort: 0 },
        { key: "PUTTING", label: "Putting", golfer_label: "Putting", blurb: "On the green", sort: 1 },
    ],
    goals: [],
    misses: [],
    misses_by_area: {},
    kinds: ["fault", "skill"],
    default_area: "FULL_SWING",
    default_kind: "fault",
};

describe("useLibraryState", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockReadCache.mockResolvedValue(null);
        mockFetchTaxonomy.mockResolvedValue(taxonomy);
        mockCatalog.mockResolvedValue([]);
    });

    it("renders the areas even when the issue catalog fails", async () => {
        // The Promise.all trap: one rejection must not take the other fetch's
        // result with it, or the landing hides five working areas.
        mockCatalog.mockRejectedValue(new Error("catalog 500"));

        const { result } = await renderHook(() => useLibraryState());

        await waitFor(() => expect(result.current.taxonomyStatus).toBe("ready"));
        expect(result.current.areas.map((a) => a.key)).toEqual(["FULL_SWING", "PUTTING"]);
        expect(result.current.catalogStatus).toBe("error");
    });

    it("falls back to the cached taxonomy when the request fails", async () => {
        mockReadCache.mockResolvedValue(taxonomy);
        mockFetchTaxonomy.mockRejectedValue(new Error("offline"));

        const { result } = await renderHook(() => useLibraryState());

        await waitFor(() => expect(result.current.taxonomyStatus).toBe("ready"));
        expect(result.current.areas).toHaveLength(2);
    });

    it("surfaces an error only when there is no cache to fall back on", async () => {
        mockFetchTaxonomy.mockRejectedValue(new Error("offline"));

        const { result } = await renderHook(() => useLibraryState());

        await waitFor(() => expect(result.current.taxonomyStatus).toBe("error"));
        expect(result.current.areas).toEqual([]);
    });
});
