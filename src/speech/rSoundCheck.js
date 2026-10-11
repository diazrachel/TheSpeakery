// Listens to HOW the R was said, not just which word the browser heard.
//
// The browser's speech recognition "fixes" a W-for-R swap: a child saying
// "bwown" usually comes back as "brown". So for R words we also look at the
// sound itself. A real R has a famous fingerprint: one of the voice's
// resonances (called F3, the third formant) dips down low during the R.
// A W doesn't make that dip. We compare F3 at the start of the word (where
// the R is in all our R words) with F3 later in the word (the vowel).
//
// This is a sound-science heuristic, not a speech test. When it isn't sure,
// it says 'unsure' and the game goes with the browser's answer.
//
// Privacy: the audio is only kept in memory for this one try, analyzed, and
// then thrown away. Nothing is saved, uploaded, or logged.

// F3 at the start divided by F3 in the vowel. A real R dips well below 1.
// At or below R_MAX it counts as an R. At or above W_MIN it sounds like a W.
// In between, we're not sure. Tune with ?debug (it shows this number).
export const R_MAX = 0.82
export const W_MIN = 0.85

const TARGET_RATE = 11025
const FRAME_MS = 30
const HOP_MS = 10
const LPC_ORDER = 12
// How far F3 may move between frames (10 ms apart) while we follow it.
const MAX_STEP = 0.12

// samples: Float32Array of the child's try. Returns
// { verdict: 'r' | 'w' | 'unsure', ratio, frames }.
export function checkRSound(samples, sampleRate) {
  const { signal, rate } = downsample(samples, sampleRate)
  const frames = voicedFrames(signal, rate)
  if (frames.length < 12) return { verdict: 'unsure', ratio: null, frames: frames.length }

  const analyzed = frames.map((frame) => formantsOf(frame, rate))
  const n = analyzed.length
  const vowelStart = Math.round(n * 0.45)
  const vowelEnd = Math.round(n * 0.85)
  const vowelF3s = analyzed.slice(vowelStart, vowelEnd).map(thirdFormant).filter(Boolean)
  if (vowelF3s.length < 3) return { verdict: 'unsure', ratio: null, frames: n }
  const vowelF3 = percentile(vowelF3s, 0.5)

  // Follow F3 backward from the vowel to the start of the word, frame by frame,
  // so we stay on the same resonance even when it dips close to F2 in an R.
  let tracked = vowelF3
  const onsetF3 = []
  const onsetEnd = Math.max(3, Math.round(n * 0.35))
  for (let i = vowelStart; i >= 0; i--) {
    const near = analyzed[i].filter((f) => f > 1000 && Math.abs(f - tracked) <= tracked * MAX_STEP)
    if (near.length) tracked = near.reduce((a, b) => (Math.abs(b - tracked) < Math.abs(a - tracked) ? b : a))
    if (i < onsetEnd && near.length) onsetF3.push(tracked)
  }

  // Second opinion: the plain "third formant" in each start frame, which
  // catches quick dips that are too fast to follow.
  const plainOnset = analyzed.slice(0, onsetEnd).map(thirdFormant).filter(Boolean)
  const lows = onsetF3.length >= 3 ? [percentile(onsetF3, 0.2)] : []
  if (plainOnset.length >= 3) lows.push(percentile(plainOnset, 0.2))
  if (!lows.length) return { verdict: 'unsure', ratio: null, frames: n }

  // Use whichever shows the deeper dip, so a real R is never missed.
  const ratio = Math.min(...lows) / vowelF3
  const verdict = ratio <= R_MAX ? 'r' : ratio >= W_MIN ? 'w' : 'unsure'
  return { verdict, ratio: Math.round(ratio * 100) / 100, frames: n }
}

// ---------- Sound math (you shouldn't need to change anything below) ----------

// Cuts the sample rate to about 11 kHz (plenty for speech resonances).
function downsample(samples, sampleRate) {
  const factor = Math.max(1, Math.round(sampleRate / TARGET_RATE))
  if (factor === 1) return { signal: Float32Array.from(samples), rate: sampleRate }
  // Simple low-pass first (average over the factor), then keep every Nth sample.
  const out = new Float32Array(Math.floor(samples.length / factor))
  for (let i = 0; i < out.length; i++) {
    let sum = 0
    for (let k = 0; k < factor; k++) sum += samples[i * factor + k]
    out[i] = sum / factor
  }
  return { signal: out, rate: sampleRate / factor }
}

