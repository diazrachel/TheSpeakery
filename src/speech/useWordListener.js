// A React hook that screens use to listen for a word.
//
// Demo fallback for the live demo: while the mic is listening, press
//   Y to count it as correct,
//   N to count it as missed,
//   M to count it as a near miss (like hearing "way" for "ray"), to show a tip.

import { useCallback, useEffect, useRef, useState } from 'react'
import { showDebug } from './debug.js'
import { canRecognizeSpeech, listenForWord } from './recognition.js'
import { applySoundCheck } from '../game/wordCheck.js'
import { startRecording } from './micRecorder.js'
import { checkRSound } from './rSoundCheck.js'
import { letMicSettle, stopSpeaking } from './speak.js'

// Statuses that show a message on screen.
const MESSAGE_STATUSES = ['no-speech', 'mic-blocked', 'no-mic', 'network', 'error']

// status: idle | listening | no-speech | mic-blocked | no-mic | network | error | unsupported
//
// listen(isCorrect) takes a check from src/game/wordCheck.js and resolves to
// { status, heardOptions, soundSwap }. heardOptions is what the browser thinks
// it heard, for picking a tip. soundSwap is 'w' when the R sound check heard a
// W instead of an R. Don't save or log any of it.
export function useWordListener() {
  const [status, setStatus] = useState('idle')
  const activeRef = useRef(null)

  const listen = useCallback(async (isCorrect) => {
    const word = isCorrect.word
    if (activeRef.current) return { status: 'busy', heardOptions: [] } // already listening; ignore double taps
    if (!canRecognizeSpeech) {
      setStatus('unsupported')
      showDebug({ target: word, status: 'unsupported', heard: '', code: 'no SpeechRecognition in this browser' })
      return { status: 'unsupported', heardOptions: [] }
    }

    stopSpeaking() // don't let the game hear its own voice
    setStatus('listening')
    activeRef.current = { starting: true }
    // For R words, also keep the sound in memory to check HOW the R sounded.
    const recorder = isCorrect.checkR ? await startRecording() : null

    let resolveDemo
    const demoKeyPress = new Promise((resolve) => {
      resolveDemo = resolve
    })
    const session = listenForWord(isCorrect)
    activeRef.current = {
      resolveDemo,
      demoNearMiss: isCorrect.demoNearMiss,
      cancel: () => {
        session.cancel()
        resolveDemo({ status: 'cancelled', heard: '', heardOptions: [], code: '' })
      },
    }

    const result = await Promise.race([session.promise, demoKeyPress])
    session.cancel()
    const audio = await recorder?.stop()
    let rCheck = null
    let soundSwap = null
    if (audio && result.code !== 'demo' && result.status === 'correct') {
      rCheck = checkRSound(audio.samples, audio.sampleRate)
      ;({ status: result.status, soundSwap } = applySoundCheck(result.status, rCheck))
    }
    letMicSettle() // let the sound settle before the dragon answers
    activeRef.current = null

    showDebug({ target: word, ...result, rCheck })
    setStatus(MESSAGE_STATUSES.includes(result.status) ? result.status : 'idle')
    return { status: result.status, heardOptions: result.heardOptions ?? [], soundSwap }
  }, [])

  // Demo keys: Y = correct, N = missed, M = near miss (only while listening).
  useEffect(() => {
    function onKeyDown(event) {
      const active = activeRef.current
      if (!active?.resolveDemo) return
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
  useEffect(() => () => activeRef.current?.cancel?.(), [])

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
