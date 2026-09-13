import { render } from "@testing-library/react-native";

import AnalysisHeaderOverlay from "./AnalysisHeaderOverlay";

jest.mock("react-native-safe-area-context", () =>
    jest.requireActual("react-native-safe-area-context/jest/mock").default
);

describe("AnalysisHeaderOverlay", () => {
    it("does not show a NEW badge by default", async () => {
        const view = await render(<AnalysisHeaderOverlay dateLabel="1 Jan 2026" onDeletePress={jest.fn()} />);
        expect(view.queryByText("NEW")).toBeNull();
    });

    it("shows a NEW badge when isNew is true", async () => {
        const view = await render(<AnalysisHeaderOverlay dateLabel="1 Jan 2026" onDeletePress={jest.fn()} isNew />);
        expect(view.getByText("NEW")).toBeTruthy();
    });

    it("hides the NEW badge when isNew is false", async () => {
        const view = await render(
            <AnalysisHeaderOverlay dateLabel="1 Jan 2026" onDeletePress={jest.fn()} isNew={false} />
        );
        expect(view.queryByText("NEW")).toBeNull();
    });
});
