import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AnalysisResultsReview from './AnalysisResultsReview';
import useAnalysisIssueDetails from '../hooks/useAnalysisIssueDetails';
import useVideoURL from '../hooks/useVideoURL';
import analysisService from '../services/analysisService';
import type { AnalysisIssue } from '../types';

jest.mock('../hooks/useAnalysisIssueDetails');
jest.mock('../hooks/useVideoURL');
jest.mock('../services/analysisService', () => ({
  __esModule: true,
  default: {
    getAnalysisById: jest.fn().mockResolvedValue(null),
    dismissAnalysisIssue: jest.fn().mockResolvedValue(undefined),
  },
}));
// Sidesteps expo-video's native module -- video content isn't what these tests assert.
jest.mock('./InlineSwingVideo', () => () => null);

const mockUseAnalysisIssueDetails = useAnalysisIssueDetails as jest.Mock;
const mockUseVideoURL = useVideoURL as jest.Mock;
const mockDismiss = analysisService.dismissAnalysisIssue as jest.Mock;

const issue = (over: Partial<AnalysisIssue> = {}): AnalysisIssue => ({
  analysis_issue_id: 'ai-1',
  analysis_id: 'analysis-1',
  issue_id: 'issue-1',
  confidence: 0.9,
  created_at: '2026-01-01T00:00:00Z',
  ...over,
});

type TestIssueDetails = {
  title: string;
  description: string;
  area: string;
  missLabels: string[];
  drills: { id: string; title: string }[];
};

const details = (over: Partial<TestIssueDetails> = {}): TestIssueDetails => ({
  title: 'Overswing',
  description: 'Past parallel.',
  area: 'full_swing',
  missLabels: ['Slicing it'],
  drills: [{ id: 'd1', title: 'Wall drill' }],
  ...over,
});

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

function renderScreen(props: Parameters<typeof AnalysisResultsReview>[0]) {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AnalysisResultsReview {...props} />
    </SafeAreaProvider>
  );
}

describe('AnalysisResultsReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVideoURL.mockReturnValue(null);
    (analysisService.getAnalysisById as jest.Mock).mockResolvedValue(null);
    mockDismiss.mockResolvedValue(undefined);
  });

  it('shows the empty state and Continue works when there are no issues', async () => {
    mockUseAnalysisIssueDetails.mockReturnValue({ detailsByIssueId: {}, loading: false, error: null });
    const onNext = jest.fn();

    const view = await renderScreen({ issues: [], analysisId: 'analysis-1', onNext, onBack: jest.fn() });
    expect(view.getByText('No issues found for this analysis.')).toBeTruthy();

    await fireEvent.press(view.getByText('Continue'));
    expect(onNext).toHaveBeenCalledWith(null);
    expect(mockDismiss).not.toHaveBeenCalled();
  });

  it('renders the active card: title, confidence, and miss tags', async () => {
    const issues = [issue()];
    mockUseAnalysisIssueDetails.mockReturnValue({
      detailsByIssueId: { 'issue-1': details() },
      loading: false,
      error: null,
    });

    const view = await renderScreen({ issues, analysisId: 'analysis-1', onNext: jest.fn(), onBack: jest.fn() });
    expect(view.getByText('Overswing')).toBeTruthy();
    expect(view.getByText('90% confidence')).toBeTruthy();
    expect(view.getByText('Slicing it')).toBeTruthy();
  });

  it('Reject does not touch the backend -- nothing is sent until Continue', async () => {
    const issues = [issue()];
    mockUseAnalysisIssueDetails.mockReturnValue({
      detailsByIssueId: { 'issue-1': details() },
      loading: false,
      error: null,
    });

    const view = await renderScreen({ issues, analysisId: 'analysis-1', onNext: jest.fn(), onBack: jest.fn() });
    await fireEvent.press(view.getByText('Reject'));
    expect(mockDismiss).not.toHaveBeenCalled();
    expect(view.getByText("You're all set")).toBeTruthy();
  });

  it('Continue commits exactly the rejected issues, then advances', async () => {
    const issues = [issue(), issue({ analysis_issue_id: 'ai-2', issue_id: 'issue-2' })];
    mockUseAnalysisIssueDetails.mockReturnValue({
      detailsByIssueId: {
        'issue-1': details({ area: 'full_swing' }),
        'issue-2': details({ title: 'Casting', area: 'short_game' }),
      },
      loading: false,
      error: null,
    });
    const onNext = jest.fn();

    const view = await renderScreen({ issues, analysisId: 'analysis-1', onNext, onBack: jest.fn() });

    // Reject card 1 (Overswing), keep card 2 (Casting).
    await fireEvent.press(view.getByText('Reject'));
    await fireEvent.press(view.getByText('Keep'));

    expect(view.getByText("You're set")).toBeTruthy();
    expect(mockDismiss).not.toHaveBeenCalled();

    await fireEvent.press(view.getByText('Continue'));
    await waitFor(() => expect(mockDismiss).toHaveBeenCalledTimes(1));
    expect(mockDismiss).toHaveBeenCalledWith('ai-1');
    expect(onNext).toHaveBeenCalledWith('short_game');
  });

  it('Back to review lets a rejected card be changed back to Keep before Continue', async () => {
    const issues = [issue()];
    mockUseAnalysisIssueDetails.mockReturnValue({
      detailsByIssueId: { 'issue-1': details() },
      loading: false,
      error: null,
    });
    const onNext = jest.fn();

    const view = await renderScreen({ issues, analysisId: 'analysis-1', onNext, onBack: jest.fn() });

    await fireEvent.press(view.getByText('Reject'));
    expect(view.getByText("You're all set")).toBeTruthy();

    await fireEvent.press(view.getByText('Back to review'));
    expect(view.getByText('Overswing')).toBeTruthy();
    // Marks which choice was already made -- not a fresh, undecided card.
    expect(view.getByText('Rejected')).toBeTruthy();

    await fireEvent.press(view.getByText('Keep'));
    expect(view.getByText("You're set")).toBeTruthy();

    await fireEvent.press(view.getByText('Continue'));
    expect(mockDismiss).not.toHaveBeenCalled();
    expect(onNext).toHaveBeenCalledWith('full_swing');
  });

  it('stays on the summary with a retryable error when every rejection fails to save', async () => {
    mockDismiss.mockRejectedValue(new Error('network'));
    const issues = [issue()];
    mockUseAnalysisIssueDetails.mockReturnValue({
      detailsByIssueId: { 'issue-1': details() },
      loading: false,
      error: null,
    });
    const onNext = jest.fn();

    const view = await renderScreen({ issues, analysisId: 'analysis-1', onNext, onBack: jest.fn() });
    await fireEvent.press(view.getByText('Reject'));
    await fireEvent.press(view.getByText('Continue'));

    await waitFor(() => expect(view.getByText(/Couldn't save your rejections/)).toBeTruthy());
    expect(onNext).not.toHaveBeenCalled();
  });
});
