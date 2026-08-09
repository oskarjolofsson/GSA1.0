import React from 'react';
import { View } from 'react-native';

import ProgramRow from 'features/home/components/ProgramRow';
import AreaEmptyCard from 'features/home/components/AreaEmptyCard';
import HomeEmptyBody from 'features/home/components/HomeEmptyBody';
import type { ProgramSummary } from 'features/programs/types';
import type { TaxonomyTerm } from 'features/library/services/taxonomyService';

type Props = {
  /** False only when the golfer has no programs AND no issues anywhere. */
  hasAnything: boolean;
  area: TaxonomyTerm | null;
  programs: ProgramSummary[];
  hasStartable: boolean;
  startingIssueId: string | null;
  onStartProgram: (issueId: string | null) => void;
  onOpenInfo: (issueId: string | null) => void;
  /** Opens the library. Carries the area key when there is one, so "Find bunker
   *  work" lands on bunkers rather than the five-area grid. */
  onBrowse: (areaKey?: string) => void;
};

/** Vertical air between two programs. No rule: they are peers of the same kind,
 *  and a line here would read as a boundary between different kinds of thing. */
const PROGRAM_GAP = 34;

/**
 * What sits under the area tabs, which is one of four things:
 *
 *   nothing anywhere       -> the first-run copy
 *   programs in this area  -> one ProgramRow each, separated by air
 *   no programs, but this  -> the same "choose a focus" invitation, top aligned,
 *     area has suggestions     with StartableList rendering directly beneath it
 *   neither                -> the invitation, centred, and nothing else on screen
 *
 * THE LAST TWO USED TO BE ONE BRANCH THAT RENDERED NOTHING. An area with
 * suggestions but no programs returned `null` and let StartableList speak for
 * itself, on the reasoning that "nothing here" above two startable things is a
 * contradiction. The 2026-08-09 usability test showed the opposite problem: with no
 * heading at all, a golfer had nothing telling her those rows were the thing to
 * pick. The headline is the same in both states because it is true in both — the
 * difference is only whether there is a list under it, which is also why the
 * centred layout is off in that case.
 *
 * Split out of HomeScreen because that file was past the 200-line cap in
 * features/CLAUDE.md, and because this branching is the part most likely to be
 * read on its own when a state renders wrong.
 */
export default function HomeAreaBody({
  hasAnything,
  area,
  programs,
  hasStartable,
  startingIssueId,
  onStartProgram,
  onOpenInfo,
  onBrowse,
}: Props) {
  // Nothing anywhere, so there is no area to scope to: the library opens on its
  // landing grid, which is the right answer for a golfer with no history.
  if (!hasAnything) {
    return <HomeEmptyBody onStart={() => onBrowse()} />;
  }

  if (programs.length > 0) {
    return (
      <>
        {programs.map((program, index) => (
          <View key={program.id} style={index === 0 ? undefined : { marginTop: PROGRAM_GAP }}>
            <ProgramRow
              program={program}
              starting={startingIssueId !== null && startingIssueId === program.issue_id}
              onStart={() => onStartProgram(program.issue_id)}
              onOpenInfo={() => onOpenInfo(program.issue_id)}
            />
          </View>
        ))}
      </>
    );
  }

  // Nothing open here, but there is diagnosed work waiting. Same invitation,
  // top aligned: the suggestions render immediately below and are exactly the
  // focuses the headline is telling the golfer to choose.
  if (hasStartable) {
    return <AreaEmptyCard area={area} onBrowse={() => onBrowse(area?.key)} compact />;
  }

  return <AreaEmptyCard area={area} onBrowse={() => onBrowse(area?.key)} />;
}
