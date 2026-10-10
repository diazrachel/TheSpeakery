// A React hook that screens use to listen for a word.
//
// Demo fallback for the live demo: while the mic is listening, press
//   Y to count it as correct,
//   N to count it as missed,
//   M to count it as a near miss (like hearing "way" for "ray"), to show a tip.

import { useCallback, useEffect, useRef, useState } from 'react'
import { exampleNearMiss } from '../game/coach.js'
import { showDebug } from './debug.js'
import { canRecognizeSpeech, listenForWord } from './recognition.js'
import { letMicSettle, stopSpeaking } from './speak.js'

// Statuses that show a message on screen.
const MESSAGE_STATUSES = ['no-speech', 'mic-blocked', 'no-mic', 'network', 'error']

// status: idle | listening | no-speech | mic-blocked | no-mic | network | error | unsupported
//
// listen() resolves to { status, heardOptions }. heardOptions is what the
// browser thinks it heard, for picking a tip. Don't save or log it.
export function useWordListener() {
  const [status, setStatus] = useState('idle')
  const activeRef = useRef(null)

  const listen = useCallback(async (word, { alsoAccept = [], nearMisses = {} } = {}) => {
    if (activeRef.current) return { status: 'busy', heardOptions: [] } // already listening; ignore double taps
    if (!canRecognizeSpeech) {
      setStatus('unsupported')
      showDebug({ target: word, status: 'unsupported', heard: '', code: 'no SpeechRecognition in this browser' })
      return { status: 'unsupported', heardOptions: [] }
    }

    stopSpeaking() // don't let the game hear its own voice
    setStatus('listening')

    let resolveDemo
    const demoKeyPress = new Promise((resolve) => {
      resolveDemo = resolve
    })
    const session = listenForWord(word, { alsoAccept })
    activeRef.current = {
      resolveDemo,
      demoNearMiss: exampleNearMiss(nearMisses),
      cancel: () => {
        session.cancel()
        resolveDemo({ status: 'cancelled', heard: '', heardOptions: [], code: '' })
      },
    }

    const result = await Promise.race([session.promise, demoKeyPress])
    session.cancel()
    letMicSettle() // let the sound settle before the dragon answers
    activeRef.current = null

    showDebug({ target: word, ...result })
    setStatus(MESSAGE_STATUSES.includes(result.status) ? result.status : 'idle')
    return { status: result.status, heardOptions: result.heardOptions ?? [] }
  }, [])

  // Demo keys: Y = correct, N = missed, M = near miss (only while listening).
  useEffect(() => {
    function onKeyDown(event) {
      const active = activeRef.current
      if (!active) return
      const key = event.key.toLowerCase()
      if (key === 'y') active.resolveDemo({ status: 'correct', heard: '(Y key)', heardOptions: [], code: 'demo' })
      if (key === 'n') active.resolveDemo({ status: 'missed', heard: '(N key)', heardOptions: [], code: 'demo' })
      if (key === 'm') {
        const heard = active.demoNearMiss
        active.resolveDemo({ status: 'missed', heard: `(M key) ${heard}`, heardOptions: [heard], code: 'demo' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Stop listening if the screen closes.
  useEffect(() => () => activeRef.current?.cancel(), [])

  return { status, listen }
}

// Friendly messages for each problem. The game never says "wrong."
export const LISTEN_MESSAGES = {
  'no-speech': "I didn't hear anything. Tap the mic and say it nice and loud!",
  'mic-blocked':
    'Grown-ups: the microphone is blocked. Allow it in the browser (the icon next to the web address). In Safari, also turn on Dictation in Mac settings.',
  'no-mic': "Grown-ups: the browser can't find a microphone. Check that one is connected and that the browser is allowed to use it in Mac settings.",
  network: "Grown-ups: the browser couldn't reach its speech service. Check the internet, or open the game in Chrome.",
  error: "Hmm, I couldn't listen just now. Tap the mic to try again.",
  unsupported: "Grown-ups: this browser can't listen. Please open the game in Chrome or Edge.",
}
