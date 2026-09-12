import { fetchPublic } from "lib/apiClient";

import {
    areasWithIssues,
    branchesFor,
    getOnboardingCatalog,
    issuesForArea,
    issuesForAreaAndKind,
    issuesForBranch,
    type IntroIssue,
    type OnboardingCatalog,
} from "features/intro/services/introCatalogService";

jest.mock("lib/apiClient", () => ({
    __esModule: true,
    fetchPublic: jest.fn(),
}));

const mockFetchPublic = fetchPublic as jest.Mock;

function issue(
    id: string,
    area: string,
    kind: IntroIssue["kind"] = "fault",
    tags: { goals?: string[]; misses?: string[] } = {}
): IntroIssue {
    return {
        id,
        title: id,
        description: null,
        area,
        kind,
        source: "catalog",
        goals: tags.goals ?? [],
        misses: tags.misses ?? [],
        drills: [],
    };
}

const catalog: OnboardingCatalog = {
    areas: [
        { key: "PUTTING", label: "Putting", golfer_label: "Putting", blurb: "On the green", sort: 10 },
        { key: "BUNKER", label: "Bunker", golfer_label: "Bunker", blurb: null, sort: 20 },
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
        {
            key: "THIN",
            area: "BUNKER",
            label: "Thin contact",
            golfer_label: "I hit it thin",
            sort: 10,
        },
    ],
    issues: [
        issue("a", "PUTTING", "fault", { misses: ["DECEL"] }),
        issue("b", "PUTTING", "skill", { goals: ["SPEED_CONTROL"] }),
    ],
};

describe("introCatalogService", () => {
    beforeEach(() => jest.clearAllMocks());

    it("reads the catalog over the unauthenticated path", async () => {
        // The point of the endpoint: the intro runs before there is a token, so this
        // must not go through the Supabase-authenticated client.
        mockFetchPublic.mockResolvedValue(catalog);

        await expect(getOnboardingCatalog()).resolves.toEqual(catalog);
        expect(mockFetchPublic).toHaveBeenCalledWith("/api/v1/onboarding/catalog/");
    });

    it("scopes focus points to their area", () => {
        expect(issuesForArea(catalog.issues, "PUTTING").map((i) => i.id)).toEqual(["a", "b"]);
        expect(issuesForArea(catalog.issues, "BUNKER")).toEqual([]);
    });

    it("scopes focus points to their area and kind", () => {
        expect(issuesForAreaAndKind(catalog.issues, "PUTTING", "fault").map((i) => i.id)).toEqual([
            "a",
        ]);
        expect(issuesForAreaAndKind(catalog.issues, "PUTTING", "skill").map((i) => i.id)).toEqual([
            "b",
        ]);
        expect(issuesForAreaAndKind(catalog.issues, "BUNKER", "fault")).toEqual([]);
    });

    it("offers only the miss/goal branches with a startable issue behind them", () => {
        // Fault branch: only PUTTING's DECEL is tagged by a fault issue. THIN
        // (BUNKER) has no issue at all, so it never appears.
        expect(branchesFor(catalog, "PUTTING", "fault").map((b) => b.key)).toEqual(["DECEL"]);
        expect(branchesFor(catalog, "BUNKER", "fault")).toEqual([]);

        // Skill branch: SPEED_CONTROL is tagged by the skill issue.
        expect(branchesFor(catalog, "PUTTING", "skill").map((b) => b.key)).toEqual([
            "SPEED_CONTROL",
        ]);
    });

    it("scopes focus points to one branch of the fork", () => {
        expect(issuesForBranch(catalog, "PUTTING", "fault", "DECEL").map((i) => i.id)).toEqual([
            "a",
        ]);
        expect(issuesForBranch(catalog, "PUTTING", "skill", "SPEED_CONTROL").map((i) => i.id)).toEqual(
            ["b"]
        );
        expect(issuesForBranch(catalog, "PUTTING", "fault", "SPEED_CONTROL")).toEqual([]);
    });

    it("hides an area with nothing startable in it", () => {
        // A dead end the intro has no story for: someone who has not signed up would
        // tap in, find nothing, and back out.
        expect(areasWithIssues(catalog).map((a) => a.key)).toEqual(["PUTTING"]);
    });
});
