if (!isMainThread) { // Running in a WebWorker

const balls = { 0: { x:50, y:50, r:3, vx:0, vy:0 } }

onmessage = function(e) {
  const [evName, payload] = e.data;
  if (on[evName]) on[evName](payload)
  else log('Unknown event', evName)
}

const on = {

  start() {
    log('Starting!')
    points = 0
    curLevel = levels[0]
    postMessage(['setLvl', 0])
    setInterval(tic, 9)
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
  if ((ticCounter%2) === 0) postMessage(['update', {
    balls: balls.map(values)
  }])
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
    if (absVel > 0.01) postMessage(['playPinColision', absVel])
  }
}

// TODO: transformar isso em colizao contra retangulo
function actVerticalWallColision(ball, [x, y, length]) {
  let dist = ball.x - x
  if (abs(dist) < ball.r+1 && y < (ball.y+ball.r) && (ball.y+ball.r) < (y+length)) {
    if (y > ball.y) {
      //TODO: kick top
    } else if (ball.y > (y+length)) {
      //TODO: kick down
    } else {
      ball.vx *= -.8
      ball.x = x + sign(dist) * (ball.r+1)
    }
    if (abs(ball.vx) > 0.01) postMessage(['playWallColision', ball.vx])
  }
}

// TODO: transformar isso em colizao contra retangulo
function actHorizontalWallColision(ball, [x, y, length]) {
  let dist = ball.y - y
  if (abs(dist) < ball.r+1 && x < (ball.x+ball.r) && (ball.x+ball.r) < (x+length)) {
    if (x > ball.x) {
      //TODO: kick left
    } else if (ball.x > (x+length)) {
      //TODO: kick right
    } else {
      ball.vy *= -.8
      ball.y = y + sign(dist) * (ball.r+1)
    }
    if (abs(ball.vy) > 0.01) postMessage(['playWallColision', ball.vy])
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

log('Worker was loaded!', this)
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

}
