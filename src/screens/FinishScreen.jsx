import { useEffect } from 'react'
import { Sparkles } from '../components/Sparkles.jsx'
import { AgainIcon } from '../components/icons.jsx'
import { Art, Button, Headline, Scene } from '../components/ui.jsx'
import { LINES } from '../speech/lines.js'
import { speak } from '../speech/speak.js'

// Two moments on one screen: celebrate the treat, then give it to the dragon.
export function FinishScreen({ sound, treatGiven, onGive, onPlayAgain }) {
  const finalImage = sound.steps[sound.steps.length - 1].image
  const cheer = LINES.finishCheer(sound)
  const thanks = LINES.finishThanks(sound)

  useEffect(() => {
    speak(treatGiven ? thanks : cheer)
  }, [treatGiven, thanks, cheer])

  return (
    <Scene mood={treatGiven ? 'yum' : 'cheer'} says={treatGiven ? 'Yum! Thank you!' : 'Is that for me?'}>
      {treatGiven ? (
        <Headline title="Yum! Thank you!" spoken={thanks} />
      ) : (
        <Headline small="Amazing!" title={sound.finishLine} spoken={cheer} />
      )}

      {!treatGiven && (
        <button type="button" className="on-counter give" onClick={onGive} aria-label={`Give the ${sound.treat} to the dragon`}>
          <Sparkles />
          <Art src={finalImage} alt="" className="treat__img" />
        </button>
      )}

      <div className="counter-front">
        {treatGiven ? (
          <Button onClick={onPlayAgain}>
            <AgainIcon /> Bake another treat
          </Button>
        ) : (
          <p className="counter-hint">Tap the {sound.treat} to give it to the dragon</p>
        )}
      </div>
    </Scene>
  )
}
