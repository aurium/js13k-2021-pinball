function drawBall(ball) {
  const ballX = ball.x*u + floorIncX*.8
  const ballY = ball.y*u + floorIncY*.8
  const rad = ball.r * u
  // inclinationVal varia entre [0..u], onde: 0 = max top right; u = max bottom left
  const inclinationVal = (20 - gravity.x + gravity.y) * u / 40
  // Shadow
  // TODO: expand shadow with the table rotation (gravity)
  const shadowSize = rad + inclinationVal * 4
  ctxShadow.fillStyle = '#000'
  ctxShadow.beginPath()
  ctxShadow.ellipse(ballX-shadowSize+rad, ballY+shadowSize-rad, shadowSize, rad, -PI/4, 0, 2*PI)
  ctxShadow.fill()
  // Metal ball
  // const grad = ctxPieces.createRadialGradient(
  //   ballX+inclinationVal*ball.r/2,   ballY-inclinationVal*ball.r/2, rad/6,
  //   ballX+inclinationVal, ballY-inclinationVal, rad*1.2 //3.5*u
  // )
  // grad.addColorStop(0, `#FFF`)
  // grad.addColorStop(1, `#111`)
  const grad = mkRadGrad(
    ballX+inclinationVal*ball.r/2,   ballY-inclinationVal*ball.r/2, rad/6,
    ballX+inclinationVal, ballY-inclinationVal, rad*1.2,
    '#FFF', '#111'
  )
  ctxPieces.fillStyle = grad
  // ctxPieces.fillStyle = 'rgba(0,255,0,.4)'
  ctxPieces.beginPath()
  ctxPieces.ellipse(ballX, ballY, rad, rad, 0, 0, 2*PI)
  ctxPieces.fill()
}

function drawWallVertical([x, y, length, hue,sat,light]) {
  drawBox(x-1,y, x+1,y+length, 4, hue,sat,light,.5)
}

function drawWallHorizontal([x, y, length, hue,sat,light]) {
  drawBox(x,y-1, x+length,y+1, 4, hue,sat,light,.5)
}

function fillPath(ctx, h,s,l,a, ...path) {
  ctx.fillStyle = `hsla(${h},${s}%,${l}%,${a})`
  ctx.fill(new Path2D(`M ${path}`))
}

function drawBox(x1,y1, x2,y2, h, hue,sat,light,alpha=1) {
  // TODO: Drop Shadow
  x1 = x1*u + floorIncX, y1 = y1*u + floorIncY
  x2 = x2*u + floorIncX, y2 = y2*u + floorIncY
  const x1Top = x1 + gravity.x*h/2, y1Top = y1 + gravity.y*h/2
  const x2Top = x2 + gravity.x*h/2, y2Top = y2 + gravity.y*h/2
  // Bottom
  ctxPieces.beginPath()
  ctxPieces.moveTo(x1, y1)
  ctxPieces.lineTo(x2, y1)
  ctxPieces.lineTo(x2, y2)
  ctxPieces.lineTo(x1, y2)
  ctxPieces.fillStyle = `hsla(${hue},${sat}%,${light/2}%,${alpha})`
  ctxPieces.fill()
  // Top
  ctxPieces.beginPath()
  ctxPieces.moveTo(x1Top, y1Top)
  ctxPieces.lineTo(x2Top, y1Top)
  ctxPieces.lineTo(x2Top, y2Top)
  ctxPieces.lineTo(x1Top, y2Top)
  ctxPieces.fillStyle = `hsla(${hue},${sat}%,${light}%,${alpha})`
  ctxPieces.fill()
  if (gravity.x > 0 && gravity.y < 0) { // inclination northwest
    // West
    fillPath(
      ctxPieces, hue,sat,light/3,alpha,
      x1,y1, x1Top,y1Top, x1Top,y2Top, x1,y2
    )
    // South
    ctxPieces.beginPath()
    ctxPieces.moveTo(x1, y2)
    ctxPieces.lineTo(x1Top, y2Top)
    ctxPieces.lineTo(x2Top, y2Top)
    ctxPieces.lineTo(x2, y2)
    ctxPieces.fillStyle = `hsla(${hue},${sat}%,${light/2}%,${alpha})`
    ctxPieces.fill()
  }
}

