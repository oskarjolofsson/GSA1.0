/**
 * @vitest-environment jsdom
 *
 * Required per file: the suite default is node, and Vitest 4 has no
 * environmentMatchGlobs. Every component test needs this docblock.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import DrillsExplorer from "./drills-explorer";
import type {
  AdminDrill,
  AdminDrillPage,
  CreateDrillBody,
  Taxonomy,
  UpdateDrillBody,
} from "@/lib/content/types";

const taxonomy = (): Taxonomy =>
  ({
    areas: [
      { key: "FULL_SWING", label: "Full swing", golfer_label: "Full swing", blurb: null },
      { key: "PUTTING", label: "Putting", golfer_label: "Putting", blurb: null },
    ],
    goals: [],
    misses: [],
    default_area: "FULL_SWING",
  }) as unknown as Taxonomy;

const drill = (over: Partial<AdminDrill> = {}): AdminDrill =>
  ({
    id: "d1",
    title: "Ten six-footers",
    task: "t",
    success_signal: "s",
    fault_indicator: "f",
    user_id: null,
    created_at: null,
    area: null,
    metric: null,
    issues: [],
    issue_count: 0,
    ...over,
  }) as AdminDrill;

const page = (items: AdminDrill[]): AdminDrillPage =>
  ({ items, total: items.length, limit: 20, offset: 0 }) as AdminDrillPage;

const renderExplorer = (items: AdminDrill[], over: Record<string, unknown> = {}) => {
  const actions = {
    searchAction: vi.fn(async (_q: string) => ({ ok: true, matches: [] as AdminDrill[] })),
    createAction: vi.fn(async (_body: CreateDrillBody) => ({ ok: true })),
    updateAction: vi.fn(async (_id: string, _body: UpdateDrillBody) => ({ ok: true })),
    deleteAction: vi.fn(async () => ({ ok: true })),
    impactAction: vi.fn(async () => null),
  };
  render(
    <DrillsExplorer
      page={page(items)}
      pageInfo={{ page: 1, offset: 0, limit: 20, pageCount: 1, hasPrev: false, hasNext: false }}
      taxonomy={taxonomy()}
      {...actions}
      {...over}
    />,
  );
  return actions;
};

describe("authoring a scored drill", () => {
  it("sends area and metric on create", async () => {
    // Without an authoring path every drill stays feel-only and the counting UI in the
    // golfer app never renders at all.
    const user = userEvent.setup();
    const { createAction } = renderExplorer([]);

    await user.click(screen.getByRole("button", { name: "New drill" }));
    for (const label of ["Title", "Task", "Success signal", "Fault indicator"]) {
      await user.type(screen.getByLabelText(label), "x");
    }
    await user.selectOptions(screen.getByLabelText("Area"), "PUTTING");
    await user.selectOptions(screen.getByLabelText("Scoring"), "make_rate");
    await user.click(screen.getByRole("button", { name: "Save drill" }));

    await waitFor(() => expect(createAction).toHaveBeenCalled());
    expect(createAction.mock.calls[0][0]).toMatchObject({
      area: "PUTTING",
      metric: { type: "make_rate", reps: 10, grade_at: { dialed: 0.8, ok: 0.5 } },
    });
  });

  it("keeps the metric inputs hidden until a type is chosen", async () => {
    const user = userEvent.setup();
    renderExplorer([]);

    await user.click(screen.getByRole("button", { name: "New drill" }));
    expect(screen.queryByLabelText("Reps")).toBeNull();

    await user.selectOptions(screen.getByLabelText("Scoring"), "make_rate");
    expect(screen.getByLabelText("Reps")).toBeTruthy();
  });

  it("offers unit and ceiling for proximity, not reps alone", async () => {
    const user = userEvent.setup();
    renderExplorer([]);

    await user.click(screen.getByRole("button", { name: "New drill" }));
    await user.selectOptions(screen.getByLabelText("Scoring"), "proximity");

    expect(screen.getByLabelText("Unit")).toBeTruthy();
    expect(screen.getByLabelText("Ceiling")).toBeTruthy();
  });

  it("sends null for a drill left feel-only and unscoped", async () => {
    const user = userEvent.setup();
    const { createAction } = renderExplorer([]);

    await user.click(screen.getByRole("button", { name: "New drill" }));
    for (const label of ["Title", "Task", "Success signal", "Fault indicator"]) {
      await user.type(screen.getByLabelText(label), "x");
    }
    await user.click(screen.getByRole("button", { name: "Save drill" }));

    await waitFor(() => expect(createAction).toHaveBeenCalled());
    expect(createAction.mock.calls[0][0]).toMatchObject({ area: null, metric: null });
  });

  it("blocks the save and says why when a threshold is a count, not a proportion", async () => {
    const user = userEvent.setup();
    const { createAction } = renderExplorer([]);

    await user.click(screen.getByRole("button", { name: "New drill" }));
    for (const label of ["Title", "Task", "Success signal", "Fault indicator"]) {
      await user.type(screen.getByLabelText(label), "x");
    }
    await user.selectOptions(screen.getByLabelText("Scoring"), "make_rate");
    await user.clear(screen.getByLabelText("Dialed at"));
    await user.type(screen.getByLabelText("Dialed at"), "8");

    expect(
      screen.getByText("Dialed is a proportion between 0 and 1 (0.8 means 8 out of 10)."),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Save drill" }));
    expect(createAction).not.toHaveBeenCalled();
  });

  it("translates the proportions into the drill's own units", async () => {
    // grade_at is the field an admin gets wrong. 0.8 is not 8 out of 10 until you say so.
    const user = userEvent.setup();
    renderExplorer([]);

    await user.click(screen.getByRole("button", { name: "New drill" }));
    await user.selectOptions(screen.getByLabelText("Scoring"), "make_rate");

    expect(screen.getByText(/Out of 10: 8 or more is dialed/)).toBeTruthy();
  });
});

describe("editing an existing drill", () => {
  it("loads the stored metric into the form", async () => {
    const user = userEvent.setup();
    renderExplorer([
      drill({ area: "PUTTING", metric: { type: "make_rate", reps: 20 } as never }),
    ]);

    await user.click(screen.getByRole("button", { name: /Ten six-footers/ }));

    expect((screen.getByLabelText("Area") as HTMLSelectElement).value).toBe("PUTTING");
    expect((screen.getByLabelText("Reps") as HTMLInputElement).value).toBe("20");
  });

  it("always sends area and metric, so a scored drill can go back to feel-only", async () => {
    const user = userEvent.setup();
    const { updateAction } = renderExplorer([
      drill({ area: "PUTTING", metric: { type: "make_rate", reps: 10 } as never }),
    ]);

    await user.click(screen.getByRole("button", { name: /Ten six-footers/ }));
    await user.selectOptions(screen.getByLabelText("Scoring"), "");
    await user.selectOptions(screen.getByLabelText("Area"), "");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateAction).toHaveBeenCalled());
    expect(updateAction.mock.calls[0][1]).toMatchObject({ area: null, metric: null });
  });

  it("shows on the list which drills are scored", () => {
    // Otherwise finding the four putting drills that carry a metric means opening
    // every row in the catalog.
    renderExplorer([
      drill({ area: "PUTTING", metric: { type: "make_rate", reps: 10 } as never }),
    ]);

    expect(screen.getByText("PUTTING · make_rate")).toBeTruthy();
  });
});
