import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

/**
 * When to ask a happy golfer for an App Store review.
 *
 * Two independent counters, each firing once at its threshold: the 5th finished
 * practice session, and the 2nd `dialed` block result. Best-effort throughout — a
 * storage failure costs a missed prompt, never a crash.
 */

const SESSION_FINISHED_KEY = 'reviewPrompt.sessionsFinished.v1';
const SESSION_FINISHED_THRESHOLD = 5;

const POSITIVE_RATING_KEY = 'reviewPrompt.positiveRatings.v1';
const POSITIVE_RATING_THRESHOLD = 2;

async function bumpAndMaybePrompt(key: string, threshold: number): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(key);
    const count = (Number(stored) || 0) + 1;
    await AsyncStorage.setItem(key, String(count));

    if (count === threshold && (await StoreReview.hasAction())) {
      await StoreReview.requestReview();
    }
  } catch {
    // A missed prompt is the whole cost of a storage failure here.
  }
}

export async function notePracticeSessionFinished(): Promise<void> {
  await bumpAndMaybePrompt(SESSION_FINISHED_KEY, SESSION_FINISHED_THRESHOLD);
}

export async function notePositiveBlockRating(): Promise<void> {
  await bumpAndMaybePrompt(POSITIVE_RATING_KEY, POSITIVE_RATING_THRESHOLD);
}
