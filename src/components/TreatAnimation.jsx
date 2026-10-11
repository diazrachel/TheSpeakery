// Plays a step's Rive animation (like batter pouring into the liner) once,
// then calls onDone. If the file is missing or broken, it calls onDone right
// away, so the game just shows the finished sprite instead.
//
// A step opts in with `animation` in src/data/sounds.js:
//   animation: { file: '/assets/animations/cupcake.riv', name: 'pour' }
// `name` is the timeline animation's name in Rive. Add `artboard` if the file
// has more than one artboard.

import { Alignment, Fit, Layout, RuntimeLoader, useRive } from '@rive-app/react-canvas'
import riveEngineUrl from '@rive-app/canvas/rive.wasm?url'
import { useCallback, useEffect, useRef, useState } from 'react'
import './TreatAnimation.css'

// Load Rive's engine from our own files instead of the internet, so it still
// works on bad hackathon wifi.
RuntimeLoader.setWasmUrl(riveEngineUrl)

// Stop waiting if an animation never reports that it finished.
const LONGEST_ANIMATION_MS = 6000
// If the file hasn't loaded by the time it should play, skip it after this long.
const LOAD_GRACE_MS = 1500

export function TreatAnimation({ animation, playing, onDone }) {
  const [failed, setFailed] = useState(false)
  const done = useRef(false)
  const started = useRef(false)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  const finish = useCallback(() => {
    if (done.current || !started.current) return
    done.current = true
    onDoneRef.current?.()
  }, [])

  const { rive, RiveComponent } = useRive({
    src: animation.file,
    artboard: animation.artboard,
    animations: animation.name,
    autoplay: false,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onStop: finish,
    // If the animation is set to loop in Rive, treat the first loop as the end.
    onLoop: finish,
    onLoadError: () => setFailed(true),
  })

  // Start playing when the child gets the word right. If the file is still
  // loading, it plays as soon as it's ready. If it failed, skip to the sprite.
  useEffect(() => {
    if (!playing || done.current) return
    started.current = true
    if (failed) finish()
    else if (rive) rive.play(animation.name)
  }, [playing, rive, failed, animation.name, finish])

  // Don't keep the child waiting on a file that's slow to load.
  useEffect(() => {
    if (!playing) return
    const grace = setTimeout(() => {
      if (!rive) finish()
    }, LOAD_GRACE_MS)
    return () => clearTimeout(grace)
  }, [playing, rive, finish])

  useEffect(() => {
    if (!playing) return
    const safety = setTimeout(finish, LONGEST_ANIMATION_MS)
    return () => clearTimeout(safety)
  }, [playing, finish])

  return (
    <div className={`treat-anim ${playing ? 'treat-anim--playing' : ''}`} aria-hidden="true">
      <RiveComponent />
    </div>
  )
}
