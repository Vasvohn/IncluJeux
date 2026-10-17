import { useEffect, useRef, useState } from "react"
import { speak } from "./speech.js"

const GAMES = [
  { id: "memory", icon: "🃏", title: "Mémoire", speech: "Mémoire" },
  { id: "windows", icon: "🪟", title: "Fenêtres", speech: "Les fenêtres" },
]

export default function Home({ onPick }) {
  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  const lastRef = useRef(0)

  function choose(next = indexRef.current) {
    const now = Date.now()
    if (now - lastRef.current < 600) return
    lastRef.current = now
    onPick(GAMES[next % GAMES.length].id)
  }

  useEffect(() => {
    speak(GAMES[0].speech)
    function onKeyDown(event) {
      if (event.code !== "Space" && event.code !== "Enter") return
      event.preventDefault()
      choose()
    }
    window.addEventListener("keydown", onKeyDown)
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % GAMES.length
      indexRef.current = next
      setIndex(next)
      speak(GAMES[next].speech)
    }, 3500)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      clearInterval(timer)
    }
  }, [])

  const active = GAMES[index % GAMES.length]

  return (
    <div
      className="h-full w-full overflow-hidden bg-slate-950 text-white flex flex-col select-none"
      onPointerDown={(event) => {
        event.preventDefault()
        choose()
      }}
    >
      <p className="text-center text-4xl sm:text-6xl font-black text-yellow-300 pt-6">
        {active.icon} {active.title}
      </p>
      <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
        {GAMES.map((game, gameIndex) => (
          <div
            key={game.id}
            className={`rounded-3xl flex flex-col items-center justify-center border-4 border-slate-700 bg-slate-800 ${
              gameIndex === index % GAMES.length ? "scan-highlight" : ""
            }`}
          >
            <span className="text-8xl leading-none">{game.icon}</span>
            <span className="mt-4 text-4xl font-black">{game.title}</span>
          </div>
        ))}
      </div>
      <div className="m-3 rounded-3xl bg-yellow-400 text-slate-950 text-center text-4xl sm:text-5xl font-black py-5">
        APPUIE
      </div>
    </div>
  )
}
