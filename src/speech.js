let frenchVoice = null

function pickVoice() {
  if (!("speechSynthesis" in window)) return
  const voices = window.speechSynthesis.getVoices()
  frenchVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("fr")) || null
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  pickVoice()
  window.speechSynthesis.addEventListener("voiceschanged", pickVoice)
}

export function speak(text) {
  if (!("speechSynthesis" in window) || !text) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "fr-FR"
  utterance.rate = 0.7
  if (frenchVoice) utterance.voice = frenchVoice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
