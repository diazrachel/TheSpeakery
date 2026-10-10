// Asks the browser for microphone permission before the first baking step,
// then turns the mic right back off. Nothing is recorded here.
// Returns 'granted', 'blocked', or 'unavailable'.

import { letMicSettle } from './speak.js'

export async function requestMicAccess() {
  if (!navigator.mediaDevices?.getUserMedia) return 'unavailable'
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    letMicSettle()
    return 'granted'
  } catch (error) {
    if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return 'blocked'
    return 'unavailable'
  }
}
