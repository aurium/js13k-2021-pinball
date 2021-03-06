const scopeShared = {}
const isMainThread = typeof(window) == 'object'
const isMobile = navigator.userAgent.toLowerCase().match(/mobile/i)
const scrOrient = isMainThread && screen.orientation || {}
const getRotate = ()=> scrOrient.angle

const promiseTimeout = (ms)=> new Promise(resolve => setTimeout(resolve, ms))
const promiseAfterScreenUpdate = ()=> new Promise(resolve =>
  requestAnimationFrame(()=>
    requestAnimationFrame(resolve)
  )
)
function mapFor(from, to, inc, mapper) {
  const result = []
  for (let i=from; i<=to; i+=inc) result.push(i)
  return result.map(mapper)
}

function trans(from, to, step /* value in [0..1] */) {
  return (from * (1-step)) + (to * step)
}

const values = Object.values
Object.prototype.map = function(fn) { return values(this).map(fn) }
const { stringify, parse } = JSON
const {PI, sin, cos, round, sign, min, max, sqrt, abs, atan2} = Math
const PI2 = PI * 2
const log = (...args)=> console.log(isMainThread?'1️⃣':'👷', ...args)
const rnd = (lim1=1, lim2=null)=> {
  if ( lim2 === null ) [lim1, lim2] = [0, lim1]
  return Math.random() * (lim2-lim1) + lim1
}
const rndI = (lim1, lim2)=> floor(rnd(lim1, lim2))
const hypotenuse = (x, y)=> sqrt(x*x + y*y)
const doc = isMainThread && document
const body = isMainThread && doc.body
const $ = isMainThread ? (sel)=> doc.querySelector(sel) : ()=>0
const wrapper = $('wrapper')
const canvasFloor = $('#floor')
const canvasShadow = $('#shadow')
const canvasPieces = $('#pieces')
const wallHalfExp = .75
const ballRay = 3
let ctxFloor, ctxShadow, ctxPieces
let gravity = { x:0, y:0, xi:0, yi:0 }
const gameBaseKey = '2021-aurium-spacepinball-'
const localStorageRecordKey = gameBaseKey+'record'
let points = 0, lives = 3, record = 0, ticCounter = 0

let hMid = 0
let u=1, w=1, h=1, vw=1, vh=1, inclinationVal = 0
const screenRatio = 5/3, hMax = 500/3, hCenter = hMax/2
let floorIncX=0, floorIncY=0
let balls = []

const pointsEl = isMainThread && $('pre')

function notify(text) {
  TTS(text)
  alert(text)
}