// Splits the sound into short frames and keeps the voiced part of the word.
function voicedFrames(signal, rate) {
  const size = Math.round((rate * FRAME_MS) / 1000)
  const hop = Math.round((rate * HOP_MS) / 1000)
  const frames = []
  for (let start = 0; start + size <= signal.length; start += hop) {
    const frame = signal.subarray(start, start + size)
    let energy = 0
    let crossings = 0
    for (let i = 0; i < size; i++) {
      energy += frame[i] * frame[i]
      if (i > 0 && frame[i - 1] < 0 !== frame[i] < 0) crossings++
    }
    frames.push({ frame, energy: energy / size, zcr: crossings / size })
  }
  if (!frames.length) return []
  const loudest = Math.max(...frames.map((f) => f.energy))
  // Voiced: loud enough (within 25 dB of the loudest) and not hissy.
  const voiced = frames.map((f) => f.energy > loudest * 0.003 && f.zcr < 0.25)

  // The longest stretch of voiced frames (small gaps allowed) is the word.
  let best = [0, -1]
  let runStart = -1
  let gap = 0
  for (let i = 0; i <= voiced.length; i++) {
    if (i < voiced.length && voiced[i]) {
      if (runStart < 0) runStart = i
      gap = 0
    } else if (runStart >= 0) {
      gap++
      if (gap > 6 || i === voiced.length) {
        const end = i - gap
        if (end - runStart > best[1] - best[0]) best = [runStart, end]
        runStart = -1
        gap = 0
      }
    }
  }
  return frames.slice(best[0], best[1] + 1).map((f) => f.frame)
}

// All the resonances (formants) of one frame, in Hz, lowest first.
function formantsOf(frame, rate) {
  const size = frame.length
  const x = new Float64Array(size)
  // Pre-emphasis and a Hamming window, the usual prep for formant tracking.
  for (let i = 0; i < size; i++) {
    const emphasized = frame[i] - 0.97 * (i > 0 ? frame[i - 1] : 0)
    x[i] = emphasized * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1)))
  }
  const coeffs = lpc(x, LPC_ORDER)
  if (!coeffs) return []
  return polynomialRoots(coeffs)
    .filter((r) => r.im > 0)
    .map((r) => ({
      freq: (Math.atan2(r.im, r.re) * rate) / (2 * Math.PI),
      bandwidth: (-Math.log(Math.hypot(r.re, r.im)) * rate) / Math.PI,
    }))
    .filter((f) => f.freq > 150 && f.freq < rate / 2 - 150 && f.bandwidth < 500)
    .map((f) => f.freq)
    .sort((a, b) => a - b)
}

// F3 from a frame's formants: the third one (F1 is usually under 1100 Hz).
function thirdFormant(formants) {
  const start = formants[0] < 1100 ? 0 : -1
  const candidate = formants[start + 2]
  return candidate && candidate > 1300 && candidate < 4200 ? candidate : null
}

// Linear prediction coefficients [1, a1, ..., ap] (Levinson-Durbin).
function lpc(x, order) {
  const r = new Float64Array(order + 1)
  for (let lag = 0; lag <= order; lag++) {
    let sum = 0
    for (let i = lag; i < x.length; i++) sum += x[i] * x[i - lag]
    r[lag] = sum
  }
  if (r[0] <= 0) return null
  r[0] *= 1.0001
  let a = new Float64Array(order + 1)
  a[0] = 1
  let error = r[0]
  for (let i = 1; i <= order; i++) {
    let acc = r[i]
    for (let j = 1; j < i; j++) acc += a[j] * r[i - j]
    const k = -acc / error
    const next = Float64Array.from(a)
    for (let j = 1; j < i; j++) next[j] = a[j] + k * a[i - j]
    next[i] = k
    a = next
    error *= 1 - k * k
    if (error <= 0) return null
  }
  return a
}

// Roots of 1 + a1 z^-1 + ... + ap z^-p (Durand-Kerner method).
function polynomialRoots(a) {
  const n = a.length - 1
  // As a polynomial in z: z^n + a1 z^(n-1) + ... + an
  const roots = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n + 0.4
    return { re: 0.9 * Math.cos(angle), im: 0.9 * Math.sin(angle) }
  })
  const evaluate = (z) => {
    let re = 1
    let im = 0
    for (let k = 1; k <= n; k++) {
      const nr = re * z.re - im * z.im + a[k]
      im = re * z.im + im * z.re
      re = nr
    }
    return { re, im }
  }
  for (let iter = 0; iter < 200; iter++) {
    let moved = 0
    for (let i = 0; i < n; i++) {
      const p = evaluate(roots[i])
      let dRe = 1
      let dIm = 0
      for (let j = 0; j < n; j++) {
        if (j === i) continue
        const diffRe = roots[i].re - roots[j].re
        const diffIm = roots[i].im - roots[j].im
        const t = dRe * diffRe - dIm * diffIm
        dIm = dRe * diffIm + dIm * diffRe
        dRe = t
      }
      const denom = dRe * dRe + dIm * dIm || 1e-12
      const stepRe = (p.re * dRe + p.im * dIm) / denom
      const stepIm = (p.im * dRe - p.re * dIm) / denom
      roots[i] = { re: roots[i].re - stepRe, im: roots[i].im - stepIm }
      moved = Math.max(moved, Math.hypot(stepRe, stepIm))
    }
    if (moved < 1e-9) break
  }
  return roots
}

function percentile(values, p) {
  const sorted = [...values].sort((x, y) => x - y)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))]
}
