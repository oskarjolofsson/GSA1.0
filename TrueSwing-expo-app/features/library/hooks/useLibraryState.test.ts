import { act, renderHook, waitFor } from "@testing-library/react-native";

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

    it("routes area -> kind -> focus, same fork intro asks about, then back down again", async () => {
        const { result } = await renderHook(() => useLibraryState());
        await waitFor(() => expect(result.current.taxonomyStatus).toBe("ready"));

        const area = result.current.areas[0];
        await act(async () => result.current.openArea(area));
        expect(result.current.view).toBe("kind");
        expect(result.current.area?.key).toBe(area.key);

        await act(async () => result.current.chooseKind("fault"));
        expect(result.current.view).toBe("focus");
        expect(result.current.kind).toBe("fault");

        // goBack walks back down one hierarchy level at a time, same as intro's
        // back button, clearing the kind selection on the way past it.
        await act(async () => {
            const stillOpen = result.current.goBack();
            expect(stillOpen).toBe(true);
        });
        expect(result.current.view).toBe("kind");
        expect(result.current.kind).toBeNull();

        await act(async () => {
            const stillOpen = result.current.goBack();
            expect(stillOpen).toBe(true);
        });
        expect(result.current.view).toBe("areas");
        expect(result.current.area).toBeNull();

        // Nowhere left to go -- the caller (LibraryScreen) dismisses the screen.
        let atTop = true;
        await act(async () => {
            atTop = result.current.goBack();
        });
        expect(atTop).toBe(false);
    });
});
