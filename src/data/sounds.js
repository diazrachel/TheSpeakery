// All practice words live here, so the team can change them without touching game code.
//
// Each word matches what really happens at that baking step, focuses on one
// target sound, and avoids the other two practice sounds (R, S, K).
// The team should still review them, ideally with an SLP.
//
// The `guide` text explains how to make each sound. It's a kid-friendly
// DRAFT based on common speech-practice cues. Please have an SLP check it.
//
// `marked` is the word with {braces} around the letters that make the target
// sound. The game highlights those letters. "cake" has two: '{c}a{k}e'.
// "smush" only marks the first s, because the "sh" at the end is a different sound.
//
// Each treat has a starting picture and one picture per step. A step's `image`
// is what the treat looks like after the child says that step's word.
// The current pictures are SVG stand-ins made by tools/make_treats.py.
// To use final art, drop in a file and change the path here.

const art = (name) => `/assets/treats/${name}.svg`

export const SOUNDS = {
  S: {
    id: 'S',
    letter: 'S',
    phonetic: '/s/',
    exampleWord: 'sun',
    treat: 's’more',
    orderLine: 'One s’more, please!',
    finishLine: 'You made a s’more!',
    icon: art('treat-smore-5'),
    tip: 'Smile, keep your teeth close together, and let the air hiss out like a snake: sssss.',
    // How to make the sound, shown before baking and when practicing.
    guide: {
      nickname: 'the snake sound',
      // Practice the sound in a tiny word before baking. The browser can't
      // check a sound on its own (like "sssss"), so we use a one-syllable word
      // that starts with it. Extra spellings are what the browser may write.
      practice: { say: 'see', marked: '{s}ee', cue: 'Make a long snake sound, then say see. Sssss, see!', alsoAccept: ['sea', 'c', 'cee', 'si'] },
      listenWords: 'sun. snap. set.',
      rows: [
        { part: 'Lips', text: 'Smile so your teeth show.' },
        { part: 'Teeth', text: 'Bring your teeth close together.' },
        { part: 'Tongue', text: 'Lift the tip up behind your top teeth. Don’t touch them.' },
        { part: 'Air', text: 'Blow a long, quiet hiss like a snake: sssss. No voice.' },
      ],
    },
    // Start: a whole graham cracker on a plate.
    startImage: art('treat-smore-1'),
    steps: [
      { word: 'snap', marked: '{s}nap', action: 'Snap the cracker in half', image: art('treat-smore-2') },
      { word: 'set', marked: '{s}et', action: 'Set the chocolate on top', image: art('treat-smore-3') },
      { word: 'toast', marked: 'toa{s}t', action: 'Toast the marshmallow', image: art('treat-smore-4'), alsoAccept: ['toasts'] },
      { word: 'smush', marked: '{s}mush', action: 'Smush it all together', image: art('treat-smore-5'), alsoAccept: ['smoosh'] },
    ],
  },
  R: {
    id: 'R',
    letter: 'R',
    phonetic: '/r/',
    exampleWord: 'red',
    treat: 'cinnamon roll',
    orderLine: 'One cinnamon roll, please!',
    finishLine: 'You made a cinnamon roll!',
    icon: art('treat-roll-5'),
    tip: 'Pull your tongue back and lift it a little, then growl like a friendly tiger: rrrr.',
    guide: {
      nickname: 'the tiger sound',
      practice: { say: 'ray', marked: '{r}ay', cue: 'Growl like a tiger, then say ray. Rrrrr, ray!', alsoAccept: ['rae', 're', 'rey'] },
      listenWords: 'red. roll. ready.',
      rows: [
        { part: 'Lips', text: 'Make your lips a little round.' },
        { part: 'Tongue', text: 'Pull your tongue back. The tip doesn’t touch anything.' },
        { part: 'Sides', text: 'Press the sides of your tongue on your top back teeth.' },
        { part: 'Voice', text: 'Turn your voice on and growl like a friendly tiger: rrrr.' },
      ],
    },
    // Start: a ball of dough on a wooden board.
    startImage: art('treat-roll-1'),
    steps: [
      { word: 'roll', marked: '{r}oll', action: 'Roll out the dough', image: art('treat-roll-2'), alsoAccept: ['role', 'rolled'] },
      { word: 'brown', marked: 'b{r}own', action: 'Add the brown sugar', image: art('treat-roll-3') },
      { word: 'wrap', marked: '{wr}ap', action: 'Wrap it up into a roll', image: art('treat-roll-4'), alsoAccept: ['rap', 'wrapped'] },
      { word: 'ready', marked: '{r}eady', action: 'Bake it until it’s golden', image: art('treat-roll-5') },
    ],
  },
  K: {
    id: 'K',
    letter: 'K',
    phonetic: '/k/',
    exampleWord: 'key',
    treat: 'cupcake',
    orderLine: 'One cupcake, please!',
    finishLine: 'You made a cupcake!',
    icon: art('treat-cupcake-5'),
    tip: 'Open your mouth, lift the back of your tongue, and make a little pop: k, k, k.',
    guide: {
      nickname: 'the popping sound',
      practice: { say: 'key', marked: '{k}ey', cue: 'Make a little pop, then say key. K, k, key!', alsoAccept: ['k', 'kee', 'ki', 'qi'] },
      listenWords: 'key. cup. cake.',
      rows: [
        { part: 'Mouth', text: 'Open your mouth a little.' },
        { part: 'Tip', text: 'Keep your tongue tip down behind your bottom teeth.' },
        { part: 'Back', text: 'Lift the back of your tongue up to touch the back of the roof of your mouth.' },
        { part: 'Air', text: 'Let go with a little pop of air: k, k, k. No voice.' },
      ],
    },
    // Start: an empty cupcake liner on a plate.
    startImage: art('treat-cupcake-1'),
    steps: [
      { word: 'cup', marked: '{c}up', action: 'Fill the cup with batter', image: art('treat-cupcake-2') },
      { word: 'bake', marked: 'ba{k}e', action: 'Bake it in the oven', image: art('treat-cupcake-3'), alsoAccept: ['baked'] },
      { word: 'cake', marked: '{c}a{k}e', action: 'Frost the cake', image: art('treat-cupcake-4') },
      { word: 'candy', marked: '{c}andy', action: 'Top it with candy', image: art('treat-cupcake-5') },
    ],
  },
}

export const SOUND_ORDER = ['R', 'S', 'K']

// All the guide steps as one paragraph, for the read-aloud buttons.
export function guideAsSpeech(sound) {
  return sound.guide.rows.map((row) => row.text).join(' ')
}

// Splits a marked word like '{c}a{k}e' into pieces: [{ text: 'c', target: true }, ...]
export function splitMarked(marked) {
  return marked
    .split(/(\{[^}]*\})/)
    .filter(Boolean)
    .map((part) => (part.startsWith('{') ? { text: part.slice(1, -1), target: true } : { text: part, target: false }))
}
