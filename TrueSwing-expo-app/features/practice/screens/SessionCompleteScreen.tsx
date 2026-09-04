import { ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import ProgramProgress from '../components/ProgramProgress';
import SessionScoreList from '../components/SessionScoreList';
import type { SessionOutcome } from '../hooks/usePracticeRunner';
import { usePracticeResultsState } from '../hooks/usePracticeResultsState';
import type { PracticeSession } from '../types/Session';

/**
 * The end of a range visit, and the way into the next one. Four states:
 *
 *   advanced + next step   -> what moved, what's next, Continue
 *   advanced + no next     -> the focus is finished; Continue would have nowhere to go
 *   advance-failed         -> practice saved, plan did NOT move, retry offered
 *   no-program             -> a session with nothing to advance
 *
 * Shows what moved, not just the total, and is honest when nothing moved -- most sessions do
 * not (ADR-0020). The delta does not name a drill: `StepAdvance` returns the count only, so
 * naming one would be a guess dressed as a fact.
 */

type Props = {
  session: PracticeSession;
  /** The focus being practised, in the golfer's words. */
  focusTitle: string;
  outcome: SessionOutcome;
  /** Starts the next session. Resolves false when it could not (premium, area full). */
  onContinue: () => Promise<boolean>;
  onExit: () => void;
};

export default function SessionCompleteScreen({
  session,
  focusTitle,
  outcome,
  onContinue,
  onExit,
}: Props) {
  const results = usePracticeResultsState({ sessionId: session.id });
  const [continuing, setContinuing] = useState(false);

  const worked = results.drillRuns.filter((run) => !run.skipped).length;

  // In-flight guard: a second tap would start a second session.
  const handleContinue = async () => {
    if (continuing) return;
    setContinuing(true);
    const started = await onContinue();
    if (!started) setContinuing(false);
  };

  const advanced = outcome.kind === 'advanced' ? outcome : null;
  const nextStep = advanced?.advance.next_step ?? null;
  const focusComplete = Boolean(advanced && !nextStep);

  return (
    <View className="flex-1 bg-ink">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-16 flex-grow justify-center"
        showsVerticalScrollIndicator={false}>
        {focusComplete ? (
          <>
            <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-gold">
              Focus complete
            </Text>
            <Text className="mt-3 font-display-bold text-[28px] leading-[34px] text-sand">
              {focusTitle}
            </Text>
            <View className="mt-7">
              <ProgramProgress
                title="Every drill filled in"
                grooved={advanced!.advance.grooved_count}
                total={advanced!.advance.total_drills}
                groovedBefore={advanced!.groovedBefore}
              />
            </View>
            <Text className="mt-7 text-[13px] leading-[19px] text-sand-dim">
              You&apos;ve worked every drill in this focus. Time to take it to the course.
            </Text>
          </>
        ) : (
          <>
            <View className="flex-row items-center gap-3">
              <CheckCircle2 size={22} color="#E4C892" />
              <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-sand-dim">
                Session complete
              </Text>
            </View>

            <Text className="mt-3 font-display-bold text-[28px] leading-[34px] text-sand">
              {worked === 1 ? 'You worked one drill' : `You worked ${worked} drills`}
            </Text>
            <Text className="mt-2 text-[13px] leading-[19px] text-sand-dim">
              That&apos;s another square earned.
            </Text>

            {advanced ? (
              <View className="mt-8 border-t border-sand/[.13] pt-6">
                <ProgramProgress
                  title={focusTitle}
                  grooved={advanced.advance.grooved_count}
                  total={advanced.advance.total_drills}
                  groovedBefore={advanced.groovedBefore}
                />
                <ProgressDelta
                  before={advanced.groovedBefore}
                  after={advanced.advance.grooved_count}
                  total={advanced.advance.total_drills}
                />
              </View>
            ) : null}

            {outcome.kind === 'advance-failed' ? (
              <View className="mt-8 border-l-2 border-danger pl-3.5">
                <Text className="font-display text-[18px] leading-[26px] text-sand">
                  Couldn&apos;t update your plan
                </Text>
                <Text className="mt-1.5 text-[13px] leading-[19px] text-sand-dim">
                  Your practice is saved. We just couldn&apos;t move your plan forward.
                </Text>
                <Pressable
                  onPress={outcome.retry}
                  accessibilityRole="button"
                  className="mt-3.5 self-start border-b border-sand/[.35] pb-1"
                  style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text className="font-sans-semibold text-[15px] text-sand">Try again</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Renders nothing for a pure feel session, and nothing when the fetch
                            failed -- the section degrades alone rather than blocking Continue. */}
            <SessionScoreList runs={results.drillRuns} />

            {nextStep ? <UpNext drills={nextStep.drills} /> : null}
          </>
        )}

        <View className="mt-9">
          {nextStep ? (
            <Pressable
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityState={{ disabled: continuing }}
              disabled={continuing}
              className={`h-20 flex-row items-center justify-center gap-3 rounded-3xl ${
                continuing ? 'bg-gold/30' : 'bg-gold active:bg-gold-deep'
              }`}>
              <Text className="font-sans-bold text-xl text-ink">
                {continuing ? 'Starting…' : 'Continue practice'}
              </Text>
              {continuing ? null : <ArrowRight size={22} color="#0A0F1A" />}
            </Pressable>
          ) : focusComplete ? (
            <Pressable
              onPress={onExit}
              accessibilityRole="button"
              className="h-20 items-center justify-center rounded-3xl bg-gold active:bg-gold-deep">
              <Text className="font-sans-bold text-xl text-ink">Back to my plan</Text>
            </Pressable>
          ) : null}

          {nextStep || !focusComplete ? (
            <Pressable
              onPress={onExit}
              accessibilityRole="button"
              className="mt-3.5 items-center justify-center"
              style={{ minHeight: 44 }}>
              <Text className="font-sans-semibold text-[15px] text-sand-dim">
                End practice session
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * The one line that makes the fraction explicable.
 *
 * Moved: name the change. Didn't move: name the rule, because that is the session where the
 * golfer is most likely to wonder whether any of this is working.
 */
function ProgressDelta({ before, after, total }: { before: number; after: number; total: number }) {
  const delta = after - before;
  const remaining = Math.max(0, total - after);

  if (delta > 0) {
    return (
      <View
        className="mt-4 flex-row items-center gap-2.5"
        accessibilityLabel={`${delta} more ${delta === 1 ? 'drill' : 'drills'} filled in, ${after} of ${total}`}>
        <View className="rounded bg-gold px-1.5 py-0.5">
          <Text className="font-sans-bold text-[11px] text-ink">{`+${delta}`}</Text>
        </View>
        <Text className="flex-1 text-[13px] leading-[19px] text-sand">
          {delta === 1 ? 'One drill filled in.' : `${delta} drills filled in.`}
        </Text>
      </View>
    );
  }

  return (
    <Text className="mt-4 text-[13px] leading-[19px] text-sand-dim">
      {`A drill fills in after three Very good blocks. ${remaining} to go.`}
    </Text>
  );
}

/** The next session: at most two drills, and they ARE done in order, so they are numbered. */
function UpNext({ drills }: { drills: { id: string; title: string }[] }) {
  if (drills.length === 0) return null;

  return (
    <View className="mt-9">
      <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-gold">
        Up next
      </Text>
      <View className="mt-3">
        {drills.map((drill, index) => (
          <View key={drill.id}>
            <View className="h-[1px] bg-sand/[.07]" />
            <View className="flex-row items-baseline gap-3 py-3.5">
              <Text className="w-3.5 font-display text-[13px] text-gold">{index + 1}</Text>
              <Text className="flex-1 font-display text-[19px] leading-[26px] text-sand">
                {drill.title}
              </Text>
            </View>
          </View>
        ))}
        <View className="h-[1px] bg-sand/[.07]" />
      </View>
    </View>
  );
}
