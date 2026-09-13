import { render } from '@testing-library/react-native';

import ProgressRail, { type RailStep } from './ProgressRail';

const steps: RailStep[] = [
  { key: 'upload', title: 'Uploaded' },
  { key: 'analyse', title: 'Analysing' },
  { key: 'program', title: 'Building your program' },
];

describe('ProgressRail', () => {
  it('marks the active step\'s title distinctly (bold) and gives it the spinner, not a plain node', async () => {
    const view = await render(<ProgressRail steps={steps} activeIndex={1} />);

    const activeTitle = view.getByTestId('progress-rail-active-title');
    expect(activeTitle).toHaveTextContent('Analysing');
    // Only one step is marked active at a time.
    expect(view.queryAllByTestId('progress-rail-active-title')).toHaveLength(1);

    // The active step gets the spinner -- not the filled "done" dot or the
    // plain hollow "pending" ring a static/frozen state would show instead.
    expect(view.getByTestId('progress-rail-active-spinner')).toBeTruthy();
  });

  it('gives earlier steps the filled done node and later steps the plain pending ring', async () => {
    const view = await render(<ProgressRail steps={steps} activeIndex={1} />);

    // Step 0 (before the active index) is done: filled dot, not a spinner.
    expect(view.getAllByTestId('progress-rail-node-done')).toHaveLength(1);
    // Step 2 (after the active index) is pending: hollow ring, not a spinner.
    expect(view.getAllByTestId('progress-rail-node-pending')).toHaveLength(1);
    // Exactly one spinner on screen, for the active step alone.
    expect(view.getAllByTestId('progress-rail-active-spinner')).toHaveLength(1);
  });

  it('moves the bold title and the spinner when the active step changes', async () => {
    const view = await render(<ProgressRail steps={steps} activeIndex={0} />);
    expect(view.getByTestId('progress-rail-active-title')).toHaveTextContent('Uploaded');

    await view.rerender(<ProgressRail steps={steps} activeIndex={2} />);
    expect(view.getByTestId('progress-rail-active-title')).toHaveTextContent(
      'Building your program'
    );
    // Both earlier steps are now done, none of them the spinner.
    expect(view.getAllByTestId('progress-rail-node-done')).toHaveLength(2);
    expect(view.getAllByTestId('progress-rail-active-spinner')).toHaveLength(1);
  });
});
