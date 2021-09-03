const speechSynthesis = isMainThread && window.speechSynthesis
let voiceEN
let audioCtx

function TTS(text, rate=1) {
  if (voiceEN) {
    const speak = new SpeechSynthesisUtterance(text)
    speak.voice = voiceEN
    speak.rate = rate
    speechSynthesis.speak(speak)
  }
}
if (isMainThread) window.TTS = TTS // DEBUG

function postPlay(...tones) { // Helper for worker context
  postMessage(['play', tones])
}

function playTone(freq=2, start=0, iniGain=1, duration=1, freqEnd, freqEndSec, fadeDelay) {
  //log(freq, start, duration, freqEnd, freqEndSec, fadeDelay)
  setTimeout(()=> {
    const currTime = audioCtx.currentTime
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.frequency.value = 0
    oscillator.frequency.setValueAtTime(freq, currTime)
    oscillator.frequency.linearRampToValueAtTime(freqEnd||freq, currTime + (freqEndSec||duration))
    gainNode.gain.setValueAtTime(iniGain, currTime)
    gainNode.gain.linearRampToValueAtTime(0, currTime + (fadeDelay||duration))
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.start()
    setTimeout(()=> oscillator.disconnect(), (fadeDelay||duration)*1000)
  }, start*1000)
}
if (isMainThread) window.play = window.playTone = playTone // DEBUG

function initAudio() {
  voiceEN = speechSynthesis && speechSynthesis.getVoices().find(v=>v.lang=='en-US')
  audioCtx = new AudioContext()//({sampleRate: 8000})
  playTone() // Warm up speaker
}

function initMusic() {
  mapFor(14, 28, 2, (f)=> playTone(f*100, f/25, .6, .3))
}

if (isMainThread) {
  worker.on_play = tones => tones.map(tone => playTone(...tone))
}
