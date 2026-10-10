# The Speakery Agent Guide

This file guides coding agents working on our hackathon project. Explain your
work in plain language because some teammates are building their first project.

## What We're Building

The Speakery is a cozy bakery game that helps young kids practice speech sounds.
A child takes an order from our mascot, a green dragon, and then makes the
treat by saying words out loud. Speech recognition checks each attempt, and a
correct attempt moves the game forward.

The demo flow:

1. **Start screen** with the mascot and a Start button.
2. **Pick a sound:** R, S, or K. The demo supports only these three sounds.
3. **New order:** the mascot asks for a treat (for example, "One s’more, please!").
4. **Sound guide:** a mouth picture and a steps table show how to make the
   sound (`src/screens/SoundPracticeScreen.jsx`; text lives in
   `src/data/sounds.js`). It ends with "Now you try!": the child must say a
   short practice word (like "see" for S) before baking starts. The guide
   text is a draft an SLP should review.
5. **Baking steps:** each step asks the child to say a word that matches the
   real baking step ("Snap the cracker in half! Say 'snap'"). A correct attempt
   shows the next stage of the treat.
6. **Practice detour:** the first missed word gets a puzzled dragon and a
   retry. The second miss on the same word sends the child back to the sound
   guide to practice the sound, then back to that same word.
7. **Finish:** celebration screen, then the child gives the treat to the mascot.

Two more areas sit outside the main flow:

- **Practice book:** a book button, placed in the top right of the screen, opens
  a place where kids can read and practice sounds and words whenever they want.
- **Parent section:** a parents-only area where parents choose how practice
  works for their child and find helpful speech resources.

Finish the main flow first, then the practice book, then the parent section.

## Things Specific to This Project

### The audience is young children

- Keep text short and simple. Many players can't read well yet, so every
  prompt also needs a play-audio button.
- Use big buttons, big text, and few choices per screen.
- Never use failure language such as "wrong," "fail," or "try harder," and
  never use red X's or buzzer sounds. Missed attempts lead to gentle practice
  ("Let's practice together!").
- The team chose to require a correct sound practice before baking, with no
  skip button for kids. After 3 misses the dragon offers "Grown-up help": a
  grown-up presses and holds for 3 seconds to unlock "Let's bake anyway"
  (`src/components/GrownUpHelp.jsx`). Keep the Y/N/M demo keys working, and keep
  the "Keep going" button for browsers that can't listen at all. Don't add a
  kid-facing skip without asking the team.

### This supports practice and is not therapy

- Don't diagnose, grade, or score a child's speech in a way that sounds
  clinical. Don't add copy claiming the game treats speech conditions.
- The game is a fun supplement to practice that a speech-language pathologist
  (SLP) or parent chooses.

### Voice data and privacy

- Children's voices are private data. Don't save, upload, or log audio
  recordings or transcripts beyond what's needed to check the current attempt.
- Never put a child's audio or speech results in console logs, analytics, or
  error reports.
- Ask for microphone access with a clear, friendly explanation first. If
  access is denied, show a helpful screen explaining how to turn it on.

### Speech recognition is unreliable

- Expect noisy rooms, quiet voices, and kids who pause or stretch words.
  Speech recognition models trained on adults often mishear children.
- Always show a listening state, such as the animated waveform, so the child
  knows the game heard them.
- Handle timeouts, no speech detected, and service errors with a gentle retry.
- Keep a demo fallback (for example, a hidden keyboard shortcut or a tap to
  continue) so the live demo still works if recognition fails.
- Holding a sound ("ssssss") and saying a word ("sauce") are different checks.
  Keep that difference clear in the code.

### Word lists

- Keep practice words for R, S, and K in one data file, separate from game
  logic, so the team can edit them without touching code.
- Each word should focus on one target sound. Avoid words that mix our
  practice sounds. "Sprinkle," for example, has S, R, and a K sound.
