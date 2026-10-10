// The game's "switchboard": keeps track of where the child is and shows that screen.

import { useReducer, useState } from 'react'
import { DebugPanel } from './components/DebugPanel.jsx'
import { TopBar } from './components/TopBar.jsx'
import { SOUNDS } from './data/sounds.js'
import { gameReducer, initialGameState } from './game/gameReducer.js'
import { addToShelf, loadShelf, shelfIsFull } from './game/shelf.js'
import { BakeScreen } from './screens/BakeScreen.jsx'
import { FeedScreen } from './screens/FeedScreen.jsx'
import { FinishScreen } from './screens/FinishScreen.jsx'
import { MicCheckScreen } from './screens/MicCheckScreen.jsx'
import { OrderScreen } from './screens/OrderScreen.jsx'
import { PickSoundScreen } from './screens/PickSoundScreen.jsx'
import { ShelfScreen } from './screens/ShelfScreen.jsx'
import { SoundPracticeScreen } from './screens/SoundPracticeScreen.jsx'
import { StartScreen } from './screens/StartScreen.jsx'
import { stopSpeaking } from './speech/speak.js'

export default function App() {
  const [game, dispatch] = useReducer(gameReducer, initialGameState)
  const sound = SOUNDS[game.soundId]
  const inKitchen = game.screen === 'bake' || game.screen === 'practice'
  // The treat shelf is saved on this device (see game/shelf.js).
  const [shelf, setShelf] = useState(loadShelf)
  const [justFilled, setJustFilled] = useState(false)

  function giveTreat() {
    const next = addToShelf(shelf, game.soundId)
    setJustFilled(!shelfIsFull(shelf) && shelfIsFull(next))
    setShelf(next)
    dispatch({ type: 'GIVE_TREAT' })
  }

  function goHome() {
    stopSpeaking()
    dispatch({ type: 'GO_HOME' })
  }

  return (
    <div className="app">
      <TopBar
        onHome={game.screen === 'start' ? null : goHome}
        totalSteps={inKitchen ? sound.steps.length : 0}
        doneSteps={game.stepIndex}
      />

      {game.screen === 'start' && (
        <StartScreen onStart={() => dispatch({ type: 'START' })} onOpenShelf={() => dispatch({ type: 'OPEN_SHELF' })} />
      )}

      {game.screen === 'shelf' && (
        <ShelfScreen
          shelf={shelf}
          onBake={() => dispatch({ type: 'START' })}
          onFeed={() => dispatch({ type: 'OPEN_FEED' })}
          onBack={goHome}
        />
      )}

      {game.screen === 'feed' && <FeedScreen onHome={goHome} />}

      {game.screen === 'pickSound' && (
        <PickSoundScreen
          soundId={game.soundId}
          onPick={(soundId) => dispatch({ type: 'PICK_SOUND', soundId })}
          onConfirm={() => dispatch({ type: 'CONFIRM_SOUND' })}
        />
      )}

      {game.screen === 'micCheck' && <MicCheckScreen onReady={() => dispatch({ type: 'MIC_READY' })} />}

      {game.screen === 'order' && <OrderScreen sound={sound} onBegin={() => dispatch({ type: 'SHOW_GUIDE' })} />}

      {game.screen === 'guide' && (
        <SoundPracticeScreen sound={sound} mode="intro" onDone={() => dispatch({ type: 'BEGIN_BAKING' })} />
      )}

      {game.screen === 'bake' && (
        <BakeScreen
          key={game.stepIndex}
          sound={sound}
          stepIndex={game.stepIndex}
          onCorrect={() => dispatch({ type: 'WORD_CORRECT' })}
          onMissed={() => dispatch({ type: 'WORD_MISSED' })}
          onSkip={() => dispatch({ type: 'SKIP_WORD' })}
        />
      )}

      {game.screen === 'practice' && (
        <SoundPracticeScreen sound={sound} mode="retry" onDone={() => dispatch({ type: 'PRACTICE_DONE' })} />
      )}

      {game.screen === 'finish' && (
        <FinishScreen
          sound={sound}
          treatGiven={game.treatGiven}
          shelf={shelf}
          justFilled={justFilled}
          onGive={giveTreat}
          onFeed={() => dispatch({ type: 'OPEN_FEED' })}
          onPlayAgain={() => dispatch({ type: 'PLAY_AGAIN' })}
        />
      )}

      <DebugPanel onSetShelf={setShelf} />
    </div>
  )
}
