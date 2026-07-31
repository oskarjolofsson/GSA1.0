/**
 * @vitest-environment jsdom
 *
 * Required per file: the suite default is node, and Vitest 4 has no
 * environmentMatchGlobs. Every component test needs this docblock.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import IssueForm from "./issue-form";
import type { Taxonomy, UpdateIssueBody } from "@/lib/content/types";

const taxonomy: Taxonomy = {
  areas: ["FULL_SWING", "PITCHING"],
  misses: ["SLICE", "FAT"],
  goals: ["STRAIGHTER", "CONTACT"],
  kinds: ["fault", "skill"],
  default_area: "FULL_SWING",
  default_kind: "fault",
};

const noDrills = vi.fn(async () => ({ ok: true, matches: [] }));

function setup(compose = vi.fn(async () => ({ ok: true }))) {
  const onSaved = vi.fn();
  render(
    <IssueForm
      taxonomy={taxonomy}
      composeAction={compose}
      searchDrillsAction={noDrills}
      onCancel={vi.fn()}
      onSaved={onSaved}
    />,
  );
  return { compose, onSaved };
}

const titleBox = () => screen.getByPlaceholderText("Early extension");
const saveBtn = () => screen.getByRole("button", { name: /save issue/i });

describe("IssueForm", () => {
  it("blocks saving until the issue has a title", async () => {
    setup();
    expect(saveBtn()).toBeDisabled();

    await userEvent.type(titleBox(), "Early extension");

    expect(saveBtn()).toBeEnabled();
  });

  it("fires the compose action exactly once on a double-click", async () => {
    // The endpoint has no idempotency key, so a second click would create a second
    // catalog issue. The button disables while pending.
    let release: (v: { ok: boolean }) => void = () => {};
    const compose = vi.fn(
      () => new Promise<{ ok: boolean }>((resolve) => (release = resolve)),
    );
    setup(compose);

    await userEvent.type(titleBox(), "Casting");
    await userEvent.dblClick(saveBtn());

    expect(compose).toHaveBeenCalledTimes(1);
    release({ ok: true });
  });

  it("renders a rejected tag value next to the picker rather than as a toast", async () => {
    const detail = "Unknown miss 'BANANA'. Allowed values: SLICE, FAT.";
    const compose = vi.fn(async () => ({ ok: false, reason: detail }));
    setup(compose);

    await userEvent.type(titleBox(), "Bad tag");
    await userEvent.click(saveBtn());

    const message = await screen.findByText(detail);
    // The tag fieldset is the nearest landmark; the message has to sit inside it so
    // the admin sees which control the complaint is about.
    expect(message.closest("fieldset")).not.toBeNull();
  });

  it("shows a general failure at the top, away from the pickers", async () => {
    const compose = vi.fn(async () => ({
      ok: false,
      reason: "Couldn't save. The API may be unreachable — try again.",
    }));
    setup(compose);

    await userEvent.type(titleBox(), "Offline");
    await userEvent.click(saveBtn());

    const message = await screen.findByText(/API may be unreachable/i);
    expect(message.closest("fieldset")).toBeNull();
  });

  it("warns that an issue with no drills has nothing to practise", async () => {
    setup();
    await userEvent.type(titleBox(), "Untagged");

    expect(screen.getByText(/nothing to practise/i)).toBeInTheDocument();
  });

  it("warns about an untagged issue once drills exist", async () => {
    setup();
    await userEvent.type(titleBox(), "Untagged");
    await userEvent.click(screen.getByRole("button", { name: /add a new drill/i }));

    for (const placeholder of ["Title", "Task", "Success signal", "Fault indicator"]) {
      await userEvent.type(screen.getByPlaceholderText(placeholder), "x");
    }

    expect(screen.getByText(/won't surface/i)).toBeInTheDocument();
  });

  it("refuses to save while a drill row is half-written", async () => {
    setup();
    await userEvent.type(titleBox(), "Partial drill");
    await userEvent.click(screen.getByRole("button", { name: /add a new drill/i }));
    await userEvent.type(screen.getByPlaceholderText("Title"), "only a title");

    expect(saveBtn()).toBeDisabled();
    expect(screen.getByText(/finish or remove/i)).toBeInTheDocument();
  });

  it("toggles a tag on and off", async () => {
    setup();
    const slice = screen.getByRole("button", { name: "Slice" });

    expect(slice).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(slice);
    expect(slice).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(slice);
    expect(slice).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onSaved after a successful compose", async () => {
    const { onSaved } = setup();
    await userEvent.type(titleBox(), "Good one");
    await userEvent.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("previews the coach wording and warns when plain-language copy is missing", async () => {
    setup();
    await userEvent.type(titleBox(), "Over the top");

    expect(screen.getByText(/no plain-language copy set/i)).toBeInTheDocument();
    // The preview falls back to the technical title, which is the thing the warning
    // is about — a golfer would read exactly this.
    expect(screen.getAllByText("Over the top").length).toBeGreaterThan(0);
  });

  it("shows the plain-language copy in the preview once written", async () => {
    setup();
    await userEvent.type(titleBox(), "Over the top");
    await userEvent.type(
      screen.getByPlaceholderText("You come over the top"),
      "You swing across it",
    );

    expect(screen.getByText("You swing across it")).toBeInTheDocument();
  });
});

/** Declared with its arguments so mock.calls can be inspected — a zero-arg mock
 * types its call tuple as empty. */
