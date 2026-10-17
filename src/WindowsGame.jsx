import { useEffect, useRef, useState } from "react"
import { speak } from "./speech.js"
import { mixGifts, windows } from "./windows.js"

const SPEEDS = [
  { value: 4500, label: "Lente" },
  { value: 3000, label: "Normale" },
  { value: 1800, label: "Rapide" },
]

export default function WindowsGame({ onHome }) {
  const [roundIndex, setRoundIndex] = useState(0)
  const [parade, setParade] = useState(() => mixGifts())
  const [scanIndex, setScanIndex] = useState(0)
  const [speed, setSpeed] = useState(4500)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)
  const [brought, setBrought] = useState(null)

  const scanRef = useRef(0)
  const pausedRef = useRef(false)
  const doneRef = useRef(false)
  const roundRef = useRef(0)
  const paradeRef = useRef(parade)
  const lastRef = useRef(0)
  const timersRef = useRef([])

  paradeRef.current = parade
  roundRef.current = roundIndex

  const round = windows[roundIndex]
  const slots = [...parade, { id: "encore", icon: "👂", label: "Encore", say: "Encore" }]
  const active = slots[scanIndex % slots.length]

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  function later(fn, delay) {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
  }

  function hold(ms, after) {
    pausedRef.current = true
    setPaused(true)
    later(() => {
      if (after) after()
      if (doneRef.current) return
      pausedRef.current = false
      setPaused(false)
    }, ms)
  }

  function beginRound(nextRound, nextParade = mixGifts()) {
    roundRef.current = nextRound
    paradeRef.current = nextParade
    scanRef.current = 0
    setRoundIndex(nextRound)
    setParade(nextParade)
    setScanIndex(0)
    setBrought(null)
    speak(windows[nextRound].say)
  }

  function restart() {
    clearTimers()
    doneRef.current = false
    pausedRef.current = false
    setDone(false)
    setPaused(false)
    beginRound(0)
  }

  function activate() {
    const now = Date.now()
    if (now - lastRef.current < 600) return
    if (pausedRef.current && !doneRef.current) return
    lastRef.current = now

    if (doneRef.current) {
      restart()
      return
    }

    const currentRound = windows[roundRef.current]
    const current = [...paradeRef.current, { id: "encore", say: "Encore" }][scanRef.current % (paradeRef.current.length + 1)]
    if (!current) return

    if (current.id === "encore") {
      speak(currentRound.say)
      hold(1800)
      return
    }

    if (current.id !== currentRound.gift) {
      speak(`${current.say}. Pas maintenant.`)
      hold(1600)
      return
    }

    setBrought(current)
    speak(currentRound.yes)
    const next = roundRef.current + 1
    hold(2400, () => {
      if (next >= windows.length) {
        doneRef.current = true
        pausedRef.current = true
        setDone(true)
        setPaused(true)
        speak("Bonne nuit. Toutes les fenêtres dorment.")
        return
      }
      beginRound(next)
    })
  }

  useEffect(() => {
    speak(windows[0].say)
    function onKeyDown(event) {
      if (event.code !== "Space" && event.code !== "Enter") return
      event.preventDefault()
      activate()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      clearTimers()
    }
  }, [])

  useEffect(() => {
    if (paused || done) return undefined
    const id = setInterval(() => {
      if (pausedRef.current || doneRef.current) return
      const count = paradeRef.current.length + 1
      const next = (scanRef.current + 1) % count
      scanRef.current = next
      setScanIndex(next)
      const slot = [...paradeRef.current, { say: "Encore" }][next]
      speak(slot.say)
    }, speed)
    return () => clearInterval(id)
  }, [paused, done, speed, parade, roundIndex])

  return (
    <div
      className="h-full w-full overflow-hidden bg-indigo-950 text-white flex flex-col select-none"
      onPointerDown={(event) => {
        if (event.target instanceof Element && event.target.closest("[data-caregiver]")) return
        event.preventDefault()
        activate()
      }}
    >
      <div
        data-caregiver
        className="flex flex-wrap items-center justify-center gap-2 px-3 py-2 bg-slate-950"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="text-xs font-bold uppercase tracking-wide text-indigo-200">Accompagnant</span>
        <button type="button" onClick={onHome} className="px-3 py-1 rounded-full text-sm font-bold bg-slate-800">
          Accueil
        </button>
        {SPEEDS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setSpeed(item.value)}
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              speed === item.value ? "bg-yellow-400 text-slate-950" : "bg-slate-800"
            }`}
          >
            {item.label}
          </button>
        ))}
        <div className="flex gap-2 ml-2">
          {windows.map((item, index) => (
            <span
              key={item.who}
              className={`text-2xl ${index < roundIndex || done ? "opacity-100" : index === roundIndex ? "opacity-100" : "opacity-30"}`}
            >
              {index < roundIndex || done ? "🌟" : item.icon}
            </span>
          ))}
        </div>
      </div>

      <p className="text-center text-4xl sm:text-6xl font-black text-yellow-300 px-4 pt-3 leading-none">
        {done ? "Bonne nuit" : round.need}
      </p>

      <div className="mx-4 mt-3 rounded-3xl bg-amber-100 text-slate-950 flex items-center justify-center gap-4 py-4 border-8 border-amber-300">
        <span className="text-6xl sm:text-7xl leading-none">{done ? "🏠" : round.icon}</span>
        <span className="text-3xl sm:text-5xl font-black">{done ? "Tout le monde dort" : round.who}</span>
        {brought && !done ? <span className="text-6xl leading-none">{brought.icon}</span> : null}
      </div>

      <div
        data-gift={active?.id || ""}
        data-need={round.gift}
        className={`flex-1 min-h-0 m-4 rounded-3xl flex flex-col items-center justify-center border-4 ${
          done ? "bg-indigo-900 border-indigo-400" : "scan-highlight border-yellow-200"
        }`}
      >
        <span className="text-8xl sm:text-9xl leading-none">{done ? "✨" : active.icon}</span>
        <span className="mt-3 text-4xl sm:text-6xl font-black">{done ? "Rejouer" : active.label}</span>
      </div>

      <div className="m-3 mt-0 rounded-3xl bg-yellow-400 text-slate-950 text-center text-4xl sm:text-5xl font-black py-5">
        {done ? "REJOUER" : paused ? "REGARDE" : "APPUIE"}
      </div>
    </div>
  )
}
