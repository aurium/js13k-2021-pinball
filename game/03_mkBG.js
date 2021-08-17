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

function calcJuliaPx(zoom, z, posXu, posYu, pixX, pixY, maxIteration) {
  let interation
  let cX = w/2 + posXu*zoom
  let cY = h/2 + posYu*zoom
  let x = ((pixY-cY)/w) / zoom
  let y = ((pixX-cX)/w) / zoom
  for (interation = 1; interation <= maxIteration; interation++) {
    var x2 = x*x, y2 = y*y;
    if(x2 + y2 > 4) break;
    let newX = x2 - y2 - z;
    let newY = 2*x*y + z;
    x = newX;
    y = newY;
  }
  return interation
}

function mkBGJulia(zoom, z=.52, posX, posY, maxIteration=200, hueIni=0, hueMult=2, limColor=()=>'0,0%,15%') {
  posX *= u
  posY *= u
  for (let pixY=0; pixY<h; pixY++) for (let pixX=0; pixX<w; pixX++) {
    let i = calcJuliaPx(zoom, z, posX, posY, pixX, pixY, maxIteration)
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

const cartesianToIndex = (x, y)=> ( w*y + x ) * 4
const getColorComponent = (imgPx, x,y, i)=>
  imgPx[
    cartesianToIndex(
      max(min(x, w-1), 0),
      max(min(y, h-1), 0)
    ) + i
  ]

function blurFloor(radius) {
  const img = ctxFloor.getImageData(0, 0, w, h)
  const imgPx = img.data
  for (let x=0; x<w; x++) for (let y=0; y<h; y++) for(let i=0; i<4; i++) {
    let sum = 0
    for (let step=0; step<radius; step++) {
      sum +=
        getColorComponent(imgPx, x+step, y, i) +
        getColorComponent(imgPx, x-step, y, i) +
        getColorComponent(imgPx, x, y+step, i) +
        getColorComponent(imgPx, x, y-step, i)
    }
    imgPx[cartesianToIndex(x,y) + i] = sum / (radius*4)
  }
  ctxFloor.putImageData(img, 0, 0)
}

async function mkBGStars(zoom, z, posX, posY, starChance=.3) {
  posX *= u
  posY *= u
  //await promiseAfterScreenUpdate()
  // Draw Clouds
  let cloudPix = ~~u
  if (cloudPix%2 !=0) cloudPix--
  for (let pixY=0; pixY<h; pixY+=cloudPix) {
    //if (pixY%20 === 19) await promiseAfterScreenUpdate() // boreless building
    for (let pixX=0; pixX<w; pixX+=cloudPix) {
      let i = calcJuliaPx(zoom, z, posX, posY, pixX, pixY, 150)/150
      ctxFloor.fillStyle = `hsla(${150*i+340},100%,${50 + i*50}%,${i*.9})`
      ctxFloor.fillRect(pixX-cloudPix/2, pixY-cloudPix/2, cloudPix, cloudPix)
    }
  }
  blurFloor(cloudPix)
  // Draw Stars
  ctxFloor.globalCompositeOperation = 'lighter'
  for (let pixY=0; pixY<h; pixY++) {
    //if (pixY%10 === 0) await promiseAfterScreenUpdate() // boreless building
    for (let pixX=0; pixX<w; pixX++) {
      let i = (calcJuliaPx(zoom, z, posX, posY, pixX, pixY, 150)/170)**1.5
      if (rnd(1/starChance) < .02+i && (pixX+pixY)%3===0) {
        let size = round((rnd() + i) * 1.5) // 0 .. 3
        let color = { r:255, g:255, b:255 }
        if (rnd() < .6) {
          if (rnd() < .3) {
            color.g = (color.r = rnd(50,100)) * 2
            color.b = 255
          } else {
            color.r = 255
            color.g = rnd(255)
            color.b = rnd(color.g)
          }
        }
        plotStar(pixX, pixY, size, color)
      }
    }
  }
  for (let i=0; i<9; i++) {
    let pixX = ~~rnd(w), pixY = ~~rnd(h)
    plotStar(pixX, pixY, 23, { r:100, g:200, b:255 })
    ctxFloor.beginPath()
    ctxFloor.arc(pixX+.5, pixY+.5, 6, 0, PI*2)
    ctxFloor.strokeStyle = ctxFloor.fillStyle = 'rgba(100,200,255,.4)'
    ctxFloor.stroke()
    ctxFloor.fillRect(pixX-1, pixY-1, 3, 3)
  }
  ctxFloor.globalCompositeOperation = 'source-over'
  return ctxFloor.getImageData(0, 0, w, h)
}

function plotStar(pixX, pixY, size, color) {
  for (let p=-size; p<=size; p++) {
    ctxFloor.fillStyle = `rgba(${color.r},${color.g},${color.b},${(1-abs(p/(size+1)))**1.5})`
    ctxFloor.fillRect(pixX+p, pixY, 1, 1)
    ctxFloor.fillRect(pixX, pixY+p, 1, 1)
  }
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
