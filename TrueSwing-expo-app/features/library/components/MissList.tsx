import { View, Text, Pressable } from "react-native";
import { ChevronRight, Camera } from "lucide-react-native";

import type { CatalogIssue } from "features/issues/services/issueAuthoringService";
import { missLabel, type MissKey } from "../constants/Misses";

type Props = {
    /** Ball-flight misses present under the chosen goal (fault issues). */
    misses: string[];
    /** Non-fault skill focuses under the chosen goal (e.g. "I just want speed"). */
    skillFocuses: CatalogIssue[];
    onSelectMiss: (miss: MissKey) => void;
    onSelectSkill: (issue: CatalogIssue) => void;
    onFilmSwing?: () => void;
};

/** "Which sounds like you?" — narrow a goal to a miss (or a non-fault skill focus),
 *  with a quiet hand-off to the AI path for golfers who can't self-identify. */
export default function MissList({ misses, skillFocuses, onSelectMiss, onSelectSkill, onFilmSwing }: Props) {
    return (
        <View>
            <Text className="mb-4 text-xl font-bold text-white">Which sounds like you?</Text>

            {misses.map((miss) => (
                <Pressable
                    key={miss}
                    onPress={() => onSelectMiss(miss as MissKey)}
                    className="mb-3 flex-row items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-4 active:opacity-80"
                >
                    <Text className="flex-1 text-base font-semibold text-white">{missLabel(miss)}</Text>
                    <ChevronRight size={18} color="#94a3b8" />
                </Pressable>
            ))}

            {skillFocuses.map((issue) => (
                <Pressable
                    key={issue.id}
                    onPress={() => onSelectSkill(issue)}
                    className="mb-3 flex-row items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-4 active:opacity-80"
                >
                    <Text className="flex-1 text-base font-semibold text-white">
                        {issue.layman_title || issue.title}
                    </Text>
                    <ChevronRight size={18} color="#94a3b8" />
                </Pressable>
            ))}

            {misses.length === 0 && skillFocuses.length === 0 ? (
                <Text className="mb-3 leading-6 text-slate-500">Nothing here yet for this goal.</Text>
            ) : null}

            {onFilmSwing ? (
                <Pressable
                    onPress={onFilmSwing}
                    className="mt-2 flex-row items-center rounded-2xl border border-dashed border-white/15 px-5 py-4 active:opacity-70"
                >
                    <Camera size={18} color="#64748b" />
                    <Text className="ml-3 flex-1 text-sm text-slate-400">Not sure? Film your swing and let the AI find it</Text>
                    <ChevronRight size={16} color="#64748b" />
                </Pressable>
            ) : null}
        </View>
    );
}
