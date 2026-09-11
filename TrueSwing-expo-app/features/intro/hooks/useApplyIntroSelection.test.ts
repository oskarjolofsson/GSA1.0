import { renderHook, waitFor } from "@testing-library/react-native";

import { generateProgramFromIssue } from "features/programs/services/programService";
import {
    clearPendingSelection,
    readPendingSelection,
} from "features/intro/services/introSelectionService";
import { useApplyIntroSelection } from "features/intro/hooks/useApplyIntroSelection";
import { ApiError } from "lib/errors";

jest.mock("features/programs/services/programService", () => ({
    __esModule: true,
    generateProgramFromIssue: jest.fn(),
}));

jest.mock("features/intro/services/introSelectionService", () => ({
    __esModule: true,
    readPendingSelection: jest.fn(),
    clearPendingSelection: jest.fn(),
}));

const mockGenerate = generateProgramFromIssue as jest.Mock;
const mockRead = readPendingSelection as jest.Mock;
const mockClear = clearPendingSelection as jest.Mock;

const pending = { issueId: "issue-1", areaKey: "PUTTING", savedAt: new Date().toISOString() };

describe("useApplyIntroSelection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "warn").mockImplementation(() => {});
        mockClear.mockResolvedValue(undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it("starts the pending focus and clears it", async () => {
        mockRead.mockResolvedValue(pending);
        mockGenerate.mockResolvedValue({ id: "program-1" });

        const { result } = renderHook(() => useApplyIntroSelection());

        await waitFor(() => expect(result.current.state).toBe("done"));
        expect(mockGenerate).toHaveBeenCalledWith("issue-1");
        expect(mockClear).toHaveBeenCalled();
    });

    it("does nothing when no pick is waiting", async () => {
        mockRead.mockResolvedValue(null);

        const { result } = renderHook(() => useApplyIntroSelection());

        await waitFor(() => expect(result.current.state).toBe("done"));
        expect(mockGenerate).not.toHaveBeenCalled();
    });

    it("drops the pick when the server refuses it", async () => {
        // The issue is gone, the area is full, or there is no entitlement. Next launch
        // would be refused identically, so keeping it means failing on every cold
        // start forever.
        mockRead.mockResolvedValue(pending);
        mockGenerate.mockRejectedValue(new ApiError(404, "Issue not found"));

        const { result } = renderHook(() => useApplyIntroSelection());

        await waitFor(() => expect(result.current.state).toBe("done"));
        expect(mockClear).toHaveBeenCalled();
    });

    it("keeps the pick when the request never reached the server", async () => {
        // Offline or a dropped connection: the next launch should retry.
        mockRead.mockResolvedValue(pending);
        mockGenerate.mockRejectedValue(new TypeError("Network request failed"));

        const { result } = renderHook(() => useApplyIntroSelection());

        await waitFor(() => expect(result.current.state).toBe("done"));
        expect(mockClear).not.toHaveBeenCalled();
    });

    it("reaches 'done' on failure, so a bad pick never blocks the app", async () => {
        mockRead.mockResolvedValue(pending);
        mockGenerate.mockRejectedValue(new ApiError(500, "boom"));

        const { result } = renderHook(() => useApplyIntroSelection());

        await waitFor(() => expect(result.current.state).toBe("done"));
    });
});
