function drawBall(x, y, ray) {
  const ballX = x*u + floorIncX*.8
  const ballY = y*u + floorIncY*.8
  const rayU = ray * u
  const inclinationValU = inclinationVal * u
  // Shadow
  // TODO: expand shadow with the table rotation (gravity)
  const shadowSize = rayU + inclinationValU * 4
  ctxShadow.fillStyle = '#000'
  ctxShadow.beginPath()
  ctxShadow.ellipse(ballX-shadowSize+rayU, ballY+shadowSize-rayU, shadowSize, rayU, -PI/4, 0, 2*PI)
  ctxShadow.fill()
  // Metal ball
  const grad = mkRadGrad(
    ballX+inclinationValU*ray/2, ballY-inclinationValU*ray/2, rayU/6,
    ballX+inclinationValU, ballY-inclinationValU, rayU*1.2,
    '#FFF', '#111'
  )
  ctxPieces.fillStyle = grad
  // ctxPieces.fillStyle = 'rgba(0,255,0,.4)'
  ctxPieces.beginPath()
  ctxPieces.ellipse(ballX, ballY, rayU, rayU, 0, 0, 2*PI)
  ctxPieces.fill()
}

function drawWallVertical(x, y, length, height, hue,sat,light,alpha) {
  drawBox(x-1,y, x+1,y+length, height, hue,sat,light,alpha)
}

function drawWallHorizontal(x, y, length, height, hue,sat,light,alpha) {
  drawBox(x,y-1, x+length,y+1, height, hue,sat,light,alpha)
}

function fillPath(ctx, h,s,l,a, ...path) {
  ctx.fillStyle = `hsla(${h},${s}%,${l}%,${a})`
  ctx.fill(new Path2D(`M ${path}`))
}

function drawBox(x1,y1, x2,y2, h, hue,sat,light,alpha=1) {
  // TODO: Drop Shadow
  x1 = x1*u + floorIncX -.5, y1 = y1*u + floorIncY -.5
  x2 = x2*u + floorIncX +.5, y2 = y2*u + floorIncY +.5
  const x1Top = x1 + gravity.x*h/2, y1Top = y1 + gravity.y*h/2
  const x2Top = x2 + gravity.x*h/2, y2Top = y2 + gravity.y*h/2
  // Bottom
  fillPath(
    ctxPieces, hue,sat,light/2,alpha*.8,
    x1,y1, x2,y1, x2,y2, x1,y2
  )
  // Top
  fillPath(
    ctxPieces, hue,sat,(light+(1-inclinationVal)*100)/2,alpha,
    x1Top,y1Top, x2Top,y1Top, x2Top,y2Top, x1Top,y2Top
  )
  if (gravity.x > 0) { // Rotation west-ish, show East wall face
    fillPath(
      ctxPieces, hue,sat,light/2,alpha,
      x1,y1, x1Top,y1Top, x1Top,y2Top, x1,y2
    )
  }
  if (gravity.x < 0) { // Rotation east-ish, show West wall face
    fillPath(
      ctxPieces, hue,sat,(light+100)/2,alpha,
      x2,y1, x2Top,y1Top, x2Top,y2Top, x2,y2
    )
  }
  if (gravity.y < 0) { // Rotation north-ish, show South wall face
    fillPath(
      ctxPieces, hue,sat,light/1.5,alpha,
      x1,y2, x1Top,y2Top, x2Top,y2Top, x2,y2
    )
  }
  if (gravity.y > 0) { // Rotation south-ish, show North wall face
    fillPath(
      ctxPieces, hue,sat,(light*2+100)/3,alpha,
      x1,y1, x1Top,y1Top, x2Top,y1Top, x2,y1
    )
  }
  // Shadow
  const shadowSize = inclinationVal * 10 * u
  fillPath(
    ctxShadow, 0,0,0,1-(1-alpha)**2, // Alpha is a ease-out curve
    x1,y1, x2,y1, x2,y2,
    x2-shadowSize,y2+shadowSize,
    x1-shadowSize,y2+shadowSize,
    x1-shadowSize,y1+shadowSize
  )
}

function drawPin(x, y, ray /*radius*/, h, hue,sat,light) {
  ray *= u
  const baseX = x*u+floorIncX, baseY = y*u+floorIncY
  const endX = baseX+gravity.x*h/2, endY = baseY+gravity.y*h/2
  // Shadow
  const shadowSize = inclinationVal * 10 * u
  ctxShadow.beginPath()
  ctxShadow.moveTo(baseX,     baseY)
  ctxShadow.lineTo(baseX-shadowSize, baseY+shadowSize)
  ctxShadow.strokeStyle = '#000'
  ctxShadow.lineWidth = ray*2
  ctxShadow.lineCap = 'round'
  ctxShadow.stroke()
  // Body
  ctxPieces.beginPath()
  ctxPieces.moveTo(baseX, baseY)
  ctxPieces.lineTo(endX, endY)
  let grad = ctxPieces.createLinearGradient(
    baseX+gravity.yi*ray, baseY-gravity.xi*ray,
    baseX-gravity.yi*ray, baseY+gravity.xi*ray
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
  ctxPieces.lineWidth = ray*2
  ctxPieces.lineCap = 'round'
  ctxPieces.stroke()
  // Top
  ctxPieces.fillStyle = `hsl(${hue} ${sat}% ${trans((light*2+100)/3, light/3, inclinationVal)}%)`
  ctxPieces.beginPath()
  ctxPieces.ellipse(endX, endY, ray, ray, 0, 0, 2*PI)
  ctxPieces.fill()
}
