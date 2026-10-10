// A React hook that screens use to listen for a word.
//
// Demo fallback for the live demo: while the mic is listening,
// press Y on the keyboard to count it as correct, or N to count it as missed.

import { useCallback, useEffect, useRef, useState } from 'react'
import { showDebug } from './debug.js'
import { canRecognizeSpeech, listenForWord } from './recognition.js'
import { stopSpeaking } from './speak.js'

// Statuses that show a message on screen.
const MESSAGE_STATUSES = ['no-speech', 'mic-blocked', 'no-mic', 'network', 'error']

// status: idle | listening | no-speech | mic-blocked | no-mic | network | error | unsupported
export function useWordListener() {
  const [status, setStatus] = useState('idle')
  const activeRef = useRef(null)

  const listen = useCallback(async (word, alsoAccept = []) => {
    if (activeRef.current) return null // already listening; ignore double taps
    if (!canRecognizeSpeech) {
      setStatus('unsupported')
      showDebug({ target: word, status: 'unsupported', heard: '', code: 'no SpeechRecognition in this browser' })
      return 'unsupported'
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
      cancel: () => {
        session.cancel()
        resolveDemo({ status: 'cancelled', heard: '', code: '' })
      },
    }

    const result = await Promise.race([session.promise, demoKeyPress])
    session.cancel()
    activeRef.current = null

    showDebug({ target: word, ...result })
    setStatus(MESSAGE_STATUSES.includes(result.status) ? result.status : 'idle')
    return result.status
  }, [])

  // Demo keys: Y = correct, N = missed (only while listening).
  useEffect(() => {
    function onKeyDown(event) {
      const active = activeRef.current
      if (!active) return
      const key = event.key.toLowerCase()
      if (key === 'y') active.resolveDemo({ status: 'correct', heard: '(Y key)', code: 'demo' })
      if (key === 'n') active.resolveDemo({ status: 'missed', heard: '(N key)', code: 'demo' })
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
