// Shows the last speech try when the address has ?debug. For testing only.

import { useEffect, useState } from 'react'
import { DEBUG_ON } from '../speech/debug.js'
import { canRecognizeSpeech } from '../speech/recognition.js'

export function DebugPanel() {
  const [last, setLast] = useState(null)

  useEffect(() => {
    if (!DEBUG_ON) return
    const onDebug = (event) => setLast(event.detail)
    window.addEventListener('speakery-debug', onDebug)
    return () => window.removeEventListener('speakery-debug', onDebug)
  }, [])

  if (!DEBUG_ON) return null

  return (
    <aside className="debug" aria-label="Speech test info">
      <strong>Speech test</strong>
      <span>Browser can listen: {canRecognizeSpeech ? 'yes' : 'no'}</span>
      {last ? (
        <>
          <span>Wanted: {last.target}</span>
          <span>Heard: {last.heard || '(nothing)'}</span>
          <span>
            Result: {last.status}
            {last.code ? ` (${last.code})` : ''}
          </span>
        </>
      ) : (
        <span>Tap the mic to test.</span>
      )}
    </aside>
  )
}
