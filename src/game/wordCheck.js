// Decides if what the browser heard counts as saying the word.
//
// The browser's speech recognition is built to guess real words, so it can
// "fix" a sound swap (a lisp can still come out as "snap"), and it can
// mishear words it doesn't know well (like "smush"). These rules make it
// stricter where it was too easy and a bit more forgiving where it was too hard:
//
// 1. Only the browser's best guess counts, not its backup guesses.
// 2. If the browser says it isn't sure (low confidence), we ask again.
// 3. Near-miss words (like "way" for "ray") never count as correct.
// 4. A word one letter off still counts (like "smash" for "smush"), but only
//    if the target sound's letters are still in the right spot. So "back"
//    counts for "bake", but "take" doesn't count for "cake".
//
// It's still not a speech test. It checks words, not exactly how a sound was made.

import { splitMarked } from '../data/sounds.js'
import { exampleNearMiss, findNearMiss } from './coach.js'

// Below this confidence (0 to 1), a correct-sounding word is asked again.
// Open the game with ?debug to see the confidence on each try, and adjust if
// it asks again too often (lower it) or lets too much through (raise it).
// Some browsers report 0 when they don't know. Then confidence is ignored.
export const MIN_CONFIDENCE = 0.5

// Turn the R sound check on or off (see speech/rSoundCheck.js).
export const CHECK_R_SOUND = true

// After the browser says a word was right, the R sound check gets a say:
// if the R clearly sounded like a W, it counts as a near miss instead.
// rCheck: from checkRSound(), or null if it couldn't run.
export function applySoundCheck(status, rCheck) {
  if (status === 'correct' && rCheck?.verdict === 'w') return { status: 'missed', soundSwap: 'w' }
  return { status, soundSwap: null }
}

// Letters that can spell each target sound.
const SOUND_LETTERS = { R: ['r'], S: ['s', 'c'], K: ['c', 'k', 'q'] }

// item: a step ({ word, marked, alsoAccept, nearMisses }) or a practice
// word ({ say, marked, alsoAccept, nearMisses }).
// Returns isCorrect(options), where options are the browser's guesses,
// best first: [{ text, confidence }].
export function makeWordCheck(sound, item) {
  const word = item.word ?? item.say
  const accepted = [word, ...(item.alsoAccept ?? [])].map(normalize)
  const nearMisses = item.nearMisses ?? {}
  const nearMissWords = Object.values(nearMisses).flat()
  const soundSpans = targetSpans(item.marked)
  const soundLetters = SOUND_LETTERS[sound.id] ?? []

  function wordCounts(heardWord) {
    if (nearMissWords.includes(heardWord)) return false
    if (accepted.includes(heardWord) || accepted.includes(heardWord.replace(/s$/, ''))) return true
    // One letter off, with the target sound still in place.
    if (editDistance(heardWord, normalize(word)) > 1) return false
    return soundSpans.every(([start, end]) => {
      // Allow the sound to shift by one letter, since a letter may be added or dropped.
      const nearby = heardWord.slice(Math.max(0, start - 1), end + 1)
      // "sh" and "th" are different sounds, even though "sh" has an s in it.
      const targetNearby = normalize(word).slice(Math.max(0, start - 1), end + 1)
      if (sound.id === 'S' && /sh|th/.test(nearby) && !/sh|th/.test(targetNearby)) return false
      return soundLetters.some((letter) => nearby.includes(letter))
    })
  }

  function isCorrect(options = []) {
    const best = options[0]
    if (!best) return false
    const heard = normalize(best.text)
    if (findNearMiss([heard], nearMisses)) return false
    const saidIt = heard.replace(/\s/g, '') === accepted[0] || heard.split(' ').some(wordCounts)
    if (!saidIt) return false
    const sure = !best.confidence || best.confidence >= MIN_CONFIDENCE
    return sure
  }

  isCorrect.word = word
  // R words also get a check of HOW the R sounded (speech/rSoundCheck.js).
  isCorrect.checkR = CHECK_R_SOUND && sound.id === 'R'
  isCorrect.nearMisses = nearMisses
  isCorrect.demoNearMiss = exampleNearMiss(nearMisses)
  return isCorrect
}

// Where the target sound's letters are in the word: '{c}a{k}e' -> [[0, 1], [2, 3]].
function targetSpans(marked = '') {
  const spans = []
  let position = 0
  for (const part of splitMarked(marked)) {
    if (part.target) spans.push([position, position + part.text.length])
    position += part.text.length
  }
  return spans
}

// How many letters you'd change, add, or remove to turn one word into the other.
function editDistance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
    }
    previous = current
  }
  return previous[b.length]
}

function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}
