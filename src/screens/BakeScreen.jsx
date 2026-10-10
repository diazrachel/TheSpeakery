import { useEffect, useState } from 'react'
import { MicButton } from '../components/MicButton.jsx'
import { Art, Button, Headline, MarkedWord, Scene, SlowSpeakButton } from '../components/ui.jsx'
import { findNearMiss } from '../game/coach.js'
import { MISSES_BEFORE_PRACTICE } from '../game/gameReducer.js'
import { LINES } from '../speech/lines.js'
import { speak } from '../speech/speak.js'
import { useAfterSpeech } from '../speech/useAfterSpeech.js'
import { LISTEN_MESSAGES, useWordListener } from '../speech/useWordListener.js'

// The shortest time the dragon reacts before the game moves on.
// (It also waits for the dragon to finish talking.)
const REACTION_MS = 1500

export function BakeScreen({ sound, stepIndex, onCorrect, onMissed, onSkip }) {
  const step = sound.steps[stepIndex]
  const treatBefore = stepIndex === 0 ? sound.startImage : sound.steps[stepIndex - 1].image
  const spoken = LINES.stepPrompt(step)

  const { status, listen } = useWordListener()
  const afterSpeech = useAfterSpeech()
  // reaction: null | 'cheer' | 'confused'
  const [reaction, setReaction] = useState(null)
  const [misses, setMisses] = useState(0)
  // The near-miss word we heard on the last try (like "way"), shown in the bubble.
  const [heardNearMiss, setHeardNearMiss] = useState(null)

  // Read the prompt out loud. (App gives each step a fresh screen, so this
  // runs once per step.)
  useEffect(() => {
    speak(spoken)
  }, [spoken])

  async function handleMic() {
    const { status: result, heardOptions } = await listen(step.word, {
      alsoAccept: step.alsoAccept,
      nearMisses: step.nearMisses,
    })
    if (result === 'correct') {
      setReaction('cheer')
      afterSpeech(speak(LINES.stepCheer), REACTION_MS, onCorrect)
    } else if (result === 'missed') {
      const missesNow = misses + 1
      const nearMiss = findNearMiss(heardOptions, step.nearMisses)
      setMisses(missesNow)
      setHeardNearMiss(nearMiss?.heard ?? null)
      setReaction('confused')
      if (missesNow >= MISSES_BEFORE_PRACTICE) {
        // Missed it again: go practice the sound, then come back to this word.
        afterSpeech(speak(LINES.stepToPractice), REACTION_MS + 400, onMissed)
      } else {
        // A tip that fits the sound swap we heard, or the general tip for this sound.
        // The mic comes back after the tip, so tapping it can't cut the tip off.
        const tip = nearMiss ? LINES.stepCoach(sound, step, nearMiss.swap) : LINES.stepRetry(sound, step)
        afterSpeech(speak(tip), REACTION_MS, () => setReaction(null))
      }
    }
  }

  const listening = status === 'listening'
  const message = LISTEN_MESSAGES[status]
  const treatNow = reaction === 'cheer' ? step.image : treatBefore
  const mood = reaction ?? (listening ? 'listening' : 'idle')
  let confusedLine = misses >= MISSES_BEFORE_PRACTICE ? 'Hmm? Let’s practice!' : 'Hmm? Try again!'
  if (heardNearMiss && misses < MISSES_BEFORE_PRACTICE) confusedLine = `Hmm? I heard “${heardNearMiss}”!`
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
