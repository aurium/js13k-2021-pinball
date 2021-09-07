function drawBall(x, y) {
  const ballX = x*u + floorIncX*.8
  const ballY = y*u + floorIncY*.8
  const rayU = ballRay * u
  const inclinationValU = inclinationVal * u
  // Shadow
  // TODO: expand shadow with the table rotation (gravity)
  const shadowSize = rayU + inclinationValU * 4
  ctxShadow.fillStyle = '#000'
  ctxShadow.beginPath()
  ctxShadow.ellipse(ballX-shadowSize+rayU, ballY+shadowSize-rayU, shadowSize, rayU, -PI/4, 0, PI2)
  ctxShadow.fill()
  // Metal ball
  const grad = mkRadGrad(
    ballX+inclinationValU*ballRay/2, ballY-inclinationValU*ballRay/2, rayU/6,
    ballX+inclinationValU, ballY-inclinationValU, rayU*1.2,
    '#FFF', '#111'
  )
  ctxPieces.fillStyle = grad
  // ctxPieces.fillStyle = 'rgba(0,255,0,.4)'
  ctxPieces.beginPath()
  ctxPieces.ellipse(ballX, ballY, rayU, rayU, 0, 0, PI2)
  ctxPieces.fill()
}

function drawWallVertical(x, y, length, height, hue,sat,light,alpha) {
  drawBox(x-wallHalfExp,y, x+wallHalfExp,y+length, height, hue,sat,light,alpha)
}

function drawWallHorizontal(x, y, length, height, hue,sat,light,alpha) {
  drawBox(x,y-wallHalfExp, x+length,y+wallHalfExp, height, hue,sat,light,alpha)
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
  const shadowSize = inclinationVal * h*2 * u
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
  ctxPieces.ellipse(endX, endY, ray, ray, 0, 0, PI2)
  ctxPieces.fill()
}

function paintWormHole([x, y, r]) {
  x = x*u + floorIncX
  y = y*u + floorIncY
  const cx = x - gravity.x*r*.4
  const cy = y - gravity.y*r*.4
  r *= u
  drawCircle(
    ctxPieces, x,y,r*1.5,
    mkRadGrad(
      x,  y,  r*1.5,
      cx, cy, r/3,
      'rgba(0,0,0,0)', 'rgba(0,0,200,.3)', '#05C', '#0CF'
    )
  )
  ctxPieces.lineWidth = 1
  ctxPieces.strokeStyle = mkRadGrad(
    x,  y,  r*1.5,
    cx, cy, r/3,
    'rgba(0,180,255,.2)', '#0CF'
  )
  ctxPieces.beginPath()
  mapFor(0, PI2, PI/6, (a)=> {
    ctxPieces.moveTo(x+r*1.5*cos(a), y+r*1.5*sin(a))
    ctxPieces.bezierCurveTo(x+r*cos(a)/2, y+r*sin(a)/2, cx,cy, cx,cy)
  })
  mapFor(.2,.8,.2, (i1)=> {
    let i2 = 1-i1
      , ix = x*i1 + cx*i2
      , iy = y*i1 + cy*i2
      , ir = r*1.5*i1 + r/3*i2
    ctxPieces.moveTo(ix+ir, iy)
    ctxPieces.ellipse(ix, iy, ir, ir, 0, 0, PI2)
  })
  ctxPieces.stroke()
}

function paintBlackHole([x, y, r]) {
  x = x*u + floorIncX*.85
  y = y*u + floorIncY*.85
  r *= u
  drawCircle(
    ctxPieces, x,y,r*2,
    mkRadGrad(x,y,r*2, x,y,r*1.2, 'rgba(255,0,0,0)', '#000')
  )
  // Dropping dots arround the hole
  mapFor(0, PI2, PI/(r**.8), (a)=> {
    let delay = 500 + (a%1)*400
    let dist = (delay-Date.now()%delay)/delay
    ctxPieces.fillStyle = `rgba(255,200,0,${1-dist})`
    ctxPieces.fillRect(x+(r+dist*r)*cos(a), y+(r+dist*50)*sin(a), 2, 2)
  })
}
