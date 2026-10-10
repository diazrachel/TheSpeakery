// The "how to make this sound" card: a mouth picture plus a table of steps.
// Used before baking (GuideScreen) and after a missed word (PracticeScreen).

import { LINES } from '../speech/lines.js'
import { speak } from '../speech/speak.js'
import { SpeakerIcon } from './icons.jsx'
import { MouthDiagram } from './MouthDiagram.jsx'
import { SpeakButton } from './ui.jsx'

export function SoundGuide({ sound }) {
  const { guide } = sound

  return (
    <section className="sound-guide" aria-label={`How to make the ${sound.letter} sound`}>
      <div className="sound-guide__picture">
        <MouthDiagram soundId={sound.id} />
        <button type="button" className="sound-guide__listen" onClick={() => speak(LINES.listenWords(sound))}>
          <SpeakerIcon size={22} /> Hear the sound
        </button>
      </div>

      <table className="guide-table">
        <caption className="visually-hidden">Steps for the {sound.letter} sound</caption>
        <tbody>
          {guide.rows.map((row, i) => (
            <tr key={row.part}>
              <th scope="row">
                <span className="guide-table__num" aria-hidden="true">
                  {i + 1}
                </span>
                {row.part}
              </th>
              <td>{row.text}</td>
              <td className="guide-table__hear">
                <SpeakButton text={LINES.guideRow(row)} label={`Hear step ${i + 1}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
