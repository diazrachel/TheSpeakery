// The big microphone button. While listening it pulses and shows a moving waveform.

import { MicIcon } from './icons.jsx'

const BAR_COUNT = 7

export function MicButton({ listening, disabled, onPress }) {
  return (
    <div className={`mic ${listening ? 'mic--listening' : ''}`}>
      <div className="mic__wave" aria-hidden="true">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <span key={i} style={{ '--i': i }} />
        ))}
      </div>
      <button
        type="button"
        className="mic__button"
        onClick={onPress}
        disabled={disabled || listening}
        aria-label={listening ? 'Listening' : 'Tap and say the word'}
      >
        <MicIcon size={46} />
      </button>
      <div className="mic__wave" aria-hidden="true">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <span key={i} style={{ '--i': BAR_COUNT - i }} />
        ))}
      </div>
      <p className="mic__label" aria-live="polite">
        {listening ? 'Listening…' : 'Tap and say it'}
      </p>
    </div>
  )
}
