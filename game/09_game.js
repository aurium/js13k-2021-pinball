
/* INI DEBUG FPS */
const fps = $('fps')
let fpsCounter = 0
let fpsLast = Date.now()
function fixNum(n) {
  return (typeof(n)==='number') ? n.toFixed(1) : String(n)
}
function updateFPS() {
  fpsCounter++
  if ((fpsCounter%10) === 0) {
    fps.innerText =
      '#BUILD# ' +
      getRotate() +'deg '+ (~~w+'x'+~~h+' ') +
      'G: '+ fixNum(gravity.x)+', '+fixNum(gravity.y) //+' - '+
      //'FPS: '+ fixNum(1000 / ((Date.now() - fpsLast) / 10)) +
      //' / '+ fixNum(bakFPS)
    fpsLast = Date.now()
  }
}
let bakFPS = 0
worker.on_bakFPS = val => {
  bakFPS = val
  statBack.update(val, 140)
}
/* END DEBUG FPS */

/*
https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
synth = window.speechSynthesis
utterThis = new SpeechSynthesisUtterance('Isso é um teste')
voices={}; synth.getVoices().map(v=>voices[v.lang]=v)
utterThis.voice=voices['pt-BR']
[1,2,3,4,5].map(()=>synth.speak(utterThis))
*/

const pointsEl = $('pre')
function updatePoints() {
  pointsEl.innerText = `Points: 000000   Record: 000000`
}

function onWinResize() {
  setTimeout(()=> {
    log('RESIZED!')
    const wOrig = window.innerWidth
    const hOrig = window.innerHeight
    html.className = isMobile ? 'rot' + getRotate() : 'rot90'
    u = isMobile ? getRotate() ? hOrig/100 : wOrig/100 : (hOrig*.6)/100
    vw = u
    vh = u*screenRatio
    canvasFloor.width = canvasShadow.width = canvasPieces.width
    = w = round(vw*100)
    canvasFloor.height = canvasShadow.height = canvasPieces.height
    = h = round(vh*100)
    ctxFloor.mustUpdate = 1
  }, 100)
}
onWinResize()
window.addEventListener('resize', onWinResize)

function updateFloorImage() {
  if (!ctxFloor.mustUpdate) return;
  ctxFloor.clearRect(0, 0, w, h)
  // Draw floor
  ctxFloor.putImageData(curLevel.bg[curLevel.curBG], 0, 0)
  ctxFloor.mustUpdate = 0
  /* INI DEBUG * /
  ctxFloor.fillStyle = 'rgba(0,0,255,.2)'
  ctxFloor.beginPath()
  ctxFloor.ellipse(vw*50, vh*50, vw*50, vw*50, 0, 0, 2*PI)
  ctxFloor.fill()
  ctxFloor.fillStyle = 'rgba(0,0,0,.2)'
  ctxFloor.fillRect(w/2, 0, w, h)
  ctxFloor.fillStyle = 'rgba(0,0,0,.2)'
  ctxFloor.fillRect(0, h/2, w, h)
  /* END DEBUG */
}


function setUpLevel() {
  ctxFloor.mustUpdate = 1
  // TODO: setup elements
}

function tic() {
  stats.begin() // DEBUG
  requestAnimationFrame(tic)
  updateFPS() // DEBUG
  updatePoints()
  if (!curLevel) return;
  updateFloorImage()
  ctxShadow.clearRect(0, 0, w, h)
  ctxPieces.clearRect(0, 0, w, h)

  // inclinationVal varia entre [0..1], onde: 0 = max top right; 1 = max bottom left
  inclinationVal = (20 - gravity.x + gravity.y) / 40

  floorIncX = -gravity.x * u
  floorIncY = -gravity.y * u
  canvasFloor.style.transform = `translate(${floorIncX}px, ${floorIncY}px)`

  curLevel.pins.map(drawPin)
  curLevel.wallsV.map(drawWallVertical)
  curLevel.wallsH.map(drawWallHorizontal)
  values(balls).map(drawBall)

  /* INI DEBUG Draw Gravty line */
  ctxPieces.beginPath()
  ctxPieces.moveTo(vw*50, vh*50);
  ctxPieces.lineTo(vw*50+gravity.x*10, vh*50+gravity.y*10);
  ctxPieces.strokeStyle = '#000'
  ctxPieces.lineWidth = 3
  ctxPieces.lineCap = 'round'
  ctxPieces.stroke()
  /* END DEBUG */
  stats.end() // DEBUG
}