type UpdateFn = (
  id: string,
  body: UpdateIssueBody,
) => Promise<{ ok: boolean; reason?: string }>;

describe("IssueForm in edit mode", () => {
  const issue = {
    id: "issue-1",
    title: "Early extension",
    description: "hips move toward the ball",
    area: "PITCHING",
    kind: "fault",
    source: "catalog",
    user_id: null,
    layman_title: "You stand up out of it",
    layman_desc: "Your hips drift toward the ball.",
    current_motion: "steep",
    expected_motion: null,
    swing_effect: null,
    shot_outcome: null,
    created_at: "2026-01-01T00:00:00Z",
    goals: ["CONTACT"],
    misses: ["FAT"],
    drills: [],
    drill_count: 2,
  } as never;

  function setupEdit(
    update = vi.fn<UpdateFn>(async () => ({ ok: true })),
    override: Record<string, unknown> = {},
  ) {
    const compose = vi.fn(async () => ({ ok: true }));
    render(
      <IssueForm
        taxonomy={taxonomy}
        issue={{ ...(issue as object), ...override } as never}
        updateAction={update}
        composeAction={compose}
        searchDrillsAction={noDrills}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    return { update, compose };
  }

  const saveChanges = () => screen.getByRole("button", { name: /save changes/i });

  it("prefills every field from the issue", () => {
    setupEdit();

    expect(screen.getByPlaceholderText("Early extension")).toHaveValue(
      "Early extension",
    );
    expect(screen.getByPlaceholderText("You come over the top")).toHaveValue(
      "You stand up out of it",
    );
    expect(screen.getByRole("button", { name: "Fat" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Contact" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("saves through updateAction, never composeAction", async () => {
    const { update, compose } = setupEdit();

    await userEvent.click(saveChanges());

    expect(update).toHaveBeenCalledTimes(1);
    expect(compose).not.toHaveBeenCalled();
    expect(update.mock.calls[0][0]).toBe("issue-1");
  });

  it("sends \"\" for a field the admin cleared, so it actually clears", async () => {
    // null would read as "field absent" on PATCH and leave the old copy in place.
    const { update } = setupEdit();

    await userEvent.clear(screen.getByPlaceholderText("You come over the top"));
    await userEvent.click(saveChanges());

    expect(update.mock.calls[0][1].layman_title).toBe("");
  });

  it("does not warn about missing drills when the issue has them", () => {
    // drill_count is 2 and the form holds none, because drills are attached from
    // the detail view.
    setupEdit();

    expect(screen.queryByText(/nothing to practise/i)).not.toBeInTheDocument();
  });

  it("still warns about missing drills when the issue genuinely has none", () => {
    setupEdit(vi.fn<UpdateFn>(async () => ({ ok: true })), { drill_count: 0 });

    expect(screen.getByText(/nothing to practise/i)).toBeInTheDocument();
  });

  it("hides the drill section, which the detail view owns", () => {
    setupEdit();

    expect(
      screen.queryByRole("button", { name: /add a new drill/i }),
    ).not.toBeInTheDocument();
  });

  it("warns before rewriting a golfer's own issue", () => {
    setupEdit(vi.fn<UpdateFn>(async () => ({ ok: true })), {
      source: "custom",
      user_id: "golfer-42",
    });

    expect(screen.getByText(/written by a golfer/i)).toBeInTheDocument();
    expect(screen.getByText("golfer-42")).toBeInTheDocument();
  });

  it("shows no owner banner for a catalog issue", () => {
    setupEdit();

    expect(screen.queryByText(/written by a golfer/i)).not.toBeInTheDocument();
  });

  it("fires the update exactly once on a double-click", async () => {
    let release: (v: { ok: boolean }) => void = () => {};
    const update = vi.fn<UpdateFn>(
      () => new Promise<{ ok: boolean }>((resolve) => (release = resolve)),
    );
    setupEdit(update);

    await userEvent.dblClick(saveChanges());

    expect(update).toHaveBeenCalledTimes(1);
    release({ ok: true });
  });
});
