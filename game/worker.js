"use strict";

Object.prototype.map = function(fn) { return Object.values(this).map(fn) }

const { sqrt, abs, sign } = Math
const log = (...args)=> console.log('🔵', ...args)
let points, levels, curLevel, gravity = { x:0, y:0 }
const balls = { 0: { r:3, x:50, y:50, vx:0, vy:0 } }

onmessage = function(e) {
  const [evName, payload] = e.data;
  if (on[evName]) on[evName](payload)
  else log('Unknown event', evName)
}

const on = {

  start(levelsData) {
    log('Starting!')
    levels = levelsData
    points = 0
    curLevel = levels[0]
    postMessage(['setLvl', 0])
    setInterval(tic, 8)
  },

  gravity(val) {
    gravity = val
  }

}

let ticCounter = 0
function tic() {
  ticCounter++
  updateFPS() // DEBUG
  balls.map(ball => {
    ball.vx += gravity.x/2000
    ball.vy += gravity.y/2000
    ball.vx *= 0.999
    ball.vy *= 0.999
    ball.x += ball.vx
    ball.y += ball.vy
    curLevel.pins.map(pin => actPinColision(ball, pin))
    curLevel.wallsV.map(wall => actVerticalWallColision(ball, wall))
    curLevel.wallsH.map(wall => actHorizontalWallColision(ball, wall))
  })
  if ((ticCounter%2) === 0) postMessage(['update', { balls }])
}

function actPinColision(ball, [x, y, r/*radius*/]) {
  let [dX, dY, dist, vec] = calcDist(ball, {x, y})
  let minDist = ball.r + r
  if (dist < minDist) {
    let absVel = hypotenuse(ball.vx, ball.vy) * .8
    ball.vx = absVel * vec.x
    ball.vy = absVel * vec.y
    ball.x = x + vec.x * minDist
    ball.y = y + vec.y * minDist
  }
}

// TODO: transformar isso em colizao contra retangulo
function actVerticalWallColision(ball, [x, y, length]) {
  let dist = ball.x - x
  if (abs(dist) < ball.r && y < ball.y && ball.y < (y+length)) {
    ball.vx *= -.8
    ball.x = x + sign(dist) * ball.r
  }
}

// TODO: transformar isso em colizao contra retangulo
function actHorizontalWallColision(ball, [x, y, length]) {
  let dist = ball.y - y
  if (abs(dist) < ball.r && x < ball.x && ball.x < (x+length)) {
    ball.vy *= -.8
    ball.y = y + sign(dist) * ball.r
  }
}

function calcDist(p1, p2) {
  let dX = p1.x - p2.x
  let dY = p1.y - p2.y
  let dist = hypotenuse(dX, dY)
  return [dX, dY, dist, { x:dX/dist, y:dY/dist }]
}

function hypotenuse(x, y) {
  return sqrt(x*x + y*y)
}

log('Worker was loaded!')
postMessage(['alive']) // Notify that this worker was loaded.

/* INI DEBUG FPS */
let fpsCounter = 0
let fpsLast = Date.now()
function updateFPS() {
  fpsCounter++
  if ((fpsCounter%10) === 0) {
    postMessage([ 'bakFPS', 1000 / ((Date.now() - fpsLast) / 10) ])
    fpsLast = Date.now()
  }
}
/* END DEBUG FPS */
