import { useEffect, useRef, useState } from "react"
import { phrases, shuffleTheme } from "./themes.js"
import { speak, speakAll } from "./speech.js"

const phraseColors = [
  "bg-blue-700 hover:bg-blue-600 border-blue-400",
  "bg-green-700 hover:bg-green-600 border-green-400",
  "bg-purple-700 hover:bg-purple-600 border-purple-400",
  "bg-rose-700 hover:bg-rose-600 border-rose-400",
  "bg-pink-700 hover:bg-pink-600 border-pink-400",
  "bg-amber-700 hover:bg-amber-600 border-amber-400",
]

const SPEEDS = [
  { value: 3500, label: "Lente (3.5s)" },
  { value: 2500, label: "Normale (2.5s)" },
  { value: 1500, label: "Rapide (1.5s)" },
]

const THEME_BUTTONS = [
  { key: "animaux", label: "🐱 Animaux" },
  { key: "transports", label: "🚗 Transports" },
  { key: "musique", label: "🎵 Musique" },
]

function cardAnnouncement(card, faceUp, found) {
  if (found) return `Trouvé : ${card.name}`
  if (faceUp) return card.name
  return "Carte masquée"
}

export default function App() {
  const [themeKey, setThemeKey] = useState("animaux")
  const [cards, setCards] = useState(() => shuffleTheme("animaux"))
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [scanIndex, setScanIndex] = useState(0)
  const [scanSpeed, setScanSpeed] = useState(2500)
  const [scanEpoch, setScanEpoch] = useState(0)

  const cardsRef = useRef(cards)
  const flippedRef = useRef(flipped)
  const matchedRef = useRef(matched)
  const scanIndexRef = useRef(scanIndex)
  const lockRef = useRef(false)
  const timersRef = useRef([])
  const holdSpeech = useRef(false)

  cardsRef.current = cards
  flippedRef.current = flipped
  matchedRef.current = matched
  scanIndexRef.current = scanIndex

  const total = phrases.length + cards.length
  const activeIndex = total ? scanIndex % total : 0

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  function later(fn, delay) {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
  }

  function startGame(nextTheme) {
    clearTimers()
    lockRef.current = false
    const deck = shuffleTheme(nextTheme)
    cardsRef.current = deck
    flippedRef.current = []
    matchedRef.current = []
    scanIndexRef.current = 0
    setThemeKey(nextTheme)
    setCards(deck)
    setFlipped([])
    setMatched([])
    setScanIndex(0)
    setScanEpoch((n) => n + 1)
  }

  function selectCard(index) {
    if (lockRef.current) return
    const deck = cardsRef.current
    const card = deck[index]
    if (!card) return
    if (flippedRef.current.length >= 2) return
    if (flippedRef.current.includes(index) || matchedRef.current.includes(index)) return

    const next = [...flippedRef.current, index]
    flippedRef.current = next
    setFlipped(next)
    speak(card.soundText || card.name)

    if (next.length < 2) return

    lockRef.current = true
    const [first, second] = next
    const a = deck[first]
    const b = deck[second]

    if (a.name === b.name) {
      later(() => {
        const updated = [...matchedRef.current, first, second]
        matchedRef.current = updated
        flippedRef.current = []
        setMatched(updated)
        setFlipped([])
        lockRef.current = false
        speak(`Bravo ! Paire de ${a.name} trouvée !`)
        if (updated.length === deck.length) {
          later(() => speak("Félicitations ! La partie est terminée avec succès !"), 1500)
        }
      }, 800)
      return
    }

    later(() => {
      flippedRef.current = []
      setFlipped([])
      lockRef.current = false
    }, 1800)
  }

  function activateScan() {
    const deck = cardsRef.current
    const count = phrases.length + deck.length
    if (!count) return
    const index = scanIndexRef.current % count
    if (index < phrases.length) {
      speak(phrases[index].text)
      return
    }
    selectCard(index - phrases.length)
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.code !== "Space" && event.code !== "Enter") return
      event.preventDefault()
      activateScan()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (holdSpeech.current) {
      holdSpeech.current = false
      return undefined
    }
    if (!cards.length) return undefined
    const index = scanIndex % (phrases.length + cards.length)
    if (index < phrases.length) {
      speak(phrases[index].speech)
      return undefined
    }
    const cardIndex = index - phrases.length
    const card = cards[cardIndex]
    speak(cardAnnouncement(card, flipped.includes(cardIndex), matched.includes(cardIndex)))
    return undefined
  }, [scanIndex, scanEpoch])

  useEffect(() => {
    if (!cards.length) return undefined
    const id = setInterval(() => {
      setScanIndex((current) => current + 1)
    }, scanSpeed)
    return () => clearInterval(id)
  }, [scanSpeed, cards])

  useEffect(() => () => clearTimers(), [])

  return (
    <div className="bg-slate-900 text-white min-h-screen p-6 flex flex-col justify-between select-none">
      <header className="text-center mb-4">
        <h1 className="text-3xl font-extrabold text-yellow-400 mb-2">Jeu de Mémoire & Communication</h1>
        <p className="text-md text-slate-300 mb-3">
          Appuyez sur <kbd className="bg-slate-700 px-3 py-1 rounded text-yellow-300 font-bold">ESPACE</kbd> ou{" "}
          <span className="text-yellow-300 font-bold">CLIQUEZ</span> pour valider la sélection en cours.
        </p>
        <div className="inline-flex items-center bg-slate-800 border border-slate-700 rounded-xl p-2 gap-3 flex-wrap justify-center">
          <span className="text-sm font-semibold text-slate-300">⏱️ Vitesse du scan :</span>
          {SPEEDS.map((speed) => (
            <button
              key={speed.value}
              type="button"
              onClick={() => {
                setScanSpeed(speed.value)
                speak("Vitesse modifiée")
              }}
              className={`px-3 py-1 rounded text-sm font-bold ${
                scanSpeed === speed.value ? "bg-yellow-600 hover:bg-yellow-500" : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {speed.label}
            </button>
          ))}
        </div>
      </header>

      <section className="mb-4">
        <h2 className="text-lg font-bold text-slate-400 mb-2 text-center">Expression & Communication</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
          {phrases.map((phrase, index) => (
            <button
              key={phrase.label}
              type="button"
              onClick={() => speak(phrase.text)}
              className={`text-white text-lg font-bold py-3 px-2 rounded-xl shadow-lg border-2 ${phraseColors[index]} ${
                activeIndex === index ? "scan-highlight" : ""
              }`}
            >
              {phrase.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-4 text-center">
        <div className="inline-flex gap-2 flex-wrap justify-center">
          {THEME_BUTTONS.map((theme) => (
            <button
              key={theme.key}
              type="button"
              onClick={() => {
                holdSpeech.current = true
                startGame(theme.key)
                speakAll([`Thème ${theme.key} sélectionné`, phrases[0].speech])
              }}
              className={`px-4 py-1.5 border rounded-lg font-bold text-sm ${
                themeKey === theme.key
                  ? "bg-yellow-600 border-yellow-400"
                  : "bg-slate-800 border-slate-600 hover:bg-slate-700"
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </section>

      <main className="flex-grow flex items-center justify-center">
        <div id="grid" className="grid grid-cols-4 gap-6 max-w-4xl w-full">
          {cards.map((card, index) => {
            const faceUp = flipped.includes(index) || matched.includes(index)
            const found = matched.includes(index)
            const scanSlot = phrases.length + index
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => selectCard(index)}
                className={`border-4 rounded-2xl h-36 text-5xl flex items-center justify-center cursor-pointer shadow-2xl transition-all ${
                  found
                    ? "border-green-400 bg-green-950"
                    : faceUp
                      ? "bg-blue-900 border-slate-600"
                      : "bg-slate-800 border-slate-600"
                } ${activeIndex === scanSlot ? "scan-highlight" : ""}`}
              >
                <span className="sr-only">{cardAnnouncement(card, faceUp, found)}</span>
                {faceUp ? card.icon : "❓"}
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
