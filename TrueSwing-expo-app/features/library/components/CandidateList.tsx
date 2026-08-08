import { View, Text } from "react-native";

import type { CatalogIssue } from "features/issues/services/issueAuthoringService";
import IssueRow from "./IssueRow";
import StaggerRow from "./StaggerRow";

type Props = {
    candidates: CatalogIssue[];
    emptyText: string;
    onOpen: (issue: CatalogIssue) => void;
};

/**
 * The leaf: startable focus points, whichever branch the golfer arrived from.
 *
 * Rows only. The detail lives in `IssueSheet` -- expanding in place capped the reading
 * column and buried whatever came next.
 */
export default function CandidateList({ candidates, emptyText, onOpen }: Props) {
    if (candidates.length === 0) {
        return <Text className="mt-7 text-[13px] leading-[21px] text-sand-dim">{emptyText}</Text>;
    }
    return (
        <View className="mt-7">
            {candidates.map((issue, index) => (
                <StaggerRow key={issue.id} index={index}>
                    <IssueRow issue={issue} onOpen={() => onOpen(issue)} />
                </StaggerRow>
            ))}
        </View>
    );
}
