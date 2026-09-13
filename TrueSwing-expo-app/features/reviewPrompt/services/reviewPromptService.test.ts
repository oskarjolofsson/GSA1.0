import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

import {
  notePositiveBlockRating,
  notePracticeSessionFinished,
} from './reviewPromptService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

jest.mock('expo-store-review', () => ({
  hasAction: jest.fn(),
  requestReview: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockHasAction = StoreReview.hasAction as jest.Mock;
const mockRequestReview = StoreReview.requestReview as jest.Mock;

describe('notePracticeSessionFinished', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetItem.mockResolvedValue(undefined);
    mockHasAction.mockResolvedValue(true);
    mockRequestReview.mockResolvedValue(undefined);
  });

  it('does not prompt before the 5th finished session', async () => {
    mockGetItem.mockResolvedValue('3');

    await notePracticeSessionFinished();

    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('prompts on exactly the 5th finished session', async () => {
    mockGetItem.mockResolvedValue('4');

    await notePracticeSessionFinished();

    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });

  it('does not prompt again on the 6th finished session', async () => {
    mockGetItem.mockResolvedValue('5');

    await notePracticeSessionFinished();

    expect(mockRequestReview).not.toHaveBeenCalled();
  });
});

describe('notePositiveBlockRating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetItem.mockResolvedValue(undefined);
    mockHasAction.mockResolvedValue(true);
    mockRequestReview.mockResolvedValue(undefined);
  });

  it('does not prompt on the 1st positive rating', async () => {
    mockGetItem.mockResolvedValue('0');

    await notePositiveBlockRating();

    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('prompts on exactly the 2nd positive rating', async () => {
    mockGetItem.mockResolvedValue('1');

    await notePositiveBlockRating();

    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });

  it('does not prompt again on the 3rd positive rating', async () => {
    mockGetItem.mockResolvedValue('2');

    await notePositiveBlockRating();

    expect(mockRequestReview).not.toHaveBeenCalled();
  });
});