- Use short, familiar, kid-friendly baking words, and make each word match
  what really happens at that step (S: s'more, R: cinnamon roll, K: cupcake).
- Every word has a `marked` version in `src/data/sounds.js` with {braces}
  around the letters that make the target sound (like '{c}a{k}e'). The game
  highlights those letters, and the turtle button reads just the word slowly.
  Update `marked` whenever a word changes.
- After a missed word, the dragon gives a tip (`src/game/coach.js`). Each word
  lists `nearMisses`: real words the browser writes when a child swaps the
  sound ("way" for "ray", "tea" for "key"), grouped by which tip in the
  sound's `coach` fits. Anything else gets the sound's `general` tip. The
  browser hears words, not sounds, so this catches common swaps only. Keep
  tips warm and short, never clinical, and only show near-miss words from the
  list on screen, never anything else the browser heard.
- `src/game/wordCheck.js` decides what counts as saying the word: only the
  browser's best final guess, never a near-miss word, and a confidence floor
  (`MIN_CONFIDENCE`, check it with `?debug`). Keep these rules in that file.
- Don't change the word lists without asking the team.

### Practice book

- The book button should be on every game screen, in the same spot, and be
  big enough for small fingers. Give it a clear label for screen readers.
- Inside, organize practice by sound (R, S, K). Each word gets a picture,
  large text, a play-audio button, and a try-it microphone button.
- The practice book uses the same word list data file and practice screens as
  the in-game practice detour. Don't build a second copy of either.
- Opening the book pauses the game, and closing it returns the child to the
  same step without losing progress.

### Parent section

- Put the parent section behind a simple parent gate, such as a question a
  young child can't easily answer. This is only to stop accidental taps, so
  don't build accounts, logins, or passwords for the demo.
- Parents can change how practice works for their child, such as which sounds
  are practiced. Ask the team before adding new settings beyond what they've
  decided.
- Save parent settings on the device only. Don't send them to a server.
- Resources for parents must be real, trustworthy sources, such as ASHA (the
  American Speech-Language-Hearing Association). Never invent links,
  organizations, or advice. Check that every link works.
- Parent-facing text can be more detailed than kids' text, but keep it
  friendly and plain. Encourage parents to work with a speech-language
  pathologist, and don't make medical claims.
- Kid-facing screens should never show parent settings or parent text.

### Look and feel

- Cozy, soft, warm bakery style: cream backgrounds, rounded shapes, gentle
  animation, and purple as the main accent color for buttons and highlights.
- Follow the team's art kit doc ("The Speakery Art Kit") for colors, asset
  names, sizes, and folders. Build screens from those image assets, not from
  CSS shapes or SVG drawings.
- **The mascot is a green dragon** drawn by a teammate. Use only the team's
  drawings of it. Never redraw, restyle, or recolor it, and don't copy the
  purple character from older mockups.
- The dragon's body is the teammate's drawing with the face removed
  (`public/assets/dragon/body/`). Its eyes, brows, and mouth are drawn on top
  in `src/components/Dragon.jsx`, matching the original face's style, so they
  can change with each mood. When reacting to a missed word, the dragon looks
  curious or puzzled, never sad.
- Use the mockups as a guide, but follow this file when they disagree.

## Tech Stack and Commands

- **Framework:** React + Vite, plain JavaScript (no TypeScript).
- **Speech recognition:** the browser's built-in Web Speech API, wrapped in
  `src/speech/`. No API key. Works in Chrome, Edge, and Safari, not Firefox.
- **Read-aloud:** recorded ElevenLabs mp3s in `public/assets/voice/`, played by
  `src/speech/speak.js`, with the browser's built-in voice as the fallback for any
  line that isn't recorded. Every spoken line lives in `src/speech/lines.js`;
  don't put spoken text straight into screens.
  `speak()` returns a promise that finishes when the line ends. To move on after
  the dragon talks, use `useAfterSpeech` so the voice never gets cut off. After changing lines, a teammate
  runs `npm run voice` (it needs their ElevenLabs key in `.env`). Never ask for,
  print, or commit the key.
- **Hosting:** TODO. Ask a teammate before setting anything up.
- **Commands:** `npm install`, `npm run dev`, `npm run lint`, `npm run build`.

Don't guess anything still marked TODO. Ask a teammate.

## Team

- **Altynai:** frontend
- **Cam:** frontend
- **Ben:** sound effects and audio, helps with backend
- **Rachel:** project lead

When a task touches someone else's area, mention it so they know.

## Before Making Changes

1. Read this file and `README.md`.
2. Inspect the relevant code before suggesting a solution.
3. Check for existing teammate changes and preserve them.
4. Briefly explain what you plan to change and why.
5. Ask a teammate when a product decision is unclear or would change the main
   idea. Handle routine coding choices yourself.

Do not invent requirements, APIs, environment variables, test results, or
completed features. Say clearly when something is planned, mocked, assumed, or
not yet tested.

## How to Build

- Make the smallest complete change that solves the current task.
- Follow the patterns already used in the project.
- Use clear names, small functions, and helpful error messages.
- Reuse existing components before adding new ones.
- Keep game logic (steps, word checks, progress) separate from screens and from
  speech recognition calls.
- Avoid unnecessary libraries, large rewrites, and clever code teammates will
  struggle to explain.
- Remove debugging output and dead code created during the task.
- Never edit generated files or dependency lockfiles by hand.

## Web Experience

- The game must work on phones first, since that's how we'll demo it. It
  should also work on desktop.
- Use semantic HTML and make every button usable with a keyboard and touch.
- Keep focus visible and text readable. Don't use color as the only signal.
- Show useful loading, listening, success, and error states.
- Prevent double taps from skipping steps or submitting twice.
- Do not leave fake buttons, broken links, or silent errors in the demo.

## Data and Security

- Validate data from users, the speech recognition service, and any AI output.
- Keep API keys in ignored environment files. Put only safe placeholder names
  in `.env.example`.
- Never display or log API keys, tokens, or full environment files.
- Collect and store only what the demo needs. For this project, that means
  storing no personal data.

## Testing Your Work

Use the commands in `README.md` or the project's package scripts. Run the
checks related to your change, then play the affected part of the game like a
real user.

For meaningful changes, check what applies:

- formatting, linting, and type checking;
- the normal path for each sound (R, S, K) and one missed attempt;
- microphone denied, and recognition timing out or failing;
- opening and closing the practice book mid-game without losing progress;
- the parent gate, and parent settings changing what the child practices;
- phone and desktop layouts;
- keyboard navigation and visible focus;
- browser errors and failed network requests;
- the production build before a demo or deployment.

Never say a check passed unless you ran it successfully. If a check cannot run,
explain what blocked it and what remains untested. Do not disable tests, types,
or linting just to make an error disappear.

## Working With Teammates and Git

Our team pushes directly to `main` instead of using branches and pull requests,
so be careful:

- Before editing, check `git status` and pull the latest `main`.
- Do not overwrite, delete, or reformat unrelated teammate work.
- Before committing, show the teammate what changed and how it was tested.
- Do not commit, push, merge, deploy, create paid resources, or submit the
  project unless a teammate explicitly asks.
- Never force-push.
- If Git reports a conflict, stop and explain it in plain words. Preserve both
  teammates' work until the intended result is understood.
- Never commit secrets, `.env` files, dependencies, build output, logs, audio
  recordings, or editor files.
- Don't expect teammates to know Git commands. Run them yourself when allowed,
  and explain what each one did in one sentence.

## How Agents Should Communicate

- Lead with the result or the current blocker.
- Use plain language and explain unfamiliar terms briefly.
- Give teammates commands only when they need to run them themselves.
- Do the authorized work instead of returning a long tutorial or generic plan.
- When blocked, investigate first. Then leave a short handoff describing the
  evidence, what remains, and the safest next step.

## Done Means

The requested behavior works for R, S, and K. The relevant checks pass, and
the affected part of the game was played through. Missed attempts and
recognition errors are handled gently. No audio or personal data is stored.
Unrelated work is untouched. Setup instructions and `.env.example` are updated
when needed.
