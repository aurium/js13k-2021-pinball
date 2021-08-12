function mkBGMandelbroat(zoom, posX, posY, maxIteration=200, hueIni=0, hueMult=2) {
  posX *= u
  posY *= u
  for (let pixY=0; pixY<h; pixY++) for (let pixX=0; pixX<w; pixX++) {
    let cX = w/2 + posX*zoom
    let cY = h/2 + posY*zoom
    let x0 = ((pixY-cY)/w) / zoom
    let y0 = ((pixX-cX)/w) / zoom
    let x=0, y=0, iteration=0
    while ((x*x + y*y) <= 4 && iteration < maxIteration) {
      let tempX = x*x - y*y + x0
      y = 2*x*y + y0
      x = tempX
      iteration++
    }
    ctxFloor.fillStyle = `rgb(${iteration*10-1200},0,0)`
    ctxFloor.fillStyle = `hsl(${hueIni+hueMult*iteration},100%,50%)`
    ctxFloor.fillRect(pixX, pixY, 1, 1)
  }
  return ctxFloor.getImageData(0, 0, w, h)
}

function mkBGJulia(zoom, posX, posY, z=.52, maxIteration=200, hueIni=0, hueMult=2, limColor=()=>'0,0%,15%') {
  posX *= u
  posY *= u
  for (let pixY=0; pixY<h; pixY++) for (let pixX=0; pixX<w; pixX++) {
    let cX = w/2 + posX*zoom
    let cY = h/2 + posY*zoom
    let x = ((pixY-cY)/w) / zoom
    let y = ((pixX-cX)/w) / zoom
    for (var i = 1; i <= maxIteration; i++) {
      var x2 = x*x, y2 = y*y;
      if(x2 + y2 > 4) break;
      let newX = x2 - y2 - z;
      let newY = 2*x*y + z;
      x = newX;
      y = newY;
    }
    let color = (i>maxIteration)
              ? `hsla(${limColor(pixX/w, pixY/h)},`
              : `hsla(${hueIni+hueMult*i},100%,50%,`
    ctxFloor.fillStyle = color+'1)'
    ctxFloor.fillRect(pixX, pixY, 1, 1)
    ctxFloor.fillStyle = color+'.5)'
    ctxFloor.fillRect(pixX-1, pixY, 1, 1)
    ctxFloor.fillRect(pixX, pixY-1, 1, 1)
  }
  return ctxFloor.getImageData(0, 0, w, h)
}

function mkBGGradient() {
  const img = new ImageData(w, h)
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    let i = (y*w + x) * 4
    img.data[i+0] = 255 * (x/w)
    img.data[i+1] = 255 * (y/h)
    img.data[i+2] = 0
    img.data[i+3] = 255
  }
  return img
}

function drawCircle(x, y, r, fill, stroke) {
  ctxFloor.beginPath()
  ctxFloor.ellipse(x, y, r, r, 0, 0, 2*PI)
  ctxFloor.fillStyle = fill
  ctxFloor.fill()
  if (stroke) {
    ctxFloor.strokeStyle = stroke
    ctxFloor.stroke()
  }
}

function mkRadGrad(x1,y1,r1, x2,y2,r2, ...colors) {
  let grad = ctxPieces.createRadialGradient(x1,y1,r1, x2,y2,r2)
  colors.map((c, i)=> grad.addColorStop(i/(colors.length-1), c))
  return grad
}
