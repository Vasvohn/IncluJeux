import { useEffect, useRef, useState } from "react"
import { phrases, makeDeck } from "./themes.js"
import { speak } from "./speech.js"

const SPEEDS = [
  { value: 4500, label: "Lente" },
  { value: 3000, label: "Normale" },
  { value: 1800, label: "Rapide" },
]

const THEMES = [
  { key: "animaux", label: "Animaux" },
  { key: "transports", label: "Transports" },
  { key: "musique", label: "Musique" },
]

const PAIR_CHOICES = [
  { value: 2, label: "4 cartes" },
  { value: 4, label: "8 cartes" },
]

function playItems(cards, flipped, matched) {
  const items = []
  cards.forEach((card, index) => {
    if (matched.includes(index)) return
    const faceUp = flipped.includes(index)
    items.push({
      type: "card",
      index,
      scanSpeech: faceUp ? card.name : `Carte ${index + 1}`,
      banner: faceUp ? `${card.icon} ${card.name}` : `Carte ${index + 1}`,
    })
  })
  items.push({ type: "talk", scanSpeech: "Parler", banner: "Parler" })
  return items
}

function talkItems() {
  const items = phrases.map((phrase) => ({
    type: "phrase",
    phrase,
    scanSpeech: phrase.speech,
    banner: phrase.label,
  }))
  items.push({ type: "back", scanSpeech: "Retour au jeu", banner: "Retour au jeu" })
  return items
}

