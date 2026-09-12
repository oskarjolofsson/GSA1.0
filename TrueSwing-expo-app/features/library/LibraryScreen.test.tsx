/**
 * Covers the one genuinely new code path from wiring StepTransition into the
 * library: direction/variant must track depth in the areas -> focus ->
 * candidates hierarchy, and fall back to "fade" when search opens/closes
 * rather than pushing in a direction that wouldn't mean anything.
 *
 * `render`/`rerender` are awaited throughout -- React 19 renders
 * concurrently and RNTL 14 returns promises from both.
 */
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import LibraryScreen from "./LibraryScreen";
import type { LibraryView, CandidateFilter } from "./hooks/useLibraryState";

const METRICS = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

function renderScreen() {
    return render(
        <SafeAreaProvider initialMetrics={METRICS}>
            <LibraryScreen onCancel={jest.fn()} onDone={jest.fn()} />
        </SafeAreaProvider>
    );
}

const mockStepTransitionSpy = jest.fn();
jest.mock("features/shared/components/StepTransition", () => ({
    __esModule: true,
    default: function MockStepTransition(props: {
        screenKey: string;
        direction: 1 | -1;
        variant: "push" | "fade";
        children: unknown;
    }) {
        mockStepTransitionSpy({ direction: props.direction, variant: props.variant });
        return props.children;
    },
}));

jest.mock("./hooks/useAreaStats", () => () => ({}));

// LibraryScreen registers a 402 retry via useBilling; not under test here.
jest.mock("features/billing/BillingContext", () => ({
    useBilling: () => ({ setPendingRetry: jest.fn() }),
}));

type MockLibState = {
    areas: unknown[];
    area: { key: string; golfer_label: string } | null;
    fork: unknown;
    issues: unknown[];
    candidates: unknown[];
    view: LibraryView;
    filter: CandidateFilter | null;
    query: string;
    taxonomyStatus: "loading" | "ready" | "error";
    taxonomyError: string | null;
    catalogStatus: "loading" | "ready" | "error";
    catalogError: string | null;
    setQuery: jest.Mock;
    openArea: jest.Mock;
    openFilter: jest.Mock;
    goBack: jest.Mock;
    retryTaxonomy: jest.Mock;
    retryCatalog: jest.Mock;
};

function makeLibState(over: Partial<MockLibState> = {}): MockLibState {
    return {
        areas: [],
        area: null,
        fork: null,
        issues: [],
        candidates: [],
        view: "areas",
        filter: null,
        query: "",
        taxonomyStatus: "ready",
        taxonomyError: null,
        catalogStatus: "ready",
        catalogError: null,
        setQuery: jest.fn(),
        openArea: jest.fn(),
        openFilter: jest.fn(),
        goBack: jest.fn(() => false),
        retryTaxonomy: jest.fn(),
        retryCatalog: jest.fn(),
        ...over,
    };
}

let mockLibState: MockLibState = makeLibState();

jest.mock("./hooks/useLibraryState", () => ({
    useLibraryState: () => mockLibState,
}));

describe("LibraryScreen step transition", () => {
    beforeEach(() => {
        mockStepTransitionSpy.mockClear();
        mockLibState = makeLibState();
    });

    it("pushes forward when depth grows (areas -> focus)", async () => {
        const view = await renderScreen();
        mockStepTransitionSpy.mockClear();

        mockLibState = makeLibState({ view: "focus", area: { key: "FULL_SWING", golfer_label: "Full swing" } });
        await view.rerender(
            <SafeAreaProvider initialMetrics={METRICS}>
                <LibraryScreen onCancel={jest.fn()} onDone={jest.fn()} />
            </SafeAreaProvider>
        );

        expect(mockStepTransitionSpy).toHaveBeenLastCalledWith({ direction: 1, variant: "push" });
    });

    it("pushes backward when depth shrinks (focus -> areas)", async () => {
        mockLibState = makeLibState({ view: "focus", area: { key: "FULL_SWING", golfer_label: "Full swing" } });
        const view = await renderScreen();
        mockStepTransitionSpy.mockClear();

        mockLibState = makeLibState({ view: "areas" });
        await view.rerender(
            <SafeAreaProvider initialMetrics={METRICS}>
                <LibraryScreen onCancel={jest.fn()} onDone={jest.fn()} />
            </SafeAreaProvider>
        );

        expect(mockStepTransitionSpy).toHaveBeenLastCalledWith({ direction: -1, variant: "push" });
    });

    it("fades instead of pushing when search opens, regardless of view depth", async () => {
        mockLibState = makeLibState({ view: "focus", area: { key: "FULL_SWING", golfer_label: "Full swing" } });
        const view = await renderScreen();
        mockStepTransitionSpy.mockClear();

        // Same view/depth, only the query changes -- entering search is
        // orthogonal to the hierarchy, not a move within it.
        mockLibState = makeLibState({
            view: "focus",
            area: { key: "FULL_SWING", golfer_label: "Full swing" },
            query: "bunker",
        });
        await view.rerender(
            <SafeAreaProvider initialMetrics={METRICS}>
                <LibraryScreen onCancel={jest.fn()} onDone={jest.fn()} />
            </SafeAreaProvider>
        );

        expect(mockStepTransitionSpy).toHaveBeenLastCalledWith({ direction: 1, variant: "fade" });
    });

    it("fades when search closes back to the same view", async () => {
        mockLibState = makeLibState({ view: "areas", query: "bunker" });
        const view = await renderScreen();
        mockStepTransitionSpy.mockClear();

        mockLibState = makeLibState({ view: "areas", query: "" });
        await view.rerender(
            <SafeAreaProvider initialMetrics={METRICS}>
                <LibraryScreen onCancel={jest.fn()} onDone={jest.fn()} />
            </SafeAreaProvider>
        );

        expect(mockStepTransitionSpy).toHaveBeenLastCalledWith({ direction: 1, variant: "fade" });
    });
});
