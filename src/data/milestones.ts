export type Area = 'motor' | 'language' | 'cognitive' | 'social';

export const AREAS: Area[] = ['motor', 'language', 'cognitive', 'social'];

export const AREA_LABELS: Record<Area, string> = {
  motor: 'Movement',
  language: 'Language',
  cognitive: 'Thinking',
  social: 'Social & feelings',
};

export interface Milestone {
  id: string;
  ageMonths: number;
  area: Area;
  text: string;
}

export const MILESTONE_SOURCE =
  'Adapted from the CDC "Learn the Signs. Act Early." milestone checklists (2022). ' +
  'Each list shows what most children (75%) do by that age.';

export const CHECKPOINT_MONTHS = [2, 4, 6, 9, 12, 15, 18, 24];

const raw: [number, Area, string, string][] = [
  // 2 months
  [2, 'social', 'calms', 'Calms down when spoken to or picked up'],
  [2, 'social', 'face', 'Looks at your face'],
  [2, 'social', 'happy', 'Seems happy to see you when you walk up'],
  [2, 'social', 'smile', 'Smiles when you talk to or smile at them'],
  [2, 'language', 'sounds', 'Makes sounds other than crying'],
  [2, 'language', 'loud', 'Reacts to loud sounds'],
  [2, 'cognitive', 'watch', 'Watches you as you move'],
  [2, 'cognitive', 'toy', 'Looks at a toy for several seconds'],
  [2, 'motor', 'head', 'Holds head up when on tummy'],
  [2, 'motor', 'limbs', 'Moves both arms and both legs'],
  [2, 'motor', 'hands', 'Opens hands briefly'],
  // 4 months
  [4, 'social', 'smile', 'Smiles on their own to get your attention'],
  [4, 'social', 'chuckle', 'Chuckles when you try to make them laugh'],
  [4, 'social', 'attention', 'Looks at you, moves or makes sounds to get or keep your attention'],
  [4, 'language', 'coo', 'Makes cooing sounds like "oooo" and "aahh"'],
  [4, 'language', 'back', 'Makes sounds back when you talk'],
  [4, 'language', 'turn', 'Turns head towards the sound of your voice'],
  [4, 'cognitive', 'mouth', 'Opens mouth when hungry and sees breast or bottle'],
  [4, 'cognitive', 'hands', 'Looks at their hands with interest'],
  [4, 'motor', 'steady', 'Holds head steady without support when held'],
  [4, 'motor', 'hold', 'Holds a toy when you put it in their hand'],
  [4, 'motor', 'swing', 'Uses an arm to swing at toys'],
  [4, 'motor', 'hand-mouth', 'Brings hands to mouth'],
  [4, 'motor', 'elbows', 'Pushes up onto elbows or forearms when on tummy'],
  // 6 months
  [6, 'social', 'familiar', 'Knows familiar people'],
  [6, 'social', 'mirror', 'Likes to look at themselves in a mirror'],
  [6, 'social', 'laugh', 'Laughs'],
  [6, 'language', 'turns', 'Takes turns making sounds with you'],
  [6, 'language', 'raspberry', 'Blows "raspberries"'],
  [6, 'language', 'squeal', 'Makes squealing noises'],
  [6, 'cognitive', 'explore', 'Puts things in their mouth to explore them'],
  [6, 'cognitive', 'reach', 'Reaches to grab a toy they want'],
  [6, 'cognitive', 'lips', 'Closes lips to show they don\'t want more food'],
  [6, 'motor', 'roll', 'Rolls from tummy to back'],
  [6, 'motor', 'straight-arms', 'Pushes up with straight arms when on tummy'],
  [6, 'motor', 'lean', 'Leans on hands to support themselves when sitting'],
  // 9 months
  [9, 'social', 'strangers', 'Is shy, clingy or fearful around strangers'],
  [9, 'social', 'expressions', 'Shows several facial expressions (happy, sad, angry, surprised)'],
  [9, 'social', 'name', 'Looks when you call their name'],
  [9, 'social', 'leave', 'Reacts when you leave (looks, reaches for you or cries)'],
  [9, 'social', 'peekaboo', 'Smiles or laughs when you play peek-a-boo'],
  [9, 'language', 'babble', 'Makes lots of different sounds like "mamamama" and "babababa"'],
  [9, 'language', 'arms-up', 'Lifts arms up to be picked up'],
  [9, 'cognitive', 'dropped', 'Looks for objects when dropped out of sight'],
  [9, 'cognitive', 'bang', 'Bangs two things together'],
  [9, 'motor', 'sit-up', 'Gets to a sitting position by themselves'],
  [9, 'motor', 'transfer', 'Moves things from one hand to the other'],
  [9, 'motor', 'rake', 'Uses fingers to "rake" food towards themselves'],
  [9, 'motor', 'sit', 'Sits without support'],
  // 12 months
  [12, 'social', 'games', 'Plays games with you, like pat-a-cake'],
  [12, 'language', 'wave', 'Waves "bye-bye"'],
  [12, 'language', 'mama', 'Calls a parent "mama", "dada" or another special name'],
  [12, 'language', 'no', 'Understands "no" (pauses or stops when you say it)'],
  [12, 'cognitive', 'container', 'Puts something in a container, like a block in a cup'],
  [12, 'cognitive', 'hidden', 'Looks for things they see you hide, like a toy under a blanket'],
  [12, 'motor', 'pull-stand', 'Pulls up to stand'],
  [12, 'motor', 'cruise', 'Walks while holding on to furniture'],
  [12, 'motor', 'cup', 'Drinks from an open cup while you hold it'],
  [12, 'motor', 'pincer', 'Picks things up between thumb and pointer finger'],
  // 15 months
  [15, 'social', 'copies', 'Copies other children while playing'],
  [15, 'social', 'shows', 'Shows you an object they like'],
  [15, 'social', 'claps', 'Claps when excited'],
  [15, 'social', 'hugs-toy', 'Hugs a stuffed toy or doll'],
  [15, 'social', 'affection', 'Shows you affection (hugs, cuddles or kisses)'],
  [15, 'language', 'words', 'Tries to say one or two words besides "mama" or "dada"'],
  [15, 'language', 'looks-named', 'Looks at a familiar object when you name it'],
  [15, 'language', 'gesture-directions', 'Follows directions given with a gesture and words'],
  [15, 'language', 'points-ask', 'Points to ask for something or to get help'],
  [15, 'cognitive', 'right-way', 'Tries to use things the right way, like a phone, cup or book'],
  [15, 'cognitive', 'stacks', 'Stacks at least two small objects, like blocks'],
  [15, 'motor', 'steps', 'Takes a few steps on their own'],
  [15, 'motor', 'finger-feed', 'Uses fingers to feed themselves some food'],
  // 18 months
  [18, 'social', 'checks', 'Moves away from you but looks to make sure you are close by'],
  [18, 'social', 'points-show', 'Points to show you something interesting'],
  [18, 'social', 'wash', 'Puts hands out for you to wash them'],
  [18, 'social', 'book', 'Looks at a few pages in a book with you'],
  [18, 'social', 'dressing', 'Helps you dress them (pushes arm through a sleeve, lifts a foot)'],
  [18, 'language', 'three-words', 'Tries to say three or more words besides "mama" or "dada"'],
  [18, 'language', 'one-step', 'Follows one-step directions without gestures'],
  [18, 'cognitive', 'chores', 'Copies you doing chores, like sweeping'],
  [18, 'cognitive', 'simple-play', 'Plays with toys in a simple way, like pushing a toy car'],
  [18, 'motor', 'walks', 'Walks without holding on to anyone or anything'],
  [18, 'motor', 'scribbles', 'Scribbles'],
  [18, 'motor', 'open-cup', 'Drinks from an open cup, sometimes spilling'],
  [18, 'motor', 'feeds', 'Feeds themselves with their fingers'],
  [18, 'motor', 'spoon-try', 'Tries to use a spoon'],
  [18, 'motor', 'climbs', 'Climbs on and off a couch or chair without help'],
  // 24 months
  [24, 'social', 'notices-hurt', 'Notices when others are hurt or upset'],
  [24, 'social', 'looks-react', 'Looks at your face to see how to react in a new situation'],
  [24, 'language', 'book-points', 'Points to things in a book when you ask, like "Where is the bear?"'],
  [24, 'language', 'two-words', 'Says at least two words together, like "More milk"'],
  [24, 'language', 'body-parts', 'Points to at least two body parts when asked'],
  [24, 'language', 'gestures', 'Uses more gestures than waving and pointing, like blowing a kiss or nodding'],
  [24, 'cognitive', 'two-hands', 'Holds something in one hand while using the other'],
  [24, 'cognitive', 'buttons', 'Tries to use switches, knobs or buttons on a toy'],
  [24, 'cognitive', 'multi-toy', 'Plays with more than one toy at once, like toy food on a toy plate'],
  [24, 'motor', 'kicks', 'Kicks a ball'],
  [24, 'motor', 'runs', 'Runs'],
  [24, 'motor', 'stairs', 'Walks (not climbs) up a few stairs, with or without help'],
  [24, 'motor', 'spoon', 'Eats with a spoon'],
];

export const MILESTONES: Milestone[] = raw.map(([ageMonths, area, key, text]) => ({
  id: `m${ageMonths}-${area}-${key}`,
  ageMonths,
  area,
  text,
}));

export const MILESTONES_BY_ID = new Map(MILESTONES.map((m) => [m.id, m]));
