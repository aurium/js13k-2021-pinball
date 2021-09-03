let curLevel
const bottom = (num)=> hMax - num

// TODO: Reset level state when the user back into it! Can that become more dificult?

// Idéia:
// Um level onde o pin que dá ponto cai de um lado, levantando outro do outro lado.
// Nesse level temos muitos pins pulsantes e a cada ponto as paredes diminuem.

const levels = [

  { /* * * LEVEL 0 * * */
    name: 'start',
    info: 'You can use the wormhole to travell to another level, but avoid the blackhole!',
    async bg(lvlNum) {
      this.bg = []
      let base = await getBasePic(lvlNum)
      if (base && base.width==w && base.height==h) {
        log('We have a pic cache for first level!')
      } else {
        // Create base image:
        for (let x=0; x<w; x++) for (let y=0; y<h; y++) {
          ctxFloor.fillStyle = `hsl(${240+(y/h)*70},100%,20%)`
          ctxFloor.fillRect(x,y,1,1)
        }
        base = await mkBGStars(6, .52, 35, -128)
        addBasePic(lvlNum, base)
      }

      // Create Frames:
      ctxFloor.lineWidth = u/2
      for (let f=1; f<7; f++) {
        ctxFloor.clearRect(0,0,w,h)
        await promiseAfterScreenUpdate()
        ctxFloor.putImageData(base, 0, 0)
        ctxFloor.font = `bold ${10*u}px monospace` //Arial, "Liberation Sans", sans-serif
        ctxFloor.textAlign = 'center'
        const plotChar = (char, x,y, color, blur) => {
          ctxFloor.filter = `blur(${blur}px)`
          ctxFloor.fillStyle = color
          ctxFloor.fillText(char, x, y)
          ctxFloor.filter = `none`
        }
        ;[...'SPACEPINBALL'].map((char, i)=> {
          let x = 17*vw+u*5.5*i, y = 90*vh
          // Shadow
          plotChar(char, x,y, '#306', u/2)
          // Letter lamp
          plotChar(char, x,y, 'rgba(255,255,255,.5)', 0)
          // Letter Glow
          if (f-1 === i || f+5 === i) plotChar(char, x,y, '#FFF', u/1.5)
          else plotChar(char, x,y, 'rgba(255,255,255,.5)', u/3)
        })
        this.bg.push(getFloorImageData())
      }
    },
    bgFreq: 300,
    ballStart: [50, 90],
    out(ball) {
      return ball.x < 0 || ball.x > 100 ||
             ball.y < 0 || ball.y > hMax
    },
    pins: mapFor(PI/18, 2*PI, PI/18, ang =>
      [cos(ang)*30+50, sin(ang)*30+90, 1.5, 4,   60,0,50]
    ),
    wallsV: [
      [  5, 6, hMax-12, 4,  0,0,100,.4],
      [ 95, 6, hMax-12, 4,  0,0,100,.4]
    ],
    wallsH: [
      [ 6,      5, 88, 4,  0,0,100,.4],
      [ 6, hMax-5, 88, 4,  0,0,100,.4]
    ],
    bh: [[75, 25, 4]], // Blackhole [x, y, ray]
    wh: [[25, 25, 6, 1]], // Wormhole [x, y, ray, destination]
    on: {
      colidePin(pin, inpactPower) {
        if (pin.die) return;
        pin[4] -= inpactPower * 30 // Hue
        pin[5] = 100 - pin[4]      // Saturation
        points += ~~(inpactPower*10)
        if (pin[4] < 0) {
          pin[4] = 0
          pin.die = 1
          points += 100
          // freq, start, iniGain, duration, freqEnd
          postPlay([1000, 0, .5, 1, 100])
          lowerPin(pin)
        }
      }
    }
  },

  { /* * * LEVEL 1 * * */
    name: 'Limitless',
    info: 'Caution! There are no walls to help you.',
    async bg(lvlNum) {
      this.bg = []
      let base = await getBasePic(lvlNum)
      if (base && base.width==w && base.height==h) {
        log('We have a pic cache for Limitless level!')
      } else {
        // Create base image:
        mkBGJulia(5, .511, -5, -24, 500, 150, 2.5, (x,y)=>
          `${hypotenuse(x-.5,y-.5)*500},100%,40%`
        )

        ;[5,5,5,5,5,5,0].map(blur => {
          ctxFloor.filter = `blur(${blur}px)`
          ctxFloor.font = `bold ${3.5*u}px Arial, "Liberation Sans", sans-serif`
          ctxFloor.textAlign = 'center'
          ctxFloor.fillStyle = blur ? '#C0C' : '#FFF'
          ctxFloor.fillText('Inferno', 10*u, 20*u)
          ctxFloor.fillText('Clones',  90*u, 20*u)
          ctxFloor.fillText('Mines',   10*u, 149*u)
          ctxFloor.fillText('Solaris', 90*u, 149*u)
        })
        ctxFloor.filter = `none`

        base = getFloorImageData()
        addBasePic(lvlNum, base)
      }

      // Create Frames:
      ctxFloor.lineWidth = u/2
      for (let f=0; f<4; f++) {
        ctxFloor.putImageData(base, 0, 0)

        // Draw blinking arrows
        for (let i=0; i<4; i++) {
          mapFor(PI/4, 2*PI, PI/2, (angle)=> {
            let y = -i*14*u - 8*u
            let gY = y - 3.7*u
            ctxFloor.save()
            ctxFloor.translate(50*vw, 50*vh)
            ctxFloor.rotate(angle)
            ctxFloor.font = `bold ${9*u}px Arial, "Liberation Sans", sans-serif`
            ctxFloor.textAlign = 'center'
            ctxFloor.fillStyle = (i === f)
              ? mkRadGrad(0,gY,u/2, 0,gY,3*u, '#F20', '#800')
              : mkRadGrad(0,gY,u/2, 0,gY,2*u, '#900', '#500')
            ctxFloor.fillText('⬆', 0, y)
            ctxFloor.restore()
          })
        }

        this.bg.push(getFloorImageData())
      }
    },
    bgFreq: 500,
    ballStart: [50, hCenter],
    out(ball) {
      return ball.x < 0 || ball.x > 100 ||
             ball.y < 0 || ball.y > hMax
    },
    pins: [
      ...mapFor(-15, 15, 5, (i)=>
        [20-i, 20+i, 2, 4,  0,(i==15)?90:0,10, {i, wh:'inf', go:'sol'}]
      ),
      ...mapFor(-15, 15, 5, (i)=>
        [80+i, 20+i, 2, 4,  0,(i==15)?90:0,10, {i, wh:'clo', go:'min'}]
      ),
      ...mapFor(-15, 15, 5, (i)=>
        [20-i, bottom(20+i), 2, 4,  0,(i==15)?90:0,10, {i, wh:'min', go:'clo'}]
      ),
      ...mapFor(-15, 15, 5, (i)=>
        [80+i, bottom(20+i), 2, 4,  0,(i==15)?90:0,10, {i, wh:'sol', go:'inf'}]
      )
    ],
    wallsV: [],
    wallsH: [],
    bh: [], // Blackhole [x, y, ray]
    wh: [ // Wormhole [x, y, ray, destination]
      [10, 10, 6, 2],
      [90, 10, 6, 3],
      [10, bottom(10), 6, 4],
      [90, bottom(10), 6, 5],
    ],
    on: {
      colidePin(pin) {
        const { i, go } = pin[7]
        if (i == 15) { // Touch the red pin!
          points += 50
          pin[7].i = 1 // Disable it
          downPinProp(pin, 5) // Grayfy it
          postPlay([1000, 0, .5, 1, 100])
          const downPin = curLevel.pins.find(p => p[7].i == 0 && p[7].wh == go)
          downPin[4] = downPin[5] = 90
          lowerPin(downPin)
        }
      }
    }
  },

  { /* * * LEVEL 2 * * */
    name: 'Inferno',
    info: 'all hope abandon ye who enter here',
    async bg(lvlNum) {
      this.bg = []
      let base = await getBasePic(lvlNum)
      if (base && base.width==w && base.height==h) {
        log('We have a pic cache for Inferno level!')
      } else {
        // ctxFloor.fillStyle = mkRadGrad(
        //   50*u, hCenter*u, 40*u,
        //   50*u, hCenter*u, 60*u,
        //   '#B10', 'rgba(0,0,0,0)'
        // )
        ctxFloor.clearRect(0, 0, w, h)
        // Add a texture on this:
        drawCircle(ctxFloor, 50*u, hCenter*u, [46*u, 66*u], '#D00')
        let grad = ctxFloor.createLinearGradient(0,2, 0,h+2)
        mapFor(0,166,1,(i)=> {
          if (i%2) {
            grad.addColorStop((i+.5)/166, '#400')
          } else {
            grad.addColorStop(i/166, '#A32')
          }
        })
        ctxFloor.fillStyle = grad
        ctxFloor.fillRect(46*u, 154.5*u, 30*u, 8.1*u)
        ctxFloor.fillRect(66*u, 136.7*u, 10*u, 20*u)
        ctxFloor.fillRect(5*u, 6*u, 20*u, 40*u)
        base = getFloorImageData()

        // ;[
        //   [49*vw, 50*vh],
        //   [19*vw, 42*vh],
        //   [54*vw, 30*vh],
        //   [80*vw, 62*vh],
        // ].map(([x, y], i)=> {
        //   let fill = f === i
        //            ? mkRadGrad(x,y,u/2, x,y,2*u, '#F20', '#800')
        //            : mkRadGrad(x,y,u/2, x,y,2*u, '#900', '#500')
        //   drawCircle(ctxFloor, x, y, 2*u, fill)
        // })
        addBasePic(lvlNum, base)
      }
      this.bg.push(base)
    },
    bgFreq: 500,
    ballStart: [50, bottom(8)],
    out(ball) {
      return ball.x < 0 || ball.x > 100 ||
             ball.y < 0 || ball.y > hMax
    },
    pins: [
      ...mapFor(1, 13, 1, (x)=>
        mapFor(1, 20, 1, (y)=> {
          if ((x+y)%2 == 0
          && hypotenuse(x*7.16-50, y*7.57-hCenter)>28
          && hypotenuse((x*7.16-50)*1.1, (y*7.57-hCenter)*.75)<50) {
            return ((x**2+y)%7 == 0)
            ? [x*7.16, y*7.57, 1.5, 4,  0,20,10]
            : [x*7.16, y*7.57, 1.5, 4,  0,90,30]
          }
        })
      ).flat().filter(pin => pin)
    ],
    wallsV: [
      [45, bottom(10), 5, 4,  0,100,60,.4]
    ],
    wallsH: [
      [47, bottom(3), 25, 4,  0,100,60,.4]
    ],
    bh: [[50, hCenter, 20]], // Blackhole [x, y, ray]
    wh: [[15, 15, 6, 3]], // Wormhole [x, y, ray, destination]
    on: {
      tic() {
        // TODO: Make black ones to pulse
        const angle = Date.now() / 5000
        let x = cos(angle)*35 + 50
        let y = sin(angle)*35 + hCenter
        // curLevel.pins[0][0] = x
        // curLevel.pins[0][1] = y
        curLevel.pins.map(p => {
          if ( hypotenuse(p[0]-x, p[1]-y) < 10 ) {
            lowerPin(p)
          } else {
            risePin(p, 4)
          }
        })
      }
    }
  },

  { /* * * LEVEL 3 * * */
    name: 'Clones',
    info: 'freed all of them!',
    async bg(lvlNum) {
      this.bg = []
      let base = await getBasePic(lvlNum)
      if (base && base.width==w && base.height==h) {
        log('We have a pic cache for Clones level!')
      } else {
        ctxFloor.fillStyle = '#060'
        ctxFloor.fillRect(0,0,w,h)
        base = getFloorImageData()
        addBasePic(lvlNum, base)
      }
      this.bg.push(base)
    },
    bgFreq: 500,
    ballStart: [50, hCenter],
    out(ball) {
      return ball.x < 0 || ball.x > 100 ||
             ball.y < 0 || ball.y > hMax
    },
    pins: [
    ],
    wallsV: [],
    wallsH: [],
    bh: [],
    wh: [
      [10, 10, 6, 4],
    ],
    on: {}
  },

  { /* * * LEVEL 4 * * */
    name: 'Minefield',
    info: 'Caution!',
    async bg(lvlNum) {
      this.bg = []
      let base = await getBasePic(lvlNum)
      if (base && base.width==w && base.height==h) {
        log('We have a pic cache for Minefield level!')
      } else {
        ctxFloor.fillStyle = '#C90'
        ctxFloor.fillRect(0,0,w,h)
        base = getFloorImageData()
        addBasePic(lvlNum, base)
      }
      this.bg.push(base)
    },
    bgFreq: 500,
    ballStart: [50, hCenter],
    out(ball) {
      return ball.x < 0 || ball.x > 100 ||
             ball.y < 0 || ball.y > hMax
    },
    pins: [
    ],
    wallsV: [],
    wallsH: [],
    bh: [],
    wh: [
      [10, 10, 6, 5],
    ],
    on: {}
  },

  { /* * * LEVEL 5 * * */
    name: 'Solaris',
    info: '',
    async bg(lvlNum) {
      this.bg = []
      let base = await getBasePic(lvlNum)
      if (base && base.width==w && base.height==h) {
        log('We have a pic cache for Solaris level!')
      } else {
        ctxFloor.fillStyle = '#FC0'
        ctxFloor.fillRect(0,0,w,h)
        base = getFloorImageData()
        addBasePic(lvlNum, base)
      }
      this.bg.push(base)
    },
    bgFreq: 500,
    ballStart: [50, hCenter],
    out(ball) {
      return ball.x < 0 || ball.x > 100 ||
             ball.y < 0 || ball.y > hMax
    },
    pins: [
    ],
    wallsV: [],
    wallsH: [],
    bh: [],
    wh: [
      [10, 10, 6, 1],
    ],
    on: {}
  }

]

function lowerPin(pin, repeat) {
  if (pin.lowTO && !repeat) return;
  if (pin.riseTO) clearTimeout(pin.riseTO)
  delete pin.riseTO
  pin[3] -= .1
  // TODO: make it with downPinProp
  //pin[6] = (pin[3]*10 + pin[6]) / 2
  if (pin[3] <= 0) pin[3] = 0
  else pin.lowTO = setTimeout(()=> lowerPin(pin, 1), 60)
}
function risePin(pin, h, repeat) {
  if (pin.riseTO && !repeat) return;
  if (pin.lowTO) clearTimeout(pin.lowTO)
  delete pin.lowTO
  pin[3] += .1
  if (pin[3] >= h) pin[3] = h
  else pin.riseTO = setTimeout(()=> risePin(pin, h, 1), 60)
}

function downPinProp(pin, prop, to=0, step=2) {
  pin[prop] -= step
  if (pin[prop] <= to) pin[prop] = to
  else setTimeout(()=> downPinProp(pin, prop, to, step), 60)
}

const getFloorImageData = ()=> ctxFloor.getImageData(0, 0, w, h)
