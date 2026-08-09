import { parseInstructionSteps } from './parseInstructionSteps';

/**
 * This parser is shared by three screens, so a change here changes all three: the practice
 * how-to overlay (a drill's `task`, mid-block), the library sheet (the same `task`, before
 * the golfer commits) and the pre-drill brief (a drill's `success_signal`).
 *
 * The continuation guard was added for the brief and is therefore a REGRESSION RISK for the
 * other two. The first describe block below is that regression surface.
 */

describe('the behaviour the how-to overlay and library sheet already depended on', () => {
  it('splits an authored step list on its periods', () => {
    expect(
      parseInstructionSteps('Set up square to the target. Hit ten balls. Reset your stance.')
    ).toEqual(['Set up square to the target', 'Hit ten balls', 'Reset your stance']);
  });

  it('leaves a single flowing sentence as one item', () => {
    expect(parseInstructionSteps('Swing smoothly and hold the finish')).toEqual([
      'Swing smoothly and hold the finish',
    ]);
  });

  it('drops empty segments from trailing and doubled periods', () => {
    expect(parseInstructionSteps('Set up. Hit ten balls..')).toEqual(['Set up', 'Hit ten balls']);
  });

  it('returns nothing for nothing', () => {
    expect(parseInstructionSteps(null)).toEqual([]);
    expect(parseInstructionSteps(undefined)).toEqual([]);
    expect(parseInstructionSteps('')).toEqual([]);
    expect(parseInstructionSteps('   ')).toEqual([]);
  });

  it('keeps a short step that is genuinely its own step', () => {
    // The guard is NOT a length test, which is what makes this pass: "Reset" is short but
    // capitalised, so it stands alone. A length-based rule would have folded it upward.
    expect(parseInstructionSteps('Set up square. Reset. Repeat ten times.')).toEqual([
      'Set up square',
      'Reset',
      'Repeat ten times',
    ]);
  });
});

describe('the abbreviation guard', () => {
  it('keeps a trailing abbreviation with its sentence', () => {
    // Was: ['Land it roughly 30 to 100 yds', 'out'] — a dangling word as its own step.
    expect(parseInstructionSteps('Land it roughly 30 to 100 yds. out.')).toEqual([
      'Land it roughly 30 to 100 yds. out',
    ]);
  });

  it('keeps a leading abbreviation with what follows it', () => {
    // Was: ['Finish within 10 ft', 'from the hole'] — half a sentence, then the rest.
    // Note the short fragment here is the FIRST piece, which is why "merge anything short
    // into the previous item" merges the wrong way.
    expect(parseInstructionSteps('Finish within 10 ft. from the hole.')).toEqual([
      'Finish within 10 ft. from the hole',
    ]);
  });

  it('joins a continuation in the middle of a real step list', () => {
    expect(
      parseInstructionSteps('Set up square. Land within 10 ft. from the hole. Reset.')
    ).toEqual(['Set up square', 'Land within 10 ft. from the hole', 'Reset']);
  });

  it('treats a digit as the start of a new item, not a continuation', () => {
    expect(parseInstructionSteps('Pick a target. 10 balls to each one.')).toEqual([
      'Pick a target',
      '10 balls to each one',
    ]);
  });
});

describe('success_signal, the case the brief renders', () => {
  it('splits three simultaneous conditions into three items', () => {
    // Verbatim from a real ladder drill. These are a SET -- all true at once -- which is
    // why the brief marks them rather than numbering them.
    expect(
      parseInstructionSteps(
        'Each ball carries close to its target distance. Swing length scales with the distance. The distances ladder cleanly rather than blur together.'
      )
    ).toEqual([
      'Each ball carries close to its target distance',
      'Swing length scales with the distance',
      'The distances ladder cleanly rather than blur together',
    ]);
  });

  it('does not strand a measurement in a success condition', () => {
    expect(
      parseInstructionSteps('Every putt finishes within 3 ft. of the hole. Pace stays even.')
    ).toEqual(['Every putt finishes within 3 ft. of the hole', 'Pace stays even']);
  });
});
