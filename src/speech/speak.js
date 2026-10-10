// Says a line out loud, so kids who can't read yet can still play.
//
// If the line was recorded with ElevenLabs (see `npm run voice` and
// public/assets/voice/manifest.json), it plays that mp3. Otherwise it falls
// back to the browser's built-in voice, so the game always talks.

const VOICE_FOLDER = '/assets/voice/'

// Speeds. With recordings, the turtle plays the word clip slowed down
// (the pitch stays normal). With the browser voice, it uses a slow rate.
export const NORMAL = 'normal'
export const SLOW = 'slow'
const CLIP_RATE = { normal: 1, slow: 0.6 }
const BROWSER_RATE = { normal: 0.85, slow: 0.4 }

const canUseBrowserVoice = typeof window !== 'undefined' && 'speechSynthesis' in window

// Load the list of recorded lines once. If there isn't one, that's fine.
const recordings =
  typeof window === 'undefined'
    ? Promise.resolve({})
    : fetch(`${VOICE_FOLDER}manifest.json`)
        .then((response) => (response.ok ? response.json() : {}))
        .then((manifest) => manifest.lines ?? {})
        .catch(() => ({}))

// If the exact same line is asked for again this quickly, skip it.
// (In development, React runs each screen's startup code twice.)
const REPEAT_WINDOW_MS = 1000
let lastKey = ''
let lastTime = 0

let currentClip = null
let requestId = 0

export function speak(text, { speed = NORMAL } = {}) {
  const key = `${speed}|${text}`
  const now = Date.now()
  if (key === lastKey && now - lastTime < REPEAT_WINDOW_MS) return
  lastKey = key
  lastTime = now

  stopAudio()
  const thisRequest = ++requestId

  recordings.then((lines) => {
    // Something newer was asked for while we waited. Let that one play.
    if (thisRequest !== requestId) return
    const file = lines[text]
    if (file) playClip(`${VOICE_FOLDER}${file}`, speed, text)
    else browserSpeak(text, speed)
  })
}

export function stopSpeaking() {
  lastKey = ''
  requestId++
  stopAudio()
}

function playClip(url, speed, text) {
  const clip = new Audio(url)
  clip.playbackRate = CLIP_RATE[speed]
  clip.preservesPitch = true
  currentClip = clip
  clip.play().catch(() => {
    // The file is missing or the browser blocked it: use the built-in voice.
    if (currentClip === clip) browserSpeak(text, speed)
  })
}

function browserSpeak(text, speed) {
  if (!canUseBrowserVoice) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = BROWSER_RATE[speed]
  utterance.pitch = 1.1
  window.speechSynthesis.speak(utterance)
}

function stopAudio() {
  if (currentClip) {
    currentClip.pause()
    currentClip = null
  }
  if (canUseBrowserVoice) window.speechSynthesis.cancel()
}