export default function MemoryGame({ onHome }) {
  const [themeKey, setThemeKey] = useState("animaux")
  const [pairCount, setPairCount] = useState(2)
  const [cards, setCards] = useState(() => makeDeck("animaux", 2))
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [mode, setMode] = useState("play")
  const [scanIndex, setScanIndex] = useState(0)
  const [scanSpeed, setScanSpeed] = useState(4500)
  const [paused, setPaused] = useState(false)

  const cardsRef = useRef(cards)
  const flippedRef = useRef(flipped)
  const matchedRef = useRef(matched)
  const modeRef = useRef(mode)
  const scanIndexRef = useRef(0)
  const pausedRef = useRef(false)
  const timersRef = useRef([])
  const lastSwitchRef = useRef(0)
  const activateRef = useRef(() => {})
  const themeRef = useRef(themeKey)
  const pairsRef = useRef(pairCount)

  cardsRef.current = cards
  flippedRef.current = flipped
  matchedRef.current = matched
  modeRef.current = mode
  themeRef.current = themeKey
  pairsRef.current = pairCount

  const items = mode === "talk" ? talkItems() : mode === "win" ? [] : playItems(cards, flipped, matched)
  const active = items.length ? items[scanIndex % items.length] : null

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  function later(fn, delay) {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
  }

  function currentItems() {
    if (modeRef.current === "talk") return talkItems()
    if (modeRef.current === "win") return []
    return playItems(cardsRef.current, flippedRef.current, matchedRef.current)
  }

  function announce(index = scanIndexRef.current) {
    const list = currentItems()
    if (!list.length) return
    const item = list[index % list.length]
    if (item) speak(item.scanSpeech)
  }

  function hold(ms, done) {
    pausedRef.current = true
    setPaused(true)
    later(() => {
      if (done) done()
      if (modeRef.current === "win") return
      pausedRef.current = false
      setPaused(false)
      later(() => {
        if (pausedRef.current || modeRef.current === "win") return
        announce()
      }, 1700)
    }, ms)
  }

  function startGame(nextTheme = themeRef.current, nextPairs = pairsRef.current) {
    clearTimers()
    pausedRef.current = false
    const deck = makeDeck(nextTheme, nextPairs)
    cardsRef.current = deck
    flippedRef.current = []
    matchedRef.current = []
    modeRef.current = "play"
    scanIndexRef.current = 0
    themeRef.current = nextTheme
    pairsRef.current = nextPairs
    setThemeKey(nextTheme)
    setPairCount(nextPairs)
    setCards(deck)
    setFlipped([])
    setMatched([])
    setMode("play")
    setScanIndex(0)
    setPaused(false)
    speak("Carte 1")
  }

  function openTalk() {
    modeRef.current = "talk"
    scanIndexRef.current = 0
    setMode("talk")
    setScanIndex(0)
    speak(phrases[0].speech)
  }

  function closeTalk() {
    modeRef.current = "play"
    scanIndexRef.current = 0
    setMode("play")
    setScanIndex(0)
    const first = playItems(cardsRef.current, flippedRef.current, matchedRef.current)[0]
    speak(first ? first.scanSpeech : "Retour au jeu")
  }

  function selectCard(index) {
    const deck = cardsRef.current
    const card = deck[index]
    if (!card) return
    if (matchedRef.current.includes(index)) return
    if (flippedRef.current.includes(index)) {
      speak(card.name)
      return
    }
    if (flippedRef.current.length >= 2) return

    const next = [...flippedRef.current, index]
    flippedRef.current = next
    setFlipped(next)
    speak(card.soundText || card.name)

    if (next.length < 2) {
      hold(2200)
      return
    }

    const [first, second] = next
    const same = deck[first].name === deck[second].name
    if (same) {
      hold(1600, () => {
        const updated = [...matchedRef.current, first, second]
        matchedRef.current = updated
        flippedRef.current = []
        setMatched(updated)
        setFlipped([])
        if (updated.length === deck.length) {
          modeRef.current = "win"
          pausedRef.current = true
          setMode("win")
          setPaused(true)
          speak("Bravo ! Tu as gagné !")
          return
        }
        speak(`Bravo ! ${deck[first].name}`)
      })
      return
    }

    hold(2600, () => {
      flippedRef.current = []
      setFlipped([])
      speak("On recommence")
    })
  }

  function activate() {
    const now = Date.now()
    if (now - lastSwitchRef.current < 600) return
    if (pausedRef.current && modeRef.current !== "win") return
    lastSwitchRef.current = now

    if (modeRef.current === "win") {
      startGame()
      return
    }

    const list = currentItems()
    if (!list.length) return
    const item = list[scanIndexRef.current % list.length]
    if (!item) return

    if (item.type === "card") selectCard(item.index)
    else if (item.type === "talk") openTalk()
    else if (item.type === "back") closeTalk()
    else if (item.type === "phrase") {
      if (item.phrase.text.startsWith("On rejoue")) {
        pausedRef.current = true
        setPaused(true)
        speak(item.phrase.text)
        later(() => startGame(), 1500)
        return
      }
      speak(item.phrase.text)
      hold(2400)
    }
  }

  activateRef.current = activate

  useEffect(() => {
    function onKeyDown(event) {
      if (event.code !== "Space" && event.code !== "Enter") return
      event.preventDefault()
      activateRef.current()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (paused || mode === "win") return undefined
    const id = setInterval(() => {
      if (pausedRef.current || modeRef.current === "win") return
      const list = currentItems()
      if (!list.length) return
      const next = (scanIndexRef.current + 1) % list.length
      scanIndexRef.current = next
      setScanIndex(next)
      speak(list[next].scanSpeech)
    }, scanSpeed)
    return () => clearInterval(id)
  }, [paused, mode, scanSpeed, cards, flipped, matched])

  useEffect(() => {
    speak("Carte 1")
    return () => clearTimers()
  }, [])

  function onSwitch(event) {
    if (event.target instanceof Element && event.target.closest("[data-caregiver]")) return
    event.preventDefault()
    activate()
  }

  const gridClass =
    mode === "talk"
      ? "grid-cols-2 grid-rows-3"
      : cards.length <= 4
        ? "grid-cols-2 grid-rows-2"
        : "grid-cols-2 grid-rows-4 sm:grid-cols-4 sm:grid-rows-2"

  return (
    <div
      className="h-full w-full overflow-hidden bg-slate-950 text-white flex flex-col select-none"
      onPointerDown={onSwitch}
    >
      <div
        data-caregiver
        className="flex flex-wrap items-center justify-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Accompagnant</span>
        <button type="button" onClick={onHome} className="px-3 py-1 rounded-full text-sm font-bold bg-slate-800 text-slate-200">
          Accueil
        </button>
        {SPEEDS.map((speed) => (
          <button
            key={speed.value}
            type="button"
            onClick={() => setScanSpeed(speed.value)}
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              scanSpeed === speed.value ? "bg-yellow-400 text-slate-950" : "bg-slate-800 text-slate-200"
            }`}
          >
            {speed.label}
          </button>
        ))}
        {THEMES.map((theme) => (
          <button
            key={theme.key}
            type="button"
            onClick={() => startGame(theme.key, pairCount)}
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              themeKey === theme.key ? "bg-yellow-400 text-slate-950" : "bg-slate-800 text-slate-200"
            }`}
          >
            {theme.label}
          </button>
        ))}
        {PAIR_CHOICES.map((choice) => (
          <button
            key={choice.value}
            type="button"
            onClick={() => startGame(themeKey, choice.value)}
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              pairCount === choice.value ? "bg-yellow-400 text-slate-950" : "bg-slate-800 text-slate-200"
            }`}
          >
            {choice.label}
          </button>
        ))}
      </div>

      <div className="text-center py-2 px-4">
        <p className="text-4xl sm:text-5xl font-black text-yellow-300 leading-none min-h-12">
          {mode === "win"
            ? "Bravo !"
            : paused && flipped.length
              ? flipped.map((index) => `${cards[index].icon} ${cards[index].name}`).join("  ")
              : active
                ? active.banner
                : ""}
        </p>
      </div>

      <div className={`flex-1 min-h-0 grid gap-3 px-3 ${gridClass}`}>
        {mode === "talk"
          ? phrases.map((phrase) => (
              <div
                key={phrase.label}
                className={`rounded-3xl flex items-center justify-center text-center text-3xl sm:text-4xl font-black border-4 border-slate-700 bg-slate-800 ${
                  active?.type === "phrase" && active.phrase === phrase ? "scan-highlight" : ""
                }`}
              >
                {phrase.label}
              </div>
            ))
          : cards.map((card, index) => {
              const faceUp = flipped.includes(index) || matched.includes(index) || mode === "win"
              const found = matched.includes(index) || mode === "win"
              const selected = active?.type === "card" && active.index === index
              return (
                <div
                  key={card.id}
                  className={`min-w-0 min-h-0 rounded-3xl flex flex-col items-center justify-center border-4 ${
                    found
                      ? "bg-green-800 border-green-300"
                      : faceUp
                        ? "bg-blue-800 border-blue-300"
                        : "bg-slate-800 border-slate-600"
                  } ${selected ? "scan-highlight" : ""}`}
                >
                  <span className="text-6xl sm:text-8xl leading-none">{faceUp ? card.icon : index + 1}</span>
                  <span className="mt-2 text-2xl sm:text-3xl font-black">
                    {faceUp ? card.name : "Carte"}
                  </span>
                </div>
              )
            })}
      </div>

      {mode !== "win" && mode !== "talk" ? (
        <div
          className={`mx-3 mt-3 rounded-3xl py-3 text-center text-3xl font-black border-4 ${
            active?.type === "talk" ? "scan-highlight border-yellow-200" : "bg-slate-800 border-slate-600"
          }`}
        >
          Parler
        </div>
      ) : null}

      {mode === "talk" ? (
        <div
          className={`mx-3 mt-3 rounded-3xl py-3 text-center text-3xl font-black border-4 ${
            active?.type === "back" ? "scan-highlight border-yellow-200" : "bg-slate-800 border-slate-600"
          }`}
        >
          Retour au jeu
        </div>
      ) : null}

      <div className="m-3 rounded-3xl bg-yellow-400 text-slate-950 text-center text-4xl sm:text-5xl font-black py-5">
        {mode === "win" ? "REJOUER" : paused ? "REGARDE" : "APPUIE"}
      </div>
    </div>
  )
}
