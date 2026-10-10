// The "how to make the sound" table, ending with a sound practice.
// The child must say the practice word (like "see" for S) to move on.
//
// mode "intro": before baking starts. Success starts the bakery.
// mode "retry": after missing a bakery word twice. Success goes back to that word.
//
// There's no skip for kids. After a few misses the dragon offers grown-up help,
// and a grown-up can unlock "Let's bake anyway" (components/GrownUpHelp.jsx).

import { useEffect, useState } from 'react'
import { GrownUpHelp } from '../components/GrownUpHelp.jsx'
import { MicButton } from '../components/MicButton.jsx'
import { SoundGuide } from '../components/SoundGuide.jsx'
import { findNearMiss } from '../game/coach.js'
import { Button, Headline, MarkedWord, Scene, SlowSpeakButton, SpeakButton } from '../components/ui.jsx'
import { LINES } from '../speech/lines.js'
import { speak } from '../speech/speak.js'
import { useAfterSpeech } from '../speech/useAfterSpeech.js'
import { LISTEN_MESSAGES, useWordListener } from '../speech/useWordListener.js'

// The shortest time the dragon reacts. It also waits for the dragon to finish talking.
const REACTION_MS = 1800
// After this many misses, the dragon asks if a grown-up wants to help.
const MISSES_BEFORE_HELP_OFFER = 3

export function SoundPracticeScreen({ sound, mode = 'intro', onDone }) {
  const { practice } = sound.guide
  const intro = LINES.guideIntro(sound, mode)

  const { status, listen } = useWordListener()
  const afterSpeech = useAfterSpeech()
  const [reaction, setReaction] = useState(null)
  const [misses, setMisses] = useState(0)
  // The near-miss word we heard on the last try (like "tea"), shown in the bubble.
  const [heardNearMiss, setHeardNearMiss] = useState(null)
  const offerHelp = misses >= MISSES_BEFORE_HELP_OFFER

  useEffect(() => {
    speak(intro)
  }, [intro])

  async function handleMic() {
    const { status: result, heardOptions } = await listen(practice.say, {
      alsoAccept: practice.alsoAccept,
      nearMisses: practice.nearMisses,
    })
    if (result === 'correct') {
      setReaction('cheer')
      afterSpeech(speak(LINES.practiceSuccess(mode)), REACTION_MS, onDone)
    } else if (result === 'missed') {
      const missesNow = misses + 1
      const nearMiss = findNearMiss(heardOptions, practice.nearMisses)
      setMisses(missesNow)
      setHeardNearMiss(nearMiss?.heard ?? null)
      setReaction('confused')
      let line = LINES.practiceRetry(sound)
      if (missesNow === MISSES_BEFORE_HELP_OFFER) line = LINES.helpOffer
      else if (nearMiss) line = LINES.practiceCoach(sound, nearMiss.swap) // a tip that fits the swap we heard
      // The mic comes back after the tip, so tapping it can't cut the tip off.
      afterSpeech(speak(line), REACTION_MS, () => setReaction(null))
    }
  }

  // A grown-up chose to let the child keep baking.
  function bakeAnyway() {
    setReaction('proud')
    afterSpeech(speak(LINES.bakeAnyway), REACTION_MS, onDone)
  }

  const listening = status === 'listening'
  const message = LISTEN_MESSAGES[status]
  const mood = reaction === 'proud' ? 'cheer' : (reaction ?? (listening ? 'listening' : 'encourage'))
  let says = mode === 'intro' ? 'Watch the mouth picture!' : 'Let’s practice the sound!'
  if (offerHelp) says = 'Want a grown-up to help?'
  if (reaction === 'confused') {
    if (offerHelp) says = 'Tricky one! Want a grown-up to help?'
    else if (heardNearMiss) says = `Hmm? I heard “${heardNearMiss}”!`
    else says = 'Hmm? Let’s try again!'
  }
  if (reaction === 'cheer') says = 'You did it!'
  if (reaction === 'proud') says = 'Great practicing!'

  return (
    <Scene mood={mood} says={says} calm>
      <Headline
        small={mode === 'intro' ? 'Before we bake' : 'Let’s practice the sound'}
        title={`How to say ${sound.letter}`}
        spoken={intro}
      />

      <div className="center-zone center-zone--guide">
        <SoundGuide sound={sound} />
      </div>

      <div className="practice-target" role="status">
        {message ? (
          <span>{message}</span>
        ) : (
          <>
            <span className="practice-target__label">Now you try!</span>
            <span className="practice-target__say">
              Say “<MarkedWord marked={practice.marked} />”
            </span>
            <SpeakButton text={LINES.practiceCue(sound)} label={`Hear how to say ${practice.say}`} />
            <SlowSpeakButton word={practice.say} />
          </>
        )}
      </div>

      <div className="counter-front">
        {status === 'unsupported' ? (
          // Only when the browser can't listen at all. That's not the child's fault.
          <Button onClick={onDone}>Keep going</Button>
        ) : (
          <MicButton listening={listening} disabled={reaction !== null} onPress={handleMic} />
        )}
      </div>

      <GrownUpHelp highlight={offerHelp} onBakeAnyway={bakeAnyway} />
    </Scene>
  )
}
