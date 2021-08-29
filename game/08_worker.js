if (!isMainThread) { // Running in a WebWorker

let stopped = 0
balls = [ { x:0, y:0, vx:0, vy:0 }, { x:0, y:0, vx:0, vy:0 } ]

onmessage = function(e) {
  const [evName, payload] = e.data;
  if (on[evName]) on[evName](payload)
  else log('Unknown event', evName)
}

function sendMsg(evName, payload) {
  postMessage([evName, payload])
}

const on = {

  start() {
    log('Starting!')
    points = 0
    changeLevel(0)
    setInterval(tic, 9)
  },

  gravity(val) {
    gravity = val
  }

}

function changeLevel(index) {
  curLevel = {...levels[index]}
  log('Moving to level', index)
  sendMsg('setLvl', index)
  balls = balls.map((b, i)=> {
    [b.x, b.y] = curLevel.ballStart
    b.y += ( (balls.length-1)/2 - i ) * 7
    b.vx = 0
    b.vy = 0
    return b
  })
}

let ticCounter = 0
function tic() {
  ticCounter++
  updateFPS() // DEBUG
  if (!stopped) {
    balls.map(ball => {
      ball.vx += gravity.x/2000
      ball.vy += gravity.y/2000
      ball.vx *= 0.999
      ball.vy *= 0.999
      ball.x += ball.vx
      ball.y += ball.vy
      let hole
      if (hole = curLevel.wh.find(ballInsideRadius(ball))) {
        log('Enter in a wormhole', hole)
        stopped = 1
        sendMsg('lvlFadeOut')
        setTimeout(()=> changeLevel(hole[3]), 2000)
        setTimeout(()=> sendMsg('lvlFadeIn'), 2000)
        setTimeout(()=> stopped = 0, 4000)
        return
      }
      if (hole = curLevel.bh.find(ballInsideRadius(ball))) {
        log('Drop in a blackhole', hole)
        return killBall(ball)
      }
      balls.filter(b2 => b2 != ball).map(b2 => actBallColision(ball, b2))
      curLevel.pins.filter(pinIsUp).map(pin => actPinColision(ball, pin))
      curLevel.wallsV.map(wall => actVerticalWallColision(ball, wall))
      curLevel.wallsH.map(wall => actHorizontalWallColision(ball, wall))
    })
  }
  if ((ticCounter%2) === 0) sendMsg('update', {
    balls: balls.map(values), pins: curLevel.pins, points
  })
}

function pinIsUp(pin) {
  return pin[3] > 0.2
}

function ballInsideRadius(ball) {
  // "other" can be any obj definition where the radius is the third array item
  return (other)=> calcDist(ball, {x:other[0], y:other[1]})[2] < other[2]
}

function killBall(ball) {
  balls = balls.filter(b => b != ball)
  if (!balls.length) {
    log('TODO: drop one life for a new ball')
  }
}

function actBallColision(b1, b2) {
  const [dX, dY, dist, vec] = calcDist(b1, b2)
  const minDist = ballRay * 2
  if (dist < minDist) {
    b1.x = b2.x + vec.x * minDist
    b1.y = b2.y + vec.y * minDist
    ;[b1.vx, b1.vy, b2.vx, b2.vy] = [b2.vx*.9, b2.vy*.9, b1.vx*.9, b1.vy*.9]
    const inpactPower = hypotenuse(b2.vx-b1.vx, b2.vy-b1.vy)
    if (inpactPower > 0.02) {
      const gain = min(inpactPower**2, 1)
      postPlay(
        [1200, 0, gain,   .2],
        [6030, 0, gain/5, .2]
      )
    }
  }
}

function actPinColision(ball, pin) {
  const [x, y, r/*radius*/] = pin
  let [dX, dY, dist, vec] = calcDist(ball, {x, y})
  let minDist = ballRay + r
  if (dist < minDist) {
    let absVel = hypotenuse(ball.vx, ball.vy) * .8
    ball.vx = absVel * vec.x
    ball.vy = absVel * vec.y
    ball.x = x + vec.x * minDist
    ball.y = y + vec.y * minDist
    if (absVel > 0.01) {
      if (curLevel.on.colidePin) curLevel.on.colidePin(pin, absVel*2)
      const gain = min((absVel*2)**2, 1)
      postPlay(
        [1200, 0, gain/5, .4],
        [1500, 0, gain,   .2],
        [8000, 0, gain/5, .2]
      )
    }
  }
}

function actVerticalWallColision(ball, [x, y, length]) {
  let dist = ball.x - x
  if (abs(dist) < ballRay+wallHalfExp && y < (ball.y+ballRay) && (ball.y-ballRay) < (y+length)) {
    let pct = 1 // default kick
    if (y > ball.y) { // (Isso realmente vale a pena?)
      // kick to left
      pct = 1 - ( (y - ball.y) / ballRay ) ** 2
    }
    if (ball.y > (y+length)) {
      // kick to right
      pct = 1 - ( (ball.y - (y+length)) / ballRay ) ** 2
    }
    ball.vx *= -.8
    ball.x = x + sign(dist) * (ballRay + wallHalfExp * pct)
    if (abs(ball.vx) > 0.01) playWallColisionSound(ball.vx)
  }
}

function actHorizontalWallColision(ball, [x, y, length]) {
  let dist = ball.y - y
  if (abs(dist) < ballRay+wallHalfExp && x < (ball.x+ballRay) && (ball.x-ballRay) < (x+length)) {
    let pct = 1 // default kick
    if (x > ball.x) { // (Isso realmente vale a pena?)
      // kick to left
      pct = 1 - ( (x - ball.x) / ballRay ) ** 2
    }
    if (ball.x > (x+length)) {
      // kick to right
      pct = 1 - ( (ball.x - (x+length)) / ballRay ) ** 2
    }
    ball.vy *= -.8
    ball.y = y + sign(dist) * (ballRay + wallHalfExp * pct)
    if (abs(ball.vy) > 0.01) playWallColisionSound(ball.vy)
  }
}

function playWallColisionSound(gain) {
  gain = min((gain*2)**2, 1)
  postPlay(
    [ 500, 0, gain,   .3],
    [1300, 0, gain/5, .3]
  )
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
sendMsg('alive') // Notify that this worker was loaded.

/* INI DEBUG FPS */
let fpsCounter = 0
let fpsLast = Date.now()
function updateFPS() {
  fpsCounter++
  if ((fpsCounter%10) === 0) {
    sendMsg( 'bakFPS', 1000 / ((Date.now() - fpsLast) / 10) )
    fpsLast = Date.now()
  }
}
/* END DEBUG FPS */

}
