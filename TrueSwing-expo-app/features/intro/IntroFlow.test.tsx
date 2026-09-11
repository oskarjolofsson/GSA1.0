import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import IntroFlow from "./IntroFlow";
import { getOnboardingCatalog } from "./services/introCatalogService";
import { hasSeenIntro } from "./services/introSelectionService";

jest.mock("features/auth/AuthProvider", () => ({
    useAuth: () => ({ session: null, loading: false }),
}));

jest.mock("./services/introCatalogService", () => {
    const actual = jest.requireActual("./services/introCatalogService");
    return { ...actual, getOnboardingCatalog: jest.fn() };
});

jest.mock("./services/introSelectionService", () => ({
    hasSeenIntro: jest.fn(),
    markIntroSeen: jest.fn().mockResolvedValue(undefined),
    savePendingSelection: jest.fn().mockResolvedValue(undefined),
}));

const mockGetCatalog = getOnboardingCatalog as jest.Mock;
const mockHasSeenIntro = hasSeenIntro as jest.Mock;

const catalog = {
    areas: [
        { key: "PUTTING", label: "Putting", golfer_label: "Putting", blurb: "On the green", sort: 10 },
    ],
    goals: [{ key: "SPEED_CONTROL", label: "Speed control", golfer_label: "Dial in my speed", sort: 10 }],
    misses: [
        {
            key: "DECEL",
            area: "PUTTING",
            label: "Deceleration",
            golfer_label: "I decelerate",
            sort: 10,
        },
    ],
    issues: [
        {
            id: "skill-1",
            title: "Distance control",
            description: null,
            area: "PUTTING",
            kind: "skill",
            source: "catalog",
            layman_title: "Better distance control",
            goals: ["SPEED_CONTROL"],
            misses: [],
            drills: [],
        },
        {
            id: "fault-1",
            title: "Decelerating through impact",
            description: null,
            area: "PUTTING",
            kind: "fault",
            source: "catalog",
            layman_title: "Stop decelerating",
            goals: [],
            misses: ["DECEL"],
            drills: [],
        },
    ],
};

const METRICS = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

describe("IntroFlow", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockHasSeenIntro.mockResolvedValue(false);
        mockGetCatalog.mockResolvedValue(catalog);
    });

    it("narrows the focus list to the chosen goal's kind", async () => {
        const screen = await render(
            <SafeAreaProvider initialMetrics={METRICS}>
                <IntroFlow />
            </SafeAreaProvider>
        );

        fireEvent.press(await screen.findByText("Choose your first focus"));
        fireEvent.press(await screen.findByText("Putting"));

        // Goal step: get better vs fix an issue.
        fireEvent.press(await screen.findByText("Fix an issue"));

        // Branch step: the one more layer the library has, narrowing by miss.
        fireEvent.press(await screen.findByText("I decelerate"));

        // Focus step shows only the fault-kind issue on that miss.
        await waitFor(() => expect(screen.queryByText("Stop decelerating")).toBeTruthy());
        expect(screen.queryByText("Better distance control")).toBeNull();
    });
});
