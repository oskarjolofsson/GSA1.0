import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, ChevronDown, ChevronRight } from "lucide-react-native";

import { parseInstructionSteps } from "features/shared/utils/parseInstructionSteps";

import type { CatalogIssue } from "features/issues/services/issueAuthoringService";

type Props = {
    /** The focus to show, or null when closed. */
    issue: CatalogIssue | null;
    /** The golfer-facing name of the area it sits under, for the eyebrow. */
    areaLabel: string;
    starting: boolean;
    /** A failed start, shown here rather than behind the sheet. */
    error?: string | null;
    onClose: () => void;
    onStart: () => void;
};

/**
 * One focus, opened from the library list.
 *
 * A sheet rather than an expanding row. The row version had to fit a description, a
 * drill list and a primary action inside a card inside a padded scroll view, which left
 * a 311pt reading column on a 393pt phone and pushed the next focus most of a screen
 * down. Here the content gets the full width, the action is pinned where a thumb
 * expects it, and everything else is dimmed out -- which is the actual point. Choosing
 * what to work on is the one decision this screen exists to support.
 *
 * Same RN Modal shape as `features/home/components/DayDetailModal` on purpose: scrim
 * tap to dismiss, `onRequestClose` for the Android back button, capped height so the
 * list stays visible behind it. No sheet library -- the app has one modal idiom and
 * this is it.
 */
export default function IssueSheet({ issue, areaLabel, starting, error, onClose, onStart }: Props) {
    const insets = useSafeAreaInsets();
    const drills = issue?.drills ?? [];
    // One drill open at a time. Keyed by id rather than index so it survives the list
    // changing, and reset per issue so a sheet never opens with someone else's drill
    // already expanded.
    const [openDrillId, setOpenDrillId] = useState<string | null>(null);

    // Collapse when the sheet switches focus. Without this, opening a second focus
    // whose drill happened to share an id would render it pre-expanded, and the
    // golfer would see a sheet that had already been used.
    useEffect(() => {
        setOpenDrillId(null);
    }, [issue?.id]);

    return (
        <Modal
            visible={issue !== null}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                {/* Scrim as an absolute SIBLING, not a parent. Wrapping the sheet in a
                    Pressable made the scroll unusable: the press responder competes with
                    the ScrollView's pan responder, so drags were swallowed before the
                    list ever saw them. As a sibling it still catches taps outside. */}
                <Pressable
                    className="absolute inset-0 bg-black/60"
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                />

                {/* `maxHeight` alone was not enough: with no flex direction the ScrollView
                    sized itself to its content, so its viewport equalled its content and
                    there was nothing to scroll -- the overflow was simply clipped by the
                    parent. Being an explicit column lets the ScrollView shrink below its
                    content height, which is what makes it scrollable. */}
                <View
                    accessibilityViewIsModal
                    className="rounded-t-[26px] border border-white/10 border-b-0 bg-ink-raised"
                    style={{ maxHeight: "88%", flexDirection: "column" }}
                >
                    {/* Grab handle: signals draggability by convention even though this
                        sheet dismisses by tap and back gesture rather than by drag. */}
                    <View className="items-center pt-3 pb-1">
                        <View className="h-1 w-9 rounded-full bg-sand/20" />
                    </View>

                    <View className="flex-row items-start px-5 pt-3">
                        <View className="flex-1 pr-3">
                            <Text className="text-[10px] uppercase tracking-[2.6px] text-gold">
                                {areaLabel}
                            </Text>
                            <Text className="mt-2 font-display-bold text-[23px] leading-[28px] text-sand">
                                {issue?.layman_title || issue?.title}
                            </Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            hitSlop={10}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink active:opacity-70"
                        >
                            <X size={17} color="#8A8676" />
                        </Pressable>
                    </View>

                    <ScrollView
                        className="mt-4"
                        // flexShrink is the half that actually enables scrolling: it lets
                        // this view become shorter than its content once the sheet hits
                        // its 88% cap. Without it the ScrollView keeps its full content
                        // height and the header and footer get pushed off screen instead.
                        style={{ flexShrink: 1 }}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {issue?.layman_desc || issue?.description ? (
                            <Text className="text-[14px] leading-[22px] text-sand-dim">
                                {issue?.layman_desc || issue?.description}
                            </Text>
                        ) : null}

                        {/* Name the list. Without this the drills read as more prose --
                            the golfer cannot tell where the explanation ends and the
                            work begins. The count sets expectations before they commit. */}
                        <View className="mt-7 flex-row items-baseline justify-between border-t border-white/10 pt-5">
                            <Text className="text-[10px] uppercase tracking-[2.6px] text-sand-dim">
                                What you&apos;ll practise
                            </Text>
                            <Text className="text-[12px] text-sand-dim">
                                {drills.length} {drills.length === 1 ? "drill" : "drills"}
                            </Text>
                        </View>

                        {drills.map((drill, index) => (
                            <DrillEntry
                                key={drill.id}
                                drill={drill}
                                open={openDrillId === drill.id}
                                isLast={index === drills.length - 1}
                                onToggle={() =>
                                    setOpenDrillId(openDrillId === drill.id ? null : drill.id)
                                }
                            />
                        ))}

                        {drills.length === 0 ? (
                            <Text className="mt-5 text-[13px] leading-[20px] text-sand-dim">
                                No drills written for this focus yet.
                            </Text>
                        ) : null}
                    </ScrollView>

                    {/* Pinned: the one decision this sheet exists for stays reachable no
                        matter how long the drill list runs. */}
                    <View
                        className="border-t border-white/10 px-5 pt-4"
                        style={{ paddingBottom: insets.bottom + 16 }}
                    >
                        {error ? (
                            <Text className="mb-3 text-[13px] leading-[19px] text-danger">{error}</Text>
                        ) : null}
                        <Pressable
                            onPress={onStart}
                            disabled={starting || drills.length === 0}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: starting || drills.length === 0 }}
                            className={`min-h-[52px] items-center justify-center rounded-2xl border ${
                                starting || drills.length === 0
                                    ? "border-white/[.13]"
                                    : "border-gold active:opacity-70"
                            }`}
                        >
                            <Text
                                className={`text-[14px] uppercase tracking-[1.6px] ${
                                    starting || drills.length === 0 ? "text-sand-dim" : "text-gold"
                                }`}
                            >
                                {starting ? "Starting…" : "Start this plan"}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