worker.on_update = update => {
  balls = update.balls
}

function trans(from, to, step /* value in [0..1] */) {
  return (from * (1-step)) + (to * step)
}

let gravity = { x:0, y:0, xi:0, yi:0 }
if (isMobile) {
  window.addEventListener("devicemotion", (ev)=> {
    // Chrome will only enable this feature for remote sites.
    const g = ev.accelerationIncludingGravity
    const x = ((gravity.x*4 + -g.x) / 5) || 0
    const y = ((gravity.y*4 + g.y) / 5) || 0
    if (isNaN(x) || isNaN(y) || x===null || y===null) log('BAD Gravity!', {x, y})
    const hyp = hypotenuse(x,y)
    gravity = { x, y, xi: x/hyp||0, yi: y/hyp||0 }
    worker.$('gravity', gravity)
  })
} else {
  body.addEventListener('mousemove', (ev)=> {
    const w = body.clientWidth, h = body.clientHeight
    const x = 10*(h/2 - ev.pageY)/(h/2)
    const y = max(min(10*(-w/2 + ev.pageX)/(h/2), 10), -10)
    const hyp = hypotenuse(x,y)
    gravity = { x, y, xi: x/hyp||0, yi: y/hyp||0 }
    worker.$('gravity', gravity)
  })
}

/// Initialization ///////////////////////////////
body.classList.add(isMobile ? 'is-mobile' : 'not-mobile')
var preSetupDone = 0

log(`Is ${isMobile ? '' : 'NOT'} Mobile.`)
if (!isMobile) setTimeout(initGame, 500)
else body.addEventListener('click', ()=> {
  if (preSetupDone) return;
  if (body.requestFullscreen) {
    body.requestFullscreen()
    .then(()=> setTimeout(lockOrientation, 500))
    .catch(err => alert('This game needs the fullscreen mode.\n\n' + err.message))
    .finally(initGame)
  } else {
    alert('Your browser do not have fullscreen API.')
  }
})

function lockOrientation() {
  // Do no works on Firefox Android:
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1610745
  // Failover to CSS lock. However that will also not work properly:
  // https://github.com/mozilla-mobile/fenix/issues/20405
  if (scrOrient.lock)
    scrOrient
    .lock('portrait-primary')
    .then(res => log('Lock OK!'))
    .catch(err => alert(
      'Can not lock orientation on this browser.\n' + err.message +
      '\nFailover to CSS. (However that will also not work properly on Firefox)' +
      '\nTry to lock rotation on your mobile configuration.'
    ))
  else
    log('This browser has no orientation lock feature! Try failover to CSS.')
}

async function initGame() {
  log('Init Game!')
  await promiseAfterScreenUpdate()
  preSetupDone = 1
  let sequence = Promise.resolve()
  levels.map((lvl, i)=> sequence = sequence.then(async ()=> {
    $('b').innerText = `Building...\nLevel ${i}  `
    await promiseAfterScreenUpdate()
    let start = Date.now() // DEBUG
    log(`Building BG ${i} start...`)
    await lvl.bg()
    log(`Building BG ${i} done!`, (Date.now()-start)/1000)
  }))
  await sequence

  log('Set Header BG')
  ctxFloor.putImageData(levels[0].bg[0], 0, 0)
  $('pre').style.backgroundImage = `url(${canvasFloor.toDataURL()})`
  tryToInitGame()
}

function tryToInitGame() {
  if (!workerIsAlive) return setTimeout(tryToInitGame, 200)
  worker.$('start', levels)
  $('b').remove()
  tic()
}

let changeFooterFrameInterval
worker.on_setLvl = (index)=> {
  curLevel = levels[index]// parse(stringify(levels[index]))
  curLevel.curBG = 0
  ctxFloor.mustUpdate = 1
  if (changeFooterFrameInterval) clearInterval(changeFooterFrameInterval)
  changeFooterFrameInterval = setInterval(()=> {
    curLevel.curBG++
    if (curLevel.curBG === curLevel.bg.length) curLevel.curBG = 0
    ctxFloor.mustUpdate = 1
  }, curLevel.bgFreq || 40)
}
