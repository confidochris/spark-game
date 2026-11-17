// ============================================================================
//  levels.js: every level in the game, drawn as text
// ----------------------------------------------------------------------------
//  Each level's "map" is a list of text rows. Every character is one square:
//
//    #   wall
//    .   floor with a blue data dot (worth points)
//   ' '  (a space) floor with no dot
//    S   where Spark starts (exactly one)
//    E   the keyhole (the exit). It unlocks once every discovery is found.
//    K   a discovery (lime clue key). You must collect them all.
//    $   a gold gift. Brightens Spark's light. Collect all 3 for a star.
//    N   a Static blob ("noisy data") starts here and wanders the maze.
//    C   a Closing Door. It opens and shuts on a timer.
//    1-9 a gate that opens once you hold that many discoveries.
//
//  Rules: every row must be the same length, and the outside edge should be
//  walls. Run `npm run check-levels` to test that every level can be finished.
//
//  Other settings per level:
//    par    target time in seconds (finish faster for the time star)
//    light  Spark's glow: start / max size and fadePerSecond (drain speed)
//    staticSpeed  how fast this level's Static moves (squares per second)
//    tip    one line shown when the level starts
//    story  the short chapter shown after you finish the level
// ============================================================================

export const LEVELS = [
  // --------------------------------------------------------------------------
  {
    id: 'seed',
    stage: 'SEED',
    name: 'A Promising Idea',
    par: 30,
    tip: 'Find the 2 discoveries hidden in the fog, then reach the keyhole.',
    light: { start: 160, max: 160, min: 160, fadePerSecond: 0 }, // level 1: no drain
    map: [
      '###########',
      '#S....#...#',
      '#.###.#.#.#',
      '#...#...#K#',
      '###.#####.#',
      '#$......#.#',
      '#.#####.#.#',
      '#.#K..#...#',
      '#.#.#.###.#',
      '#...#...#$#',
      '#.#####.#.#',
      '#$.....E#.#',
      '###########',
    ],
    story: {
      kicker: 'CHAPTER 1',
      title: 'A promising idea',
      text:
        'Every breakthrough starts as a question no one has answered yet. ' +
        'Foundation of Hope helps scientists test promising ideas while they are still new.',
    },
  },

  // --------------------------------------------------------------------------
  {
    id: 'pilot',
    stage: 'PILOT',
    name: 'The First Investment',
    par: 40,
    tip: 'Your light drains now! Grab gold gifts. Dodge the Static, time the door.',
    light: { fadePerSecond: 3.5 }, // about 35 s of light without pickups
    staticSpeed: 2.2, // slow: the first Static
    map: [
      '#############',
      '#S..#.....#$#',
      '###.#.###.#.#',
      '#...#.#K#...#',
      '#.###.#.###.#',
      '#.....#.....#',
      '#####.#####C#',
      '#$..#...#...#',
      '#.#.###.#.###',
      '#.#..N#.#...#',
      '#.###.#.###.#',
      '#K#.......#.#',
      '#.#.#####.#.#',
      '#...$...#K#E#',
      '#############',
    ],
    story: {
      kicker: 'CHAPTER 2',
      title: 'The first investment',
      text:
        'Gifts of every size, pooled together, can fund a seed grant: ' +
        'the first real chance for a researcher to test an idea.',
    },
  },

  // --------------------------------------------------------------------------
  {
    id: 'test',
    stage: 'TESTING',
    name: 'Putting It to the Test',
    par: 45,
    tip: 'More Static now, and faster. Each touch costs a heart.',
    light: { fadePerSecond: 4.0 }, // about 31 s
    staticSpeed: 3.0,
    map: [
      '#############',
      '#S....#....$#',
      '#.###.#.###.#',
      '#.#K#...#...#',
      '#.#.#####.#.#',
      '#...#..N..#.#',
      '###.#.###.#.#',
      '#.....#N....#',
      '#.###.#.#####',
      '#.#$..#.....#',
      '#.#####.###.#',
      '#...#...#K#.#',
      '###.#.###.#.#',
      '#K..#.N.....#',
      '#.#####.#.#.#',
      '#.......#$.E#',
      '#############',
    ],
    story: {
      kicker: 'CHAPTER 3',
      title: 'Putting it to the test',
      text:
        'Real research has noisy data and dead ends. Each one teaches something, ' +
        'and careful work keeps the light moving forward.',
    },
  },

  // --------------------------------------------------------------------------
  {
    id: 'discovery',
    stage: 'EVIDENCE',
    name: 'A New Discovery',
    par: 48,
    tip: 'Doors and Static together now. Time your dash, or take the long way.',
    light: { fadePerSecond: 4.3 }, // about 29 s
    staticSpeed: 3.3,
    map: [
      '###################',
      '#S.....#.....#...$#',
      '#.###.#.#.###.#.#.#',
      '#.#...#...#K..#.#.#',
      '#.#.#######.###.#.#',
      '#...#.....C.....#.#',
      '###.#.###.#####.#.#',
      '#K..#.#N#.....#...#',
      '#.###.#.#####.###.#',
      '#.....#...$.#..N..#',
      '#####C#.###.#.###C#',
      '#$....#.#K#...#...#',
      '#.###.#.#.#####.#.#',
      '#...#...#.......#E#',
      '###################',
    ],
    story: {
      kicker: 'CHAPTER 4',
      title: 'A new discovery',
      text:
        'Patterns begin to appear. Early findings turn a hunch into evidence, ' +
        'and evidence is what opens bigger doors.',
    },
  },

  // --------------------------------------------------------------------------
  {
    id: 'impact',
    stage: 'NIH FUNDING',
    name: 'Greater Impact',
    par: 72,
    tip: 'Numbered gates open when you hold that many discoveries.',
    light: { fadePerSecond: 4.6 }, // about 27 s
    staticSpeed: 3.6,
    map: [
      '#####################',
      '#S....#.......#....K#',
      '#.###.#.#####.#.###.#',
      '#.#...#...#.....#...#',
      '#.#.#####.#.#####.#.#',
      '#$#.......#...N.....#',
      '###########1#########',
      '#.....#.......#....$#',
      '#.###.#.#####.#.###.#',
      '#...#...#K..#.C...#.#',
      '#.#.#####.#.#.#.#.#.#',
      '#.#.N.....#...#.#...#',
      '#################2###',
      '#..N..#...$.#.......#',
      '#.###.#.###.#.#.###.#',
      '#K#...C...#...#N..#.#',
      '#.#.#######.###.#.###',
      '#...#.......#...#.3E#',
      '#####################',
    ],
    story: {
      kicker: 'CHAPTER 5',
      title: 'Greater impact',
      text:
        'A $38,711 seed grant from Foundation of Hope supporters helped a UNC researcher ' +
        'secure more than $1.2 million from the NIH: about 30 times what donors put in.',
    },
  },

  // --------------------------------------------------------------------------
  {
    id: 'next',
    stage: 'DISCOVERY',
    name: 'The Next Question',
    par: 50,
    tip: 'The keyhole waits in the center. Find all 4 discoveries to open the way.',
    light: { fadePerSecond: 5.0 }, // about 25 s
    staticSpeed: 3.9,
    map: [
      '###################',
      '#S....#.....#....K#',
      '#.###.#.###.#.###.#',
      '#.#.....#..N..#...#',
      '#.#.###.#.###.#.#.#',
      '#...#.N.....#...#.#',
      '###.#.#######.###.#',
      '#$..#.#.....#.#...#',
      '#.###.#.###.#.#.###',
      '#.....C.#E4.C.....#',
      '#.###.#.#####.#.#.#',
      '#K#...#.......#.#$#',
      '#.#.#.#########.#.#',
      '#...#...N...#...#.#',
      '###.#####.#.#.###.#',
      '#K..#.....#...#...#',
      '#.###.###.#####.#.#',
      '#$....#....N....#K#',
      '###################',
    ],
    story: {
      kicker: 'CHAPTER 6',
      title: 'The next question',
      text:
        'Every answer opens a new question. That is how understanding of mental illness grows: ' +
        'one discovery at a time, with a community lighting the way.',
    },
  },
];

// The story card shown on the final screen. These facts come from the
// Foundation of Hope 2026 Annual Fund page.
export const REAL_STORY = {
  title: 'The real story',
  text:
    'Hundreds of everyday gifts were pooled into one $38,711 seed grant for a UNC researcher. ' +
    'That early proof helped win more than $1.2 million from the NIH, about 30x what donors put in.',
  cta: 'Help fund the next breakthrough',
  note: '100% of your gift supports mental illness research.',
};
