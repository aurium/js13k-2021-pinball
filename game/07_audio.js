const speechSynthesis = isMainThread && window.speechSynthesis
let voiceEN
let audioCtx

function TTS(text) {
  if (voiceEN) {
    const speak = new SpeechSynthesisUtterance(text)
    speak.voice = voiceEN
    speechSynthesis.speak(speak)
  }
}
if (isMainThread) window.TTS = TTS // DEBUG

function playTone(freq, start=0, iniGain=1, duration=1, freqEnd, freqEndSec, fadeDelay) {
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
  playTone(10, 0, .1, 99999) // keep the speaker warm
}

function initMusic() {
  mapFor(14, 28, 2, (f)=> playTone(f*100, f/25, .6, .3))
}

if (isMainThread) {
  //worker.on_play = args => playTone(...args)
  worker.on_playPinColision = (gain)=> {
    gain = abs(gain*2)**2
    if (gain > 1) gain = 1
    playTone(1200, 0, gain/5, .4)
    playTone(1500, 0, gain,   .2)
    playTone(8000, 0, gain/5, .2)
  }
  worker.on_playWallColision = (gain)=> {
    gain = (gain*2)**2
    if (gain > 1) gain = 1
    playTone( 500, 0, gain,   .3)
    playTone(1300, 0, gain/5, .3)
  }
}