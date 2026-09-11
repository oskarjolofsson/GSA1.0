import { fetchPublic } from "lib/apiClient";

import {
    areasWithIssues,
    getOnboardingCatalog,
    issuesForArea,
    type IntroIssue,
    type OnboardingCatalog,
} from "features/intro/services/introCatalogService";

jest.mock("lib/apiClient", () => ({
    __esModule: true,
    fetchPublic: jest.fn(),
}));

const mockFetchPublic = fetchPublic as jest.Mock;

function issue(id: string, area: string): IntroIssue {
    return {
        id,
        title: id,
        description: null,
        area,
        kind: "fault",
        source: "catalog",
        goals: [],
        misses: [],
        drills: [],
    };
}

const catalog: OnboardingCatalog = {
    areas: [
        { key: "PUTTING", label: "Putting", golfer_label: "Putting", blurb: "On the green", sort: 10 },
        { key: "BUNKER", label: "Bunker", golfer_label: "Bunker", blurb: null, sort: 20 },
    ],
    issues: [issue("a", "PUTTING"), issue("b", "PUTTING")],
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

    it("hides an area with nothing startable in it", () => {
        // A dead end the intro has no story for: someone who has not signed up would
        // tap in, find nothing, and back out.
        expect(areasWithIssues(catalog).map((a) => a.key)).toEqual(["PUTTING"]);
    });
});
