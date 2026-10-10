# The Speakery

A cozy bakery game where kids practice the R, S, and K sounds. The child says
magic words out loud, and each correct word bakes the next part of the treat.

## Run it

You need [Node.js](https://nodejs.org) installed.

```
npm install
npm run dev
```

Then open the link it prints (usually http://localhost:5173) in **Google Chrome**.
Chrome and Edge can listen to speech. Safari only works if Dictation is on in
Mac settings. Firefox, Brave, and Arc can't listen.

Other commands:

- `npm run lint` checks the code for mistakes
- `npm run build` makes the final version for hosting (in `dist/`)

## Demo backup

If speech recognition acts up during the live demo, tap the mic and then press
**Y** on the keyboard to count the word as correct, **N** to count it as missed,
or **M** to count it as a near miss (like hearing "way" for "ray"), so the dragon
gives a coaching tip.
Kids can also always tap "Keep baking" on the practice screen.

## Where things live

| What | Where |
| --- | --- |
| Practice words, treats, and tips | `src/data/sounds.js` |
| Game rules (what happens next) | `src/game/gameReducer.js` |
| Listening and talking | `src/speech/` |
| Screens | `src/screens/` |
| Dragon, buttons, mic | `src/components/` |
| Colors and animations | `src/styles.css` |
| Art and sounds | `public/assets/` |

## Adding art

The bakery, counter, and treats are stand-in SVG pictures in the art kit style.
To swap in final art, drop a file into `public/assets/` and point to it:

- Backgrounds: `backgrounds/bg-kitchen.svg` and `backgrounds/bg-counter.svg`
  (used in `src/styles.css`)
- Treats: `treats/treat-smore-1.svg` to `-5`, `treat-roll-1` to `-5`,
  `treat-cupcake-1` to `-5`. Picture 1 is the start, and each word adds the next.
  Paths are set in `src/data/sounds.js`. `tools/make_treats.py` redraws the stand-ins.

The dragon's body is `dragon/body/dragon-body-faceless.png` (the original drawing
is `dragon/dragon-original.png`). Its expressions are drawn in
`src/components/Dragon.jsx`. If the team draws face pieces or finishes the Rive
animation, that's the one file to change.

## Recording the voice (ElevenLabs)

The game can use natural ElevenLabs voices instead of the robotic browser voice.
You record every line once, and the game plays the files. Until a line is
recorded, the game uses the browser voice for it, so nothing breaks.

1. Make an account at [elevenlabs.io](https://elevenlabs.io).
2. Create an API key: click your profile, then **API Keys**. Copy it somewhere safe.
   Don't paste it in chats or into the code.
3. Pick a voice: open **Voices**, choose a warm, friendly one, and copy its **Voice ID**.
4. In Terminal, in the project folder, run:
   ```
   cp .env.example .env
   open -e .env
   ```
   Paste your key after `ELEVENLABS_API_KEY=` and the voice ID after
   `ELEVENLABS_VOICE_ID=`, then save. The `.env` file stays on your computer and
   is never uploaded (it's in `.gitignore`).
5. Record everything:
   ```
   npm run voice
   ```
   The mp3s land in `public/assets/voice/`. Then run `npm run dev` and listen.

There are 116 lines (about 7,100 characters, which is what ElevenLabs counts).
Rerunning only records new or changed lines, so it costs much less.
Running it again only records new or changed lines. To switch voices, change
`ELEVENLABS_VOICE_ID` and run `npm run voice -- --all`.

All spoken lines live in `src/speech/lines.js`. If you change a line or a word
in `src/data/sounds.js`, run `npm run voice` again to record it.

## Testing speech

Open http://localhost:5173/?debug to see what the browser heard on each try,
and why a try failed. Nothing is saved; it only shows the latest try.
