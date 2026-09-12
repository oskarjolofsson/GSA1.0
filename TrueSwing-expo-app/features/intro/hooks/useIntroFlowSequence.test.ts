import { act, renderHook } from "@testing-library/react-native";

import { useIntroFlowSequence } from "features/intro/hooks/useIntroFlowSequence";

describe("useIntroFlowSequence", () => {
    it("starts on welcome and moves through area -> goal -> branch -> focus by name", async () => {
        const { result } = await renderHook(() => useIntroFlowSequence());

        expect(result.current.currentScreen).toBe("welcome");

        await act(async () => result.current.goToArea());
        expect(result.current.currentScreen).toBe("area");

        await act(async () => result.current.goToGoal());
        expect(result.current.currentScreen).toBe("goal");

        await act(async () => result.current.goToBranch());
        expect(result.current.currentScreen).toBe("branch");

        await act(async () => result.current.goToFocus());
        expect(result.current.currentScreen).toBe("focus");

        await act(async () => result.current.goToWelcome());
        expect(result.current.currentScreen).toBe("welcome");
    });
});
