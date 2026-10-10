import { useState } from 'react'
import { MicIcon } from '../components/icons.jsx'
import { Button, Headline, Scene } from '../components/ui.jsx'
import { LINES } from '../speech/lines.js'
import { requestMicAccess } from '../speech/micAccess.js'

const ASK = LINES.micAsk

const PROBLEMS = {
  blocked:
    'Grown-ups: the microphone is blocked for this page. Click the icon next to the web address, allow the microphone, then tap the button again. On a Mac, also check System Settings › Privacy & Security › Microphone.',
  unavailable:
    "Grown-ups: this device doesn't have a microphone the game can use. You can still keep going and tap through.",
}

export function MicCheckScreen({ onReady }) {
  const [checking, setChecking] = useState(false)
  const [problem, setProblem] = useState(null)

  async function turnOnMic() {
    setChecking(true)
    const result = await requestMicAccess()
    setChecking(false)
    if (result === 'granted') onReady()
    else setProblem(result)
  }

  return (
    <Scene mood="listening" says="Can I listen?">
      <Headline small="I bake with your voice!" title="Can I use the microphone?" spoken={ASK} />

      {problem && (
        <div className="center-zone">
          <p className="notice" role="alert">
            {PROBLEMS[problem]}
          </p>
        </div>
      )}

      <div className="counter-front">
        <Button variant="strong" onClick={turnOnMic} disabled={checking}>
          <MicIcon /> {checking ? 'Checking…' : 'Turn on the mic'}
        </Button>
        {problem === 'unavailable' && (
          <Button onClick={onReady}>Keep going</Button>
        )}
      </div>
    </Scene>
  )
}
