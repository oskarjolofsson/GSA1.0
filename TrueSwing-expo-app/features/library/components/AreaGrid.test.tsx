/**
 * Note on style: `render` and `fireEvent` are awaited throughout, per
 * BlockRating.test.tsx -- React 19 renders concurrently and RNTL 14 returns
 * promises from both, so a synchronous call leaves the tree un-flushed.
 */
import { fireEvent, render } from "@testing-library/react-native";

import AreaGrid from "./AreaGrid";
import type { AreaStats } from "../hooks/useAreaStats";
import type { TaxonomyTerm } from "../services/taxonomyService";

const AREAS = [
    { key: "FULL_SWING", golfer_label: "Full swing", blurb: "Driver to wedge" },
    { key: "PUTTING", golfer_label: "Putting", blurb: "On the green" },
] as TaxonomyTerm[];

const stats = (over: Partial<AreaStats> = {}): AreaStats => ({
    programs: 0,
    days: new Array(17).fill(0),
    lastLabel: null,
    ...over,
});

describe("AreaGrid", () => {
    it("never renders area blurbs -- the landing is names plus your own history", async () => {
        const view = await render(<AreaGrid areas={AREAS} statsByArea={{}} onSelect={jest.fn()} />);
        expect(view.queryByText("Driver to wedge")).toBeNull();
        expect(view.getByText("Full swing")).toBeTruthy();
    });

    it("shows 'Not started yet' on every row for a brand-new account", async () => {
        const view = await render(<AreaGrid areas={AREAS} statsByArea={{}} onSelect={jest.fn()} />);
        expect(view.getAllByText("Not started yet")).toHaveLength(AREAS.length);
    });

    it("treats an area with history as started and shows its recency", async () => {
        const view = await render(
            <AreaGrid
                areas={AREAS}
                statsByArea={{ PUTTING: stats({ programs: 1, lastLabel: "yesterday" }) }}
                onSelect={jest.fn()}
            />
        );
        expect(view.getByText("yesterday")).toBeTruthy();
        expect(view.getAllByText("Not started yet")).toHaveLength(1); // Full swing only
    });

    it("counts an open program as started even with no sessions logged yet", async () => {
        const view = await render(
            <AreaGrid
                areas={AREAS}
                statsByArea={{ FULL_SWING: stats({ programs: 2 }) }}
                onSelect={jest.fn()}
            />
        );
        expect(view.getAllByText("Not started yet")).toHaveLength(1); // Putting only
    });

    it("says the row's state in words for screen readers, since the strip cannot", async () => {
        const view = await render(
            <AreaGrid
                areas={AREAS}
                statsByArea={{ PUTTING: stats({ programs: 2, lastLabel: "3w ago" }) }}
                onSelect={jest.fn()}
            />
        );
        expect(view.getByLabelText("Putting. 2 open programs. last practised 3w ago")).toBeTruthy();
        expect(view.getByLabelText("Full swing. Not started yet")).toBeTruthy();
    });

    it("renders from taxonomy alone when stats have not arrived", async () => {
        const view = await render(<AreaGrid areas={AREAS} statsByArea={{}} onSelect={jest.fn()} />);
        expect(view.getByText("Full swing")).toBeTruthy();
        expect(view.getByText("Putting")).toBeTruthy();
    });

    it("selects the area that was tapped", async () => {
        const onSelect = jest.fn();
        const view = await render(<AreaGrid areas={AREAS} statsByArea={{}} onSelect={onSelect} />);
        await fireEvent.press(view.getByText("Putting"));
        expect(onSelect).toHaveBeenCalledWith(AREAS[1]);
    });
});
