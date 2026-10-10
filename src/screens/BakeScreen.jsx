import { useEffect, useRef, useState } from 'react'
import { MicButton } from '../components/MicButton.jsx'
import { Art, Button, Headline, MarkedWord, Scene, SlowSpeakButton } from '../components/ui.jsx'
import { MISSES_BEFORE_PRACTICE } from '../game/gameReducer.js'
import { LINES } from '../speech/lines.js'
import { speak } from '../speech/speak.js'
import { LISTEN_MESSAGES, useWordListener } from '../speech/useWordListener.js'

// How long the dragon reacts before the game moves on.
const REACTION_MS = 1500

export function BakeScreen({ sound, stepIndex, onCorrect, onMissed, onSkip }) {
  const step = sound.steps[stepIndex]
  const treatBefore = stepIndex === 0 ? sound.startImage : sound.steps[stepIndex - 1].image
  const spoken = LINES.stepPrompt(step)

  const { status, listen } = useWordListener()
  // reaction: null | 'cheer' | 'confused'
  const [reaction, setReaction] = useState(null)
  const [misses, setMisses] = useState(0)
  const timer = useRef(null)

  // Read the prompt out loud. (App gives each step a fresh screen, so this
  // runs once per step.)
  useEffect(() => {
    speak(spoken)
  }, [spoken])

  useEffect(() => () => clearTimeout(timer.current), [])

  async function handleMic() {
    const result = await listen(step.word, step.alsoAccept)
    if (result === 'correct') {
      setReaction('cheer')
      speak(LINES.stepCheer)
      timer.current = setTimeout(onCorrect, REACTION_MS)
    } else if (result === 'missed') {
      const missesNow = misses + 1
      setMisses(missesNow)
      setReaction('confused')
      if (missesNow >= MISSES_BEFORE_PRACTICE) {
        // Missed it again: go practice the sound, then come back to this word.
        speak(LINES.stepToPractice)
        timer.current = setTimeout(onMissed, REACTION_MS + 400)
      } else {
        speak(LINES.stepRetry(step))
        timer.current = setTimeout(() => setReaction(null), REACTION_MS)
      }
    }
  }

  const listening = status === 'listening'
  const message = LISTEN_MESSAGES[status]
  const treatNow = reaction === 'cheer' ? step.image : treatBefore
  const mood = reaction ?? (listening ? 'listening' : 'idle')
  const confusedLine = misses >= MISSES_BEFORE_PRACTICE ? 'Hmm? Let’s practice!' : 'Hmm? Try again!'
  const says = reaction === 'cheer' ? 'You did it!' : reaction === 'confused' ? confusedLine : null

  return (
    <Scene mood={mood} says={says}>
      <Headline
        small={step.action}
        title={
          <>
            Say “<MarkedWord marked={step.marked} />”
          </>
        }
        spoken={spoken}
        actions={<SlowSpeakButton word={step.word} />}
      />

      {message && (
        <div className="center-zone center-zone--top">
          <p className="notice" role="status">
            {message}
          </p>
        </div>
      )}

      <div className="order-card" aria-label={`The order: ${sound.treat}`}>
        <Art src={sound.icon} alt="" />
      </div>

      <div className={`on-counter ${reaction === 'cheer' ? 'on-counter--pop' : ''}`}>
        <Art key={treatNow} src={treatNow} alt={`${sound.treat} in progress`} className="treat__img" />
      </div>

      <div className="counter-front">
        {status === 'unsupported' ? (
          <Button onClick={onSkip}>Keep baking</Button>
        ) : (
          <MicButton listening={listening} disabled={reaction !== null} onPress={handleMic} />
        )}
      </div>
    </Scene>
  )
}