/**
 * One drill on the rail: title and chevron collapsed, numbered steps when open.
 *
 * Collapsed by default so a four-drill focus fits without scrolling. The golfer is
 * deciding whether to start a plan, not following instructions yet -- the detail is
 * available, not imposed.
 *
 * Steps come from the same `parseInstructionSteps` the practice overlay uses, so the
 * numbering a golfer reads here is the numbering they get mid-block.
 */
function DrillEntry({
    drill,
    open,
    isLast,
    onToggle,
}: {
    drill: CatalogIssue["drills"][number];
    open: boolean;
    isLast: boolean;
    onToggle: () => void;
}) {
    const steps = parseInstructionSteps(drill.task);

    return (
        <View className="flex-row">
            {/* The rail. One spine down the whole list with a node per drill, so the
                drills read as a sequence without any label having to say so. */}
            <View className="w-[9px] items-center">
                <View
                    className="absolute top-0 w-px bg-sand/10"
                    // A trailing line under the last node would point at nothing. Stop it
                    // at the node instead of running it to the bottom of the row.
                    style={isLast ? { height: 23 } : { bottom: 0 }}
                />
                <View
                    className={`z-10 mt-[19px] h-[7px] w-[7px] rounded-full border border-gold ${
                        open ? "bg-gold" : "bg-ink-raised"
                    }`}
                />
            </View>

            <View className="flex-1 pb-1 pl-3.5 pt-3.5">
                <Pressable
                    onPress={onToggle}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityHint={open ? "Hides the steps" : "Shows the steps"}
                    className="min-h-[30px] flex-row items-center active:opacity-70"
                >
                    <Text className="flex-1 pr-2 font-sans-medium text-[15px] leading-[20px] text-sand">
                        {drill.title}
                    </Text>
                    {open ? (
                        <ChevronDown size={15} color="#C5A059" />
                    ) : (
                        <ChevronRight size={15} color="#8A8676" />
                    )}
                </Pressable>

                {open
                    ? steps.map((step, index) => (
                          <View key={`${drill.id}-${index}`} className="mt-3 flex-row">
                              {/* Fraunces numerals: a coach writes steps numbered, and
                                  a numeral holds its place when a step wraps to three
                                  lines, where a dash would float loose. */}
                              <Text className="w-[15px] font-display text-[12px] leading-[20px] text-gold">
                                  {index + 1}
                              </Text>
                              <Text className="flex-1 text-[13px] leading-[20px] text-sand-dim">
                                  {step}
                              </Text>
                          </View>
                      ))
                    : null}

                {open && steps.length === 0 ? (
                    <Text className="mt-3 text-[13px] leading-[20px] text-sand-dim">
                        No instructions written for this drill yet.
                    </Text>
                ) : null}
            </View>
        </View>
    );
}
