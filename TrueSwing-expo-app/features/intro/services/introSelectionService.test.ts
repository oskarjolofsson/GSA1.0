import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    clearPendingSelection,
    hasSeenIntro,
    INTRO_SEEN_KEY,
    INTRO_SELECTION_KEY,
    markIntroSeen,
    readPendingSelection,
    savePendingSelection,
} from "features/intro/services/introSelectionService";

jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

const DAY_MS = 24 * 60 * 60 * 1000;

function storedSelection(agedDays = 0) {
    return JSON.stringify({
        issueId: "issue-1",
        areaKey: "PUTTING",
        savedAt: new Date(Date.now() - agedDays * DAY_MS).toISOString(),
    });
}

describe("introSelectionService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetItem.mockResolvedValue(null);
        mockSetItem.mockResolvedValue(undefined);
        mockRemoveItem.mockResolvedValue(undefined);
    });

    it("stores the pick with the area and a timestamp", async () => {
        await savePendingSelection("issue-1", "PUTTING");

        const [key, raw] = mockSetItem.mock.calls[0];
        expect(key).toBe(INTRO_SELECTION_KEY);
        const written = JSON.parse(raw);
        expect(written.issueId).toBe("issue-1");
        // The area rides along so home can open on it without re-resolving the issue.
        expect(written.areaKey).toBe("PUTTING");
        expect(Number.isNaN(Date.parse(written.savedAt))).toBe(false);
    });

    it("reads a fresh pick back", async () => {
        mockGetItem.mockResolvedValue(storedSelection());

        await expect(readPendingSelection()).resolves.toMatchObject({
            issueId: "issue-1",
            areaKey: "PUTTING",
        });
    });

    it("drops a pick older than the retention window instead of returning it", async () => {
        // A phone that sat on the intro for months holds an issue id that may no
        // longer exist, for a choice the golfer will not remember making.
        mockGetItem.mockResolvedValue(storedSelection(31));

        await expect(readPendingSelection()).resolves.toBeNull();
        expect(mockRemoveItem).toHaveBeenCalledWith(INTRO_SELECTION_KEY);
    });

    it("drops a malformed blob rather than half-reading it", async () => {
        mockGetItem.mockResolvedValue(JSON.stringify({ issueId: "issue-1" }));

        await expect(readPendingSelection()).resolves.toBeNull();
        expect(mockRemoveItem).toHaveBeenCalledWith(INTRO_SELECTION_KEY);
    });

    it("returns null when storage itself throws", async () => {
        mockGetItem.mockRejectedValue(new Error("storage unavailable"));

        await expect(readPendingSelection()).resolves.toBeNull();
    });

    it("surfaces a failed save, so the flow can keep the golfer on the screen", async () => {
        // The one throwing path in this file. Swallowing it would send them through
        // sign-up believing they had chosen a focus.
        mockSetItem.mockRejectedValue(new Error("disk full"));

        await expect(savePendingSelection("issue-1", "PUTTING")).rejects.toThrow("disk full");
    });

    describe("the seen flag", () => {
        it("is false until the intro has been finished or skipped", async () => {
            await expect(hasSeenIntro()).resolves.toBe(false);
        });

        it("is true once marked", async () => {
            await markIntroSeen();
            expect(mockSetItem).toHaveBeenCalledWith(INTRO_SEEN_KEY, "1");

            mockGetItem.mockResolvedValue("1");
            await expect(hasSeenIntro()).resolves.toBe(true);
        });

        it("reads as unseen when storage throws, rather than blanking the launch", async () => {
            mockGetItem.mockRejectedValue(new Error("storage unavailable"));

            await expect(hasSeenIntro()).resolves.toBe(false);
        });
    });

    it("clears the pick without throwing when removal fails", async () => {
        mockRemoveItem.mockRejectedValue(new Error("storage unavailable"));

        await expect(clearPendingSelection()).resolves.toBeUndefined();
    });
});
