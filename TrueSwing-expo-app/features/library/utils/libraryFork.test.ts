import type { CatalogIssue } from "features/issues/services/issueAuthoringService";
import type { TaxonomyMiss, TaxonomyTerm } from "features/library/services/taxonomyService";
import {
    buildAreaFork,
    issuesForGoal,
    issuesForMiss,
    searchIssues,
} from "features/library/utils/libraryFork";

function issue(over: Partial<CatalogIssue> & { id: string }): CatalogIssue {
    return {
        title: "Issue",
        description: null,
        area: "PUTTING",
        kind: "fault",
        source: "catalog",
        layman_title: null,
        layman_desc: null,
        goals: [],
        misses: [],
        drills: [],
        ...over,
    };
}

const misses: TaxonomyMiss[] = [
    { key: "SHORT", label: "Short", golfer_label: "I leave it short", blurb: null, sort: 0, area: "PUTTING" },
    { key: "PUSH", label: "Push", golfer_label: "I push it", blurb: null, sort: 1, area: "PUTTING" },
];
const goals: TaxonomyTerm[] = [
    { key: "SPEED", label: "Speed", golfer_label: "Better speed", blurb: null, sort: 0 },
    { key: "DISTANCE", label: "Distance", golfer_label: "More distance", blurb: null, sort: 1 },
];

describe("buildAreaFork", () => {
    it("files fault issues under misses and skill issues under goals", () => {
        const issues = [
            issue({ id: "fault-1", kind: "fault", misses: ["SHORT"], goals: ["SPEED"] }),
            issue({ id: "skill-1", kind: "skill", goals: ["SPEED"], misses: ["PUSH"] }),
        ];

        const fork = buildAreaFork("PUTTING", issues, misses, goals);

        // The skill issue's PUSH tag must not surface a miss branch, and the
        // fault issue's SPEED tag must not surface a goal branch: the split is
        // `kind`, never the presence of a tag.
        expect(fork.misses.map((m) => m.key)).toEqual(["SHORT"]);
        expect(fork.goals.map((g) => g.key)).toEqual(["SPEED"]);
    });

    it("offers only branches that have content", () => {
        const fork = buildAreaFork("PUTTING", [], misses, goals);

        expect(fork.misses).toEqual([]);
        expect(fork.goals).toEqual([]);
    });

    it("ignores issues from other areas", () => {
        const issues = [issue({ id: "a", area: "BUNKER", misses: ["SHORT"] })];

        expect(buildAreaFork("PUTTING", issues, misses, goals).misses).toEqual([]);
    });

    it("treats an unknown kind as a fault", () => {
        const issues = [issue({ id: "a", kind: "something-new", misses: ["PUSH"] })];

        expect(buildAreaFork("PUTTING", issues, misses, goals).misses.map((m) => m.key)).toEqual(["PUSH"]);
    });
});

describe("branch candidates", () => {
    const issues = [
        issue({ id: "fault-1", kind: "fault", misses: ["SHORT"] }),
        issue({ id: "skill-1", kind: "skill", goals: ["SPEED"], misses: ["SHORT"] }),
        issue({ id: "fault-2", kind: "fault", area: "BUNKER", misses: ["SHORT"] }),
    ];

    it("lists only fault issues under a miss, scoped to the area", () => {
        expect(issuesForMiss(issues, "PUTTING", "SHORT").map((i) => i.id)).toEqual(["fault-1"]);
    });

    it("lists only skill issues under a goal", () => {
        expect(issuesForGoal(issues, "PUTTING", "SPEED").map((i) => i.id)).toEqual(["skill-1"]);
    });
});

describe("searchIssues", () => {
    const issues = [
        issue({ id: "a", title: "Sand escape", area: "BUNKER" }),
        issue({ id: "b", title: "Lag putting", area: "PUTTING" }),
    ];
    const labels = (i: CatalogIssue) => (i.area === "BUNKER" ? "Bunker greenside sand" : "Putting");

    it("matches area and miss labels, not just issue text", () => {
        expect(searchIssues(issues, "bunker", labels).map((i) => i.id)).toEqual(["a"]);
    });

    it("still matches the issue's own text", () => {
        expect(searchIssues(issues, "lag", labels).map((i) => i.id)).toEqual(["b"]);
    });

    it("returns nothing for a blank query", () => {
        expect(searchIssues(issues, "   ", labels)).toEqual([]);
    });
});
