export const phrases = [
  { label: "🗣️ À toi !", speech: "À toi !", text: "À toi de jouer !" },
  { label: "👏 Bravo !", speech: "Bravo !", text: "Bravo !" },
  { label: "🤔 Un instant...", speech: "Un instant...", text: "Un instant, s’il te plaît." },
  { label: "🙋 Aide-moi !", speech: "Aide-moi !", text: "J’ai besoin d’aide." },
  { label: "❤️ J'adore !", speech: "J'adore !", text: "J’adore ce jeu !" },
  { label: "🔄 On rejoue ?", speech: "On rejoue ?", text: "On rejoue une partie ?" },
]

export const themes = {
  animaux: [
    { name: "Chat", icon: "🐱", soundText: "Miaoou ! Un chat" },
    { name: "Chien", icon: "🐶", soundText: "Ouafe ! Un chien" },
    { name: "Vache", icon: "🐮", soundText: "Meuh ! Une vache" },
    { name: "Coq", icon: "🐓", soundText: "Cocorico ! Un coq" },
  ],
  transports: [
    { name: "Voiture", icon: "🚗", soundText: "Vroom ! Une voiture" },
    { name: "Train", icon: "🚂", soundText: "Tchou tchou ! Le train" },
    { name: "Avion", icon: "✈️", soundText: "L’avion dans l’air" },
    { name: "Bateau", icon: "🚢", soundText: "Le bateau sur l’eau" },
  ],
  musique: [
    { name: "Piano", icon: "🎹", soundText: "Notes de piano" },
    { name: "Guitare", icon: "🎸", soundText: "Sons de guitare" },
    { name: "Tambour", icon: "🥁", soundText: "Roullement de tambour" },
    { name: "Trompette", icon: "🎺", soundText: "Son de trompette" },
  ],
}

export function shuffleTheme(themeKey) {
  const pairs = [...themes[themeKey], ...themes[themeKey]]
  for (let i = pairs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs.map((card, index) => ({ ...card, id: `${themeKey}-${card.name}-${index}` }))
}
