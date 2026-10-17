export const gifts = [
  { id: "couverture", icon: "🧣", label: "Couverture", say: "Une couverture" },
  { id: "graines", icon: "🌾", label: "Graines", say: "Des graines" },
  { id: "lampe", icon: "💡", label: "Lampe", say: "Une lampe" },
  { id: "chanson", icon: "🎵", label: "Chanson", say: "Une chanson" },
]

export const windows = [
  {
    who: "Chat",
    icon: "🐱",
    need: "J'ai froid",
    say: "Le chat a froid",
    gift: "couverture",
    yes: "Oui ! Le chat a chaud.",
  },
  {
    who: "Oiseau",
    icon: "🐦",
    need: "J'ai faim",
    say: "L'oiseau a faim",
    gift: "graines",
    yes: "Oui ! L'oiseau mange.",
  },
  {
    who: "Lune",
    icon: "🌙",
    need: "Il fait noir",
    say: "La lune dit : il fait noir",
    gift: "lampe",
    yes: "Oui ! La lumière est douce.",
  },
  {
    who: "Nuage",
    icon: "☁️",
    need: "Chante-moi",
    say: "Le nuage veut une chanson",
    gift: "chanson",
    yes: "Oui ! Le nuage s'endort.",
  },
]

export function mixGifts() {
  const list = [...gifts]
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}