function drawPin([x, y, rad /*radius*/, h, hue,sat,light]) {
  const baseX = x*u+floorIncX, baseY = y*u+floorIncY
  const endX = baseX+gravity.x*h/2, endY = baseY+gravity.y*h/2
  // inclinationVal varia entre [0..1], onde: 0 = max top right; 1 = max bottom left
  const inclinationVal = (20 - gravity.x + gravity.y) / 40
  // Shadow
  const shadowSize = inclinationVal * 10 * u
  ctxShadow.beginPath()
  ctxShadow.moveTo(baseX,     baseY)
  ctxShadow.lineTo(baseX-shadowSize, baseY+shadowSize)
  ctxShadow.strokeStyle = '#000'
  ctxShadow.lineWidth = rad*2*u
  ctxShadow.lineCap = 'round'
  ctxShadow.stroke()
  // Body
  ctxPieces.beginPath()
  ctxPieces.moveTo(baseX, baseY)
  ctxPieces.lineTo(endX, endY)
  let grad = ctxPieces.createLinearGradient(
    baseX+gravity.yi*rad*u, baseY-gravity.xi*rad*u,
    baseX-gravity.yi*rad*u, baseY+gravity.xi*rad*u
  )
  let light1, light2, light3, rotI /* rotation step */
  light1 = light / 2
  light2 = light * 1.5
  light3 = light / 2
  const inclinationAngle = atan2(gravity.y, gravity.x)
  if ( abs(inclinationAngle) < PI*.25 ) {
    // Inclinação Norte (desktop view)
    rotI = (PI*.25 + inclinationAngle) / (PI*.5)
    light1 = trans(light/2, (light+100)/2, rotI)
    light2 = trans(light/5, light/2, rotI)
    light3 = trans(light/2, light/5, rotI)
  }
  else if ( abs(inclinationAngle) > PI*.75 ) {
    // Inclinação Sul (desktop view)
    rotI = ( inclinationAngle < 0
           ? -inclinationAngle - PI*.75
           : (PI*.5) - (inclinationAngle - PI*.75)
         ) / (PI*.5)
    light1 = trans(light/5, light/2, rotI)
    light2 = trans(light/2, (light+100)/2, rotI)
    light3 = trans((light+100)/2, light/2, rotI)
  }
  else if ( inclinationAngle < 0 ) {
    // Inclinação Oeste (desktop view)
    rotI = (PI*.75 - inclinationAngle) / (PI*.5) - 2
    light1 = trans(light/2, light/5, rotI)
    light2 = trans(light/5, light/2, rotI)
    light3 = trans(light/2, (light+100)/2, rotI)
  }
  else {
    // Inclinação Leste (desktop view)
    rotI = -(inclinationAngle - PI*.75) / (PI*.5)
    light1 = trans(light/2, (light+100)/2, rotI)
    light2 = trans((light+100)/2, light/2, rotI)
    light3 = trans(light/2, light/5, rotI)
  }
  grad.addColorStop( 0, `hsl(${hue} ${sat}% ${light1}%)`)
  grad.addColorStop(.5, `hsl(${hue} ${sat}% ${light2}%)`)
  grad.addColorStop( 1, `hsl(${hue} ${sat}% ${light3}%)`)
  ctxPieces.strokeStyle = grad
  ctxPieces.lineWidth = rad*2*u
  ctxPieces.lineCap = 'round'
  ctxPieces.stroke()
  // Top
  ctxPieces.fillStyle = `hsl(${hue} ${sat}% ${trans((light*2+100)/3, light/3, inclinationVal)}%)`
  ctxPieces.beginPath()
  ctxPieces.ellipse(endX, endY, rad*u, rad*u, 0, 0, 2*PI)
  ctxPieces.fill()
}
