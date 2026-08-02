/**
 * @vitest-environment jsdom
 *
 * Required per file: the suite default is node, and Vitest 4 has no
 * environmentMatchGlobs. Every component test needs this docblock.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import TaxonomyEditor from "./taxonomy-editor";
import type { AdminTaxonomyTerm, TaxonomyKind } from "@/lib/content/types";

const term = (over: Partial<AdminTaxonomyTerm> & { key: string }): AdminTaxonomyTerm => ({
  label: over.key,
  golfer_label: over.key,
  blurb: null,
  sort: 0,
  active: true,
  area: null,
  usage_count: 0,
  ...over,
});

const terms = (): Record<TaxonomyKind, AdminTaxonomyTerm[]> => ({
  areas: [term({ key: "FULL_SWING" }), term({ key: "PUTTING" })],
  goals: [term({ key: "CONTACT" })],
  misses: [
    term({
      key: "SLICE",
      area: "FULL_SWING",
      label: "Slice",
      golfer_label: "I slice it",
      blurb: "Curves hard right",
      usage_count: 12,
    }),
  ],
});

const renderEditor = (over: Partial<Record<string, unknown>> = {}) => {
  const props = {
    terms: terms(),
    areas: ["FULL_SWING", "PUTTING"],
    createAction: vi.fn().mockResolvedValue({ ok: true }),
    updateAction: vi.fn().mockResolvedValue({ ok: true }),
    deleteAction: vi.fn().mockResolvedValue({ ok: true }),
    ...over,
  } as Parameters<typeof TaxonomyEditor>[0];
  render(<TaxonomyEditor {...props} />);
  return props;
};

describe("delete guard", () => {
  /**
   * The FK is ON DELETE RESTRICT, so this delete would 409. Disabling the button is the
   * courtesy on top of that guarantee — the count beside it is what makes the rule legible.
   */
  it("won't let a miss twelve issues use be deleted", async () => {
    const props = renderEditor();
    const row = screen.getByText("I slice it").closest("li")!;

    expect(within(row).getByText("12 issues")).toBeTruthy();
    await userEvent.click(within(row).getByRole("button", { name: "Delete" }));
    expect(props.deleteAction).not.toHaveBeenCalled();
  });

  it("deletes an unused term", async () => {
    const withUnused = terms();
    withUnused.misses.push(
      term({
        key: "CHUNK",
        area: "PUTTING",
        label: "Chunk",
        golfer_label: "I chunk it",
        usage_count: 0,
      }),
    );
    const props = renderEditor({ terms: withUnused });

    const row = screen.getByText("I chunk it").closest("li")!;
    await userEvent.click(within(row).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(props.deleteAction).toHaveBeenCalledWith("misses", "CHUNK"));
  });
});

describe("misses group under their area", () => {
  it("shows an area with no misses as a gap rather than omitting it", () => {
    // PUTTING has nothing seeded yet. Omitting the heading would hide exactly the gap
    // this editor exists to close, so it renders with an empty state instead.
    renderEditor();
    expect(screen.getByRole("heading", { name: "PUTTING" })).toBeTruthy();
    expect(screen.getByText(/Nothing here yet/)).toBeTruthy();
  });
});

describe("editing an existing term", () => {
  it("locks the key and never sends it", async () => {
    const props = renderEditor();
    const row = screen.getByText("I slice it").closest("li")!;
    await userEvent.click(within(row).getByRole("button", { name: "Edit" }));

    const keyInput = screen.getByDisplayValue("SLICE") as HTMLInputElement;
    expect(keyInput.disabled).toBe(true);
    expect(screen.getByText(/Keys can't change/)).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(props.updateAction).toHaveBeenCalled());
    const [, key, body] = (props.updateAction as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(key).toBe("SLICE");
    expect(body).not.toHaveProperty("key");
  });
});

describe("adding a term", () => {
  it("blocks the save until the required wording is there, and says why", async () => {
    const props = renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Add a miss" }));

    const save = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(screen.getByText(/needs a key/)).toBeTruthy();

    await userEvent.type(screen.getByPlaceholderText("LEAVES_SHORT"), "leaves short");
    await userEvent.type(screen.getByPlaceholderText("Leaves short"), "Leaves short");
    await userEvent.type(
      screen.getByPlaceholderText("I leave them short"),
      "I leave them short",
    );

    // The admin sees the key they'll actually get before committing to it.
    expect(screen.getByText("LEAVES_SHORT")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(props.createAction).toHaveBeenCalled());
    const [kind, body] = (props.createAction as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(kind).toBe("misses");
    expect(body).toMatchObject({ key: "LEAVES_SHORT", area: "FULL_SWING" });
  });

  it("surfaces the server's reason when the key is taken", async () => {
    const props = renderEditor({
      createAction: vi.fn().mockResolvedValue({ ok: false, reason: "That key is taken." }),
    });
    await userEvent.click(screen.getByRole("button", { name: "Add a miss" }));
    await userEvent.type(screen.getByPlaceholderText("LEAVES_SHORT"), "SLICE");
    await userEvent.type(screen.getByPlaceholderText("Leaves short"), "Slice");
    await userEvent.type(screen.getByPlaceholderText("I leave them short"), "I slice it");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByText("That key is taken.")).toBeTruthy());
    expect(props.createAction).toHaveBeenCalled();
  });
});
