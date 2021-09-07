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

function mkBGJulia(zoom, z=.52, posX, posY, maxIteration=200, colorIni=[0,100,50], colorMult=[2,0,0], limColor=()=>'0,0%,15%') {
  posX *= u
  posY *= u
  for (let pixY=0; pixY<h; pixY++) for (let pixX=0; pixX<w; pixX++) {
    let i = calcJuliaPx(zoom, z, posX, posY, pixX, pixY, maxIteration)
    let color = (i>maxIteration)
              ? `hsla(${limColor(pixX/w, pixY/h)},`
              : `hsla(${colorIni[0]+colorMult[0]*i},${colorIni[1]+colorMult[1]*i}%,${colorIni[2]+colorMult[2]*i}%,`
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

async function mkBGStars(zoom, z, posX, posY, starChance=.3, drawClouds=1) {
  posX *= u
  posY *= u
  if (drawClouds) {
    let cloudPix = ~~u
    if (cloudPix%2 !=0) cloudPix--
    for (let pixY=0; pixY<h; pixY+=cloudPix) {
      for (let pixX=0; pixX<w; pixX+=cloudPix) {
        let i = calcJuliaPx(zoom, z, posX, posY, pixX, pixY, 150)/150
        ctxFloor.fillStyle = `hsla(${150*i+340},100%,${50 + i*50}%,${i*.9})`
        ctxFloor.fillRect(pixX-cloudPix/2, pixY-cloudPix/2, cloudPix, cloudPix)
      }
    }
    blurFloor(cloudPix)
  }
  // Draw Stars
  ctxFloor.globalCompositeOperation = 'lighter'
  for (let pixY=0; pixY<h; pixY++) {
    for (let pixX=0; pixX<w; pixX++) {
      let i = (calcJuliaPx(zoom, z, posX, posY, pixX, pixY, 150)/170)**1.5
      if (rnd(1/starChance) < .01+i && (pixX+pixY)%2===0) {
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
        let size = (rnd() + i)**4 // 0 .. 16
        plotStar(pixX, pixY, size, color)
      }
    }
  }
  for (let i=0; i<9; i++) {
    let pixX = ~~rnd(w), pixY = ~~rnd(h)
    plotStar(pixX, pixY, 23, { r:100, g:200, b:255 })
    ctxFloor.beginPath()
    ctxFloor.arc(pixX+.5, pixY+.5, 6, 0, PI2)
    ctxFloor.strokeStyle = ctxFloor.fillStyle = 'rgba(100,200,255,.4)'
    ctxFloor.lineWidth = 1
    ctxFloor.stroke()
    ctxFloor.fillRect(pixX-1, pixY-1, 3, 3)
  }
  ctxFloor.globalCompositeOperation = 'source-over'
  return ctxFloor.getImageData(0, 0, w, h)
}

function plotStar(pixX, pixY, size, color) {
  if (size < 1) {
    ctxFloor.fillStyle = `rgba(${color.r},${color.g},${color.b},${(size+1)/2})`
    return ctxFloor.fillRect(pixX, pixY, 1, 1)
  }
  size = round(size)
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

function drawCircle(ctx, x, y, r, fill, stroke) {
  let [rx, ry] = r.length ? r : [r, r]
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, PI2)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
}

function mkRadGrad(x1,y1,r1, x2,y2,r2, ...colors) {
  let grad = ctxPieces.createRadialGradient(x1,y1,r1, x2,y2,r2)
  colors.map((c, i)=> grad.addColorStop(i/(colors.length-1), c))
  return grad
}

function paintBoomLamps(color='#711', lineWidth=2.5, index=9) {
  ctxFloor.strokeStyle = color
  ctxFloor.lineWidth = lineWidth*u
  ctxFloor.beginPath()
  mapFor(0,2,1,(s)=> {
    if (index == s || index == 9) {
      ctxFloor.moveTo(32*u, 135*u + (11+8.5*s)*u)
      mapFor(1,17,1,(i)=> {
        let r = (i%2==0) ? 11+8.5*s : 6+5.5*s
        let a = PI2 * i/16
        ctxFloor.lineTo(32*u + sin(a)*r*u, 135*u + cos(a)*r*u)
      })
    }
  })
  ctxFloor.stroke()
}
