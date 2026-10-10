import { ArrowIcon } from '../components/icons.jsx'
import { Button, Scene } from '../components/ui.jsx'

export function StartScreen({ onStart }) {
  return (
    <Scene mood="idle" dragonPlace="center">
      <header className="hero">
        <h1 className="hero__title">The Speakery</h1>
        <p className="hero__tagline">Say the magic words to bake yummy treats.</p>
      </header>
      <div className="counter-front">
        <Button onClick={onStart} className="btn--xl">
          Start <ArrowIcon size={32} />
        </Button>
      </div>
    </Scene>
  )
}
