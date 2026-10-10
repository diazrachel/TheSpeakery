// Listens for one word using the browser's built-in speech recognition.
// Works in Chrome and Edge. Safari works only if Dictation is turned on in
// macOS settings. Firefox, Brave, and Arc don't support it.
//
// Privacy: nothing is saved, uploaded by us, or logged. We only compare what
// was heard to the target word and then throw it away.
// Note: in Chrome, the browser itself sends audio to Google's speech service.
//
// Limitation: this checks WHICH word was heard, not how precisely the sound
// was made. It's a practice game, not a speech assessment.

const BrowserRecognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined

export const canRecognizeSpeech = Boolean(BrowserRecognition)

// Possible results (status):
//   'correct'      heard the target word
//   'missed'       heard speech, but not the target word
//   'no-speech'    heard nothing before the timeout
//   'mic-blocked'  the microphone permission is off
//   'no-mic'       the browser couldn't find a working microphone
//   'network'      the browser couldn't reach its speech service
//   'error'        something else went wrong
//   'cancelled'    we stopped listening on purpose
//
// The promise resolves to { status, heard, code }. `heard` is only used for
// the ?debug panel and is never stored.
export function listenForWord(targetWord, { alsoAccept = [], timeoutMs = 8000 } = {}) {
  const recognition = new BrowserRecognition()
  recognition.lang = 'en-US'
  recognition.continuous = false
  // Interim results let us accept the word the moment it's heard, instead of
  // waiting for the browser to decide the child has finished talking.
  recognition.interimResults = true
  recognition.maxAlternatives = 5

  let finished = false
  let lastHeard = ''
  let resolvePromise
  let timer

  const promise = new Promise((resolve) => {
    resolvePromise = resolve
  })

  function finish(status, code = '') {
    if (finished) return
    finished = true
    clearTimeout(timer)
    try {
      recognition.abort()
    } catch {
      // Already stopped.
    }
    resolvePromise({ status, heard: lastHeard, code })
  }

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const alternatives = Array.from(result).map((alt) => alt.transcript)
      if (alternatives[0]) lastHeard = alternatives[0]
      if (alternatives.some((text) => matchesWord(text, targetWord, alsoAccept))) {
        finish('correct')
        return
      }
      if (result.isFinal) {
        finish('missed')
        return
      }
    }
  }

  recognition.onerror = (event) => {
    const code = event.error
    if (code === 'not-allowed' || code === 'service-not-allowed') finish('mic-blocked', code)
    else if (code === 'no-speech') finish('no-speech', code)
    else if (code === 'audio-capture') finish('no-mic', code)
    else if (code === 'network') finish('network', code)
    else if (code === 'aborted') finish('cancelled', code)
    else finish('error', code)
  }

  // Ended without a final result: if we heard something, it wasn't the word.
  recognition.onend = () => finish(lastHeard ? 'missed' : 'no-speech', 'ended')

  timer = setTimeout(() => finish(lastHeard ? 'missed' : 'no-speech', 'timeout'), timeoutMs)

  try {
    recognition.start()
  } catch (error) {
    finish('error', error?.name ?? 'start-failed')
  }

  return { promise, cancel: () => finish('cancelled') }
}

// True when any word in the heard text is the target word
// (or its plural, or one of the extra spellings in the word list).
export function matchesWord(heardText, targetWord, alsoAccept = []) {
  const accepted = [targetWord, ...alsoAccept].map(normalize)
  const heard = normalize(heardText)
  if (accepted.includes(heard.replace(/\s/g, ''))) return true
  return heard.split(' ').some((word) => accepted.includes(word) || accepted.includes(word.replace(/s$/, '')))
}

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}
