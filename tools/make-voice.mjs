// Records every line the game says, using ElevenLabs, and saves the mp3s in
// public/assets/voice/. Run it with:  npm run voice
//
// It reads your API key from the .env file in the project folder (never
// uploaded, never printed). Lines that are already recorded with the same
// voice are skipped, so running it again only records new or changed lines.
//
// Options:
//   npm run voice -- --all   re-record everything (for example, after picking a new voice)

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { allVoiceLines } from '../src/speech/lines.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VOICE_DIR = join(ROOT, 'public', 'assets', 'voice')
const MANIFEST_PATH = join(VOICE_DIR, 'manifest.json')
const DEFAULT_MODEL = 'eleven_multilingual_v2'

main().catch((error) => {
  console.error(`\n${error.message}`)
  process.exit(1)
})

async function main() {
  const env = { ...readDotEnv(join(ROOT, '.env')), ...process.env }
  const apiKey = env.ELEVENLABS_API_KEY?.trim()
  const voiceId = env.ELEVENLABS_VOICE_ID?.trim()
  const model = env.ELEVENLABS_MODEL?.trim() || DEFAULT_MODEL
  const baseUrl = (env.ELEVENLABS_BASE_URL?.trim() || 'https://api.elevenlabs.io').replace(/\/$/, '')
  const redoAll = process.argv.includes('--all')

  if (!apiKey || !voiceId) {
    throw new Error(
      'Missing settings. Copy .env.example to a new file named .env, then fill in\n' +
        'ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID. See README.md, "Recording the voice".',
    )
  }

  mkdirSync(VOICE_DIR, { recursive: true })
  const old = readManifest()
  const sameVoice = old.voiceId === voiceId && old.model === model
  const lines = allVoiceLines()
  const manifest = { voiceId, model, lines: {} }

  let recorded = 0
  let skipped = 0
  console.log(`Recording ${lines.length} lines with voice ${voiceId} (${model})…\n`)

  for (const [index, text] of lines.entries()) {
    const file = fileNameFor(text)
    const alreadyDone = !redoAll && sameVoice && old.lines?.[text] === file && existsSync(join(VOICE_DIR, file))
    if (alreadyDone) {
      manifest.lines[text] = file
      skipped++
      continue
    }

    const audio = await textToSpeech({ baseUrl, apiKey, voiceId, model, text })
    writeFileSync(join(VOICE_DIR, file), audio)
    manifest.lines[text] = file
    recorded++
    console.log(`  ${String(index + 1).padStart(3)}/${lines.length}  ${shorten(text)}`)
    // Save as we go, so a stopped run keeps what it finished.
    writeManifest(manifest)
  }

  // Remove recordings for lines the game no longer says.
  const keep = new Set(Object.values(manifest.lines))
  for (const file of Object.values(old.lines ?? {})) {
    if (!keep.has(file) && existsSync(join(VOICE_DIR, file))) rmSync(join(VOICE_DIR, file))
  }

  writeManifest(manifest)
  console.log(`\nDone. Recorded ${recorded}, already had ${skipped}. Files are in public/assets/voice/.`)
}

async function textToSpeech({ baseUrl, apiKey, voiceId, model, text }) {
  const url = `${baseUrl}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`
  for (let attempt = 1; attempt <= 4; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: model }),
    })

    if (response.ok) return Buffer.from(await response.arrayBuffer())

    const details = await response.text().catch(() => '')
    if (response.status === 401 || response.status === 403) {
      throw new Error(`ElevenLabs didn't accept the API key (${response.status}). Check ELEVENLABS_API_KEY in .env.\n${details}`)
    }
    if (response.status === 404 || response.status === 422) {
      throw new Error(
        `ElevenLabs couldn't use this voice or model (${response.status}). Check ELEVENLABS_VOICE_ID and ELEVENLABS_MODEL in .env.\n${details}`,
      )
    }
    const canRetry = response.status === 429 || response.status >= 500
    if (!canRetry || attempt === 4) {
      throw new Error(`ElevenLabs returned an error (${response.status}) for: "${shorten(text)}"\n${details}`)
    }
    const waitMs = 2000 * attempt
    console.log(`  (busy, trying again in ${waitMs / 1000}s…)`)
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
}

// A readable, unique file name for each line, like "yay-you-did-it-1a2b3c4d.mp3".
function fileNameFor(text) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
    .replace(/-$/, '')
  const hash = createHash('sha1').update(text).digest('hex').slice(0, 8)
  return `${slug || 'line'}-${hash}.mp3`
}

function readManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function writeManifest(manifest) {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
}

// Reads KEY=value lines from .env (no extra packages needed).
function readDotEnv(path) {
  if (!existsSync(path)) return {}
  const values = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
  return values
}

function shorten(text) {
  return text.length > 60 ? `${text.slice(0, 57)}…` : text
}
