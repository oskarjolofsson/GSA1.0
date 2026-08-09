import React from "react";
import { View, Text, type LayoutChangeEvent } from "react-native";
import { MotiView } from "moti";
import { useReducedMotion } from "react-native-reanimated";
import { ACTIVITY_COLORS, TODAY_BORDER } from "features/home/utils/activityLevels";
import type { DayCell } from "features/home/utils/activityStats";
import { HOME_ANIM } from "features/home/animations";

type StreakPanelProps = {
    streakDays: number;
    /** 28 cells: two rows of fourteen, newest fortnight first. */
    month: DayCell[];
};

const COLUMNS = 14;
const GAP = 3;

/**
 * How consistent the golfer has been, as texture.
 *
 *   STREAK                    12 days
 *   □■□■▣■□ ■▣■□■■□     <- newest fortnight, today is the last cell
 *   □■■▣□■■ ■□■■■□▣
 *
 * DEMOTED ON PURPOSE, and this is a reversal worth knowing about. The streak was
 * the hero metric of this screen by design — the product's promise is adherence
 * ("stay consistent and you'll likely improve"), and the count was set at 48px to
 * say so. A usability test (2026-08-09) then found a golfer who could not work out
 * how to start a session: the streak count was the largest thing on the screen and
 * "Start session" was the smallest. A streak you cannot figure out how to add to is
 * worse than no streak, so the count drops to 14px and the grid carries the message
 * instead. Four weeks of squares argues consistency better than one number anyway.
 *
 * READ-ONLY. Every square used to open that day's sessions. At fourteen columns a
 * square is ~21px against DESIGN.md's non-negotiable 44px touch floor, and the 3px
 * gaps mean any hitSlop big enough to fix that would overlap its neighbours — a
 * golfer aiming at Tuesday would open Wednesday. Rather than keep an unreliable
 * target on an element that is deliberately receding, the grid became decoration:
 * `accessibilityElementsHidden` on the cells, one label on the group. `DayDetailModal`
 * lost its only entry point as a result, which is tracked in TODOS.md.
 *
 * THE SQUARE SIZE IS MEASURED, NOT A PERCENTAGE, and that is a bug fix rather than a
 * preference. `width: ${100/14}%` looks right and is not: 7.142857% of a 342px
 * content box is 24.43px, Yoga rounds each cell up to the pixel grid, and fourteen
 * rounded-up cells no longer fit inside 100% — so the row wrapped at twelve and the
 * "month" spilled onto three ragged rows. Measuring the container and flooring to a
 * whole pixel makes fourteen fit on any phone by construction.
 */
export default function StreakPanel({ streakDays, month }: StreakPanelProps) {
    const reduceMotion = useReducedMotion();
    const doneCount = month.filter((cell) => cell.done).length;

    // Measured once per width change. 0 until the first layout pass, which is the
    // one frame the cells stay unrendered — invisible in practice because they
    // fade in anyway.
    const [gridWidth, setGridWidth] = React.useState(0);
    const onLayout = React.useCallback((e: LayoutChangeEvent) => {
        setGridWidth(e.nativeEvent.layout.width);
    }, []);

    // Floor, so fourteen whole-pixel squares plus thirteen minimum gutters always
    // fit. The remainder (up to ~13px) would otherwise sit as slack at the end of
    // the row and leave the grid short of the rules above and below it, so the row
    // spreads it back into the gutters with `space-between` instead. Both rows hold
    // exactly fourteen (28 = 2 x 14), so they spread identically.
    const cell = gridWidth > 0 ? Math.floor((gridWidth - GAP * (COLUMNS - 1)) / COLUMNS) : 0;

    // Split into fortnights so each row is rendered explicitly. Derived rather than
    // assumed to be two rows: `MONTH_DAYS / COLUMNS` is the only thing that decides
    // how many there are, so widening the window cannot silently desync this.
    const rows = React.useMemo(() => {
        const out: DayCell[][] = [];
        for (let i = 0; i < month.length; i += COLUMNS) {
            out.push(month.slice(i, i + COLUMNS));
        }
        return out;
    }, [month]);

    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Current streak ${streakDays} ${
                streakDays === 1 ? "day" : "days"
            }. Practised ${doneCount} of the last ${month.length} days.`}
        >
            <View className="flex-row items-baseline justify-between">
                <Text className="font-sans-semibold text-[11px] uppercase tracking-[2.5px] text-sand-dim">
                    Streak
                </Text>
                <Text className="text-[13px] text-sand-dim">
                    <Text className="font-display text-[15px] text-sand">{streakDays}</Text>
                    {streakDays === 1 ? " day" : " days"}
                </Text>
            </View>

            {/* ONE EXPLICIT ROW PER FORTNIGHT, NOT flexWrap.
                Wrapping was the bug: Yoga decides how many children fit on a line
                from their widths alone, and `justify-content` spreads the leftover
                space only AFTER that decision. So fourteen 21px squares in a 345px
                box packed as fifteen or sixteen per line and spilled the rest onto
                the next. Two rows of exactly fourteen cannot wrap at all. */}
            <View
                onLayout={onLayout}
                className="mt-2.5"
                style={{ rowGap: GAP }}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            >
                {cell > 0
                    ? rows.map((fortnight, rowIndex) => (
                          <View key={rowIndex} className="flex-row justify-between">
                              {fortnight.map((day, i) => {
                                  const showDashed = day.isToday && !day.done;
                                  return (
                                      <MotiView
                                          key={day.date}
                                          from={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{
                                              type: "timing",
                                              duration: reduceMotion ? 0 : 240,
                                              delay: reduceMotion
                                                  ? 0
                                                  : (rowIndex * COLUMNS + i) *
                                                    HOME_ANIM.gridCellStep,
                                          }}
                                          style={[
                                              { width: cell, height: cell, borderRadius: 4 },
                                              showDashed
                                                  ? {
                                                        borderWidth: 1,
                                                        borderStyle: "dashed",
                                                        borderColor: TODAY_BORDER,
                                                        backgroundColor: "transparent",
                                                    }
                                                  : {
                                                        backgroundColor:
                                                            ACTIVITY_COLORS[day.level],
                                                    },
                                          ]}
                                      />
                                  );
                              })}
                          </View>
                      ))
                    : null}
            </View>

            {/* WHAT THE SQUARES ARE. Without this the grid is a pattern the golfer
                has to decode; DESIGN.md's 13px floor applies because this is prose
                to read, not an eyebrow label. "Four weeks" not "two": each ROW is a
                fortnight, so two rows is a month. */}
            <Text className="mt-3 text-[13px] leading-[18px] text-sand-dim">
                Each square is a day you practised, over the last four weeks.
            </Text>
        </View>
    );
}
