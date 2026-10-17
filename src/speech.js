function utter(text) {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "fr-FR"
  utterance.rate = 0.85
  return utterance
}

export function speak(text) {
  if (!("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utter(text))
}

export function speakAll(texts) {
  if (!("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
  texts.forEach((text) => window.speechSynthesis.speak(utter(text)))
}
