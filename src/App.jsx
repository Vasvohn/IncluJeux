import { useState } from "react"
import Home from "./Home.jsx"
import MemoryGame from "./MemoryGame.jsx"
import WindowsGame from "./WindowsGame.jsx"

export default function App() {
  const [game, setGame] = useState("home")
  if (game === "memory") return <MemoryGame onHome={() => setGame("home")} />
  if (game === "windows") return <WindowsGame onHome={() => setGame("home")} />
  return <Home onPick={setGame} />
}
