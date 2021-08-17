const isMobile = navigator.userAgent.toLowerCase().match(/mobile/i)
const scrOrient = screen.orientation || {}
const getRotate = ()=> scrOrient.angle

const promiseTimeout = (ms)=> new Promise(resolve => setTimeout(resolve, ms))
const promiseAfterScreenUpdate = ()=> new Promise(resolve =>
  requestAnimationFrame(()=>
    requestAnimationFrame(resolve)
  )
)

const values = Object.values
const { stringify, parse } = JSON
const {PI, sin, cos, round, min, max, sqrt, abs, atan2} = Math
const log = (...args)=> console.log('🔷', ...args)
const rnd = (lim1=1, lim2=null)=> {
  if ( lim2 === null ) [lim1, lim2] = [0, lim1]
  return Math.random() * (lim2-lim1) + lim1
}
const rndI = (lim1, lim2)=> floor(rnd(lim1, lim2))
const hypotenuse = (x, y)=> sqrt(x*x + y*y)
const doc = document
const body = doc.body
const html = doc.documentElement
const $ = (sel)=> doc.querySelector(sel)
const canvasFloor = $('#floor')
const canvasShadow = $('#shadow')
const canvasPieces = $('#pieces')
let ctxFloor = canvasFloor.getContext('2d')
let ctxShadow = canvasShadow.getContext('2d')
let ctxPieces = canvasPieces.getContext('2d')

let zoom = 1
let hMid = 0
let u=1, w=1, h=1, vw=1, vh=1, screenRatio = 5/3
let floorIncX=0, floorIncY=0
let balls = {}
window.ctx = ctxPieces // DEBUG

if (navigator.wakeLock) {
  navigator.wakeLock.request()
  .then(()=> log('Screen locked!'))
  .catch(err=> console.log('Cant lock!', err.message)) // Intentional. console.log will not be removed in production.
} else {
  log('This browser has no WakeLock feature')
}

log('Building worker!')
const worker = new Worker('worker.js?cache=#BUILD#')
worker.onerror = (err)=> alert('Worker fail.\n\n' + err.message)

worker.onmessage = (ev)=> {
  const [evName, payload] = ev.data;
  //log('Worker msg:', evName)
  if (worker['on_'+evName]) worker['on_'+evName](payload)
  else log('Unknown event', evName)
}

worker.$ = (evName, payload)=> worker.postMessage([evName, payload])

let workerIsAlive = 0
worker.on_alive = ()=> workerIsAlive = 1

/* DEBUG INI Stats */
window.stats = { begin(){}, end(){} }
window.statBli = { update(){} }
import('https://mrdoob.github.io/stats.js/build/stats.module.js').then(mod => {
  const Stats = mod.default
  window.stats = new Stats()
	window.statBli = stats.addPanel( new Stats.Panel( 'back', '#ff8', '#221' ) )
	document.body.appendChild(stats.dom)
  values(stats.dom.children).map(c => {
    c.style.position = 'relative'
    c.style.display = 'inline-block'
  })
})
/* DEBUG END */
