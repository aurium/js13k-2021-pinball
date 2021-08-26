if (isMainThread) {

function updatePoints() {
  pointsEl.innerHTML = `<t>Points: 000000</t> <l>🚀</l><l>🚀</l><d>🚀</d> <t>Record: 000000</t>`
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

function setUpLevel() {
  ctxFloor.mustUpdate = 1
  // TODO: setup elements
}

scopeShared.tic = function() {
  scopeShared.stats.begin() // DEBUG
  requestAnimationFrame(scopeShared.tic)
  //setTimeout(tic, 4000)
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

  // Unify the list of elements:
  let els = [
    ...curLevel.pins.map(el=> [drawPin, ...el]),
    ...curLevel.wallsV.map(el=> [drawWallVertical, ...el]),
    ...curLevel.wallsH.map(el=> [drawWallHorizontal, ...el]),
    ...balls.map(el=> [drawBall, ...el])
  ]
  // Define elements sorter:
  if (gravity.x > 0 && gravity.y < 0) { // Rotation Nort-West
    els = els.sort(([,aX,aY], [,bX,bY])=>
      ( (aY*1000-aX) < (bY*1000-bX) ) ? -1 : 1
    )
  }
  else if (gravity.x > 0 && gravity.y > 0) { // Rotation Nort-East
    els = els.sort(([,aX,aY], [,bX,bY])=>
      ( (aY*1000+aX) < (bY*1000+bX) ) ? 1 : -1
    )
  }
  else if (gravity.x < 0 && gravity.y < 0) { // Rotation South-West
    els = els.sort(([,aX,aY], [,bX,bY])=>
      ( (aY*1000+aX) < (bY*1000+bX) ) ? -1 : 1
    )
  }
  else { // Rotation South-East
    els = els.sort(([,aX,aY], [,bX,bY])=>
      ( (aY*1000-aX) < (bY*1000-bX) ) ? 1 : -1
    )
  }

  els.map(([painter, ...el])=> painter(...el))

  // curLevel.pins.map(drawPin)
  // curLevel.wallsV.map(drawWallVertical)
  // curLevel.wallsH.map(drawWallHorizontal)
  // values(balls).map(drawBall)

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
  balls = update.balls
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
