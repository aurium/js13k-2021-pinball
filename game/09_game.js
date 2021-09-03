if (isMainThread) {

function numPannel(num) {
  num = '' + ~~num
  while (num.length < 6) num = '0' + num
  return num
}

function updatePoints() {
  pointsEl.innerHTML = `<t>Points: ${numPannel(points)}</t>` +
    `<span>${mapFor(1,3,1,(i)=>
      (lives<i) ? '<d>🚀</d>' : '<l>🚀</l>'
    ).join('')}</span>` +
    `<t>Record: ${numPannel(record)}</t>`
}

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

let changeFooterFrameInterval
worker.on_setLvl = (index)=> {
  curLevel = {...levels[index]}
  if (curLevel.name) TTS('Moving to ' + curLevel.name)
  if (curLevel.info) TTS(curLevel.info, .8)
  log('Moving to level', index, curLevel.name)
  curLevel.curBG = 0
  ctxFloor.mustUpdate = 1
  if (changeFooterFrameInterval) clearInterval(changeFooterFrameInterval)
  changeFooterFrameInterval = setInterval(()=> {
    curLevel.curBG++
    if (!curLevel.bg) return; // log(curLevel)
    if (curLevel.curBG >= curLevel.bg.length) curLevel.curBG = 0
    ctxFloor.mustUpdate = 1
  }, curLevel.bgFreq || 100)
}

function setUpLevel() {
  ctxFloor.mustUpdate = 1
  // TODO: setup elements
}

scopeShared.tic = function() {
  scopeShared.stats.begin() // DEBUG
  requestAnimationFrame(scopeShared.tic)
  // setTimeout(scopeShared.tic, 500)
  scopeShared.updateFPS() // DEBUG
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
  // Floor brightness is lighter on nort-west rotation and darker on other end.
  canvasFloor.style.filter = `brightness(${.6+(1-inclinationVal)/2})`

  if (!isMobile) {
    wrapper.style.transform =
      `rotateX(${gravity.x*2}deg) rotateY(${gravity.y*2}deg)`
  }

  // Unify the list of elements:
  let els = [
    ...curLevel.pins.map(el=> [drawPin, ...el]),
    ...curLevel.wallsV.map(el=> [drawWallVertical, ...el]),
    ...curLevel.wallsH.map(el=> [drawWallHorizontal, ...el]),
    ...balls.map(el=> [drawBall, ...el])
  ]
  // Define elements sorter:
  // This isn't perfect! We can't define many objects togheter in the map.
  // *** TODO: height < 0.2 must be on the list begining!!! ***
  if (gravity.x > 0 && gravity.y < 0) { // Rotation North-West
    els = els.sort(([aP,aX,aY,aLen], [bP,bX,bY,bLen])=> (
      (aP === drawWallVertical && aX < bX) ? aY+=aLen : 0,
      (bP === drawWallVertical && aX > bX) ? bY+=bLen : 0,
      ( (aY*1000-aX) < (bY*1000-bX) ) ? -1 : 1
    ))
  }
  else if (gravity.x > 0 && gravity.y > 0) { // Rotation North-East
    els = els.sort(([aP,aX,aY,aLen], [bP,bX,bY,bLen])=> (
      (aP === drawWallVertical && aX > bX) ? aY+=aLen : 0,
      (bP === drawWallVertical && aX < bX) ? bY+=bLen : 0,
      ( (aY*1000+aX) < (bY*1000+bX) ) ? 1 : -1
    ))
  }
  else if (gravity.x < 0 && gravity.y < 0) { // Rotation South-West
    els = els.sort(([aP,aX,aY], [bP,bX,bY])=>
      (aP === drawWallVertical || bP === drawWallVertical)
      ? (aX < bX) ? -1 : 1
      : ( (aY*1000+aX) < (bY*1000+bX) ) ? -1 : 1
    )
  }
  else { // Rotation South-East
    els = els.sort(([aP,aX,aY], [bP,bX,bY])=>
      (aP === drawWallVertical || bP === drawWallVertical)
      ? (aX < bX) ? -1 : 1
      : ( (aY*1000-aX) < (bY*1000-bX) ) ? 1 : -1
    )
  }

  // Paint floor elements
  curLevel.bh.map(paintBlackHole)
  curLevel.wh.map(paintWormHole)

  const filterLower = (el => el[4]<.2 && el[0] != drawBall)
  // Draw lower elements
  els.filter(filterLower).map(([painter, ...el])=> painter(...el))
  // Draw higher elements
  els.filter(e => !filterLower(e)).map(([painter, ...el])=> painter(...el))

  /* INI DEBUG Draw Gravty line */
  ctxPieces.beginPath()
  ctxPieces.moveTo(vw*50, vh*50);
  ctxPieces.lineTo(vw*50+gravity.x*10, vh*50+gravity.y*10);
  ctxPieces.strokeStyle = '#000'
  ctxPieces.lineWidth = 3
  ctxPieces.lineCap = 'round'
  ctxPieces.stroke()
  /* END DEBUG */
  scopeShared.stats.end() // DEBUG
}

worker.on_update = update => {
  points = update.points
  lives = update.lives
  balls = update.balls
  Object.assign(curLevel, update.curLevel)
}

worker.on_lvlFadeOut = ()=> body.classList.add('lvl-fade')
worker.on_lvlFadeIn = ()=> body.classList.remove('lvl-fade')

worker.on_over = ()=> {
  setTimeout(()=> TTS('Sorry... Game Over.'), 1000)
  body.classList.add('over')
}

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

}
