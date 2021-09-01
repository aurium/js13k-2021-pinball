if (!isMainThread) { // Running in a WebWorker

let stopped = 0
balls = [ { x:0, y:0, vx:0, vy:0 } ]

onmessage = function(e) {
  const [evName, payload] = e.data;
  if (on[evName]) on[evName](payload)
  else log('Unknown event', evName)
}

function sendMsg(evName, payload) {
  postMessage([evName, payload])
}

const on = {

  start(lvlMatch) {
    log('Starting!')
    points = 0
    changeLevel(lvlMatch ? parseInt(lvlMatch[1]) : 0)
    setInterval(tic, 9)
  },

  gravity(val) {
    gravity = val
  }

}

function resetBall(ball, index=null) {
  [ball.x, ball.y] = curLevel.ballStart
  if (index != null) ball.y += ( (balls.length-1)/2 - index ) * 7
  ball.vx = 0
  ball.vy = 0
  return ball
}

function changeLevel(index) {
  curLevel = {...levels[index]}
  log('Moving to level', index)
  sendMsg('setLvl', index)
  balls = balls.map(resetBall)
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
        return postPlay(
          [200, 0, 1, 1.3, 2000],
          ...mapFor(200,1000,100,(f)=> [f, f/1000, .5, .3])
        )
      }
      balls.filter(b2 => b2 != ball).map(b2 => actBallColision(ball, b2))
      curLevel.pins.filter(pinIsUp).map(pin => actPinColision(ball, pin))
      curLevel.wallsV.map(wall => actVerticalWallColision(ball, wall))
      curLevel.wallsH.map(wall => actHorizontalWallColision(ball, wall))
      if (hole = curLevel.bh.find(ballInsideRadius(ball))) {
        log('Drop in a blackhole', hole)
        killBall(ball)
      }
      if (curLevel.out(ball)) {
        log('Drop out the limits')
        killBall(ball)
      }
    })
  }
  if ((ticCounter%2) === 0) sendMsg('update', {
    balls: balls.map(values), pins: curLevel.pins, points, lives
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
  postPlay(
    //freq, start, iniGain, duration, freqEnd
    [1600,  0,     .8,      1,        200]
  )
  balls = balls.filter(b => b != ball)
  if (!balls.length) {
    lives--
    if (lives > 0) setTimeout(createBall, 1500)
    else setTimeout(gameOver, 1500)
  }
}

function createBall() {
  let newBall = {}
  balls.push(newBall)
  resetBall(newBall)
  return postPlay( // New Ball Song
    [ 800, 0.0, 0.5, .6],
    [3000, 0.0, 0.3, .6],
    [ 800, 0.3, 1.0, .3],
    [1200, 0.5, 1.0, .5]
  )
}

function gameOver() {
  sendMsg('over')
  stopped = 1
  return postPlay(
    [500, 0, .8, .6], [5000, 0, .2, .6],
    [400,.2, .8, .6], [4000,.2, .2, .6],
    [300,.4, .8, .6], [3000,.4, .2, .6],
    [200,.6, .8,  2], [ 600,.6, .2,  2],
  )
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
