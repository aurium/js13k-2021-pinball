let curLevel
const bottom = (num)=> hMax - num

const levels = [

  { /* * * LEVEL 0 * * */
    info: 'You can use the wormhole to travell to another level, but avoid the blackhole!',
    async bg() {
      this.bg = []
      // Create base image:
      for (let x=0; x<w; x++) for (let y=0; y<h; y++) {
        ctxFloor.fillStyle = `hsl(${240+(y/h)*70},100%,20%)`
        ctxFloor.fillRect(x,y,1,1)
      }
      const base = await mkBGStars(6, .52, 35, -128)
      // TODO: Write Blackhole and WormHole
      // const base = getFloorImageData()
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
    async bg() {
      this.bg = []
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

      const base = getFloorImageData()

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
    async bg() {
      return this.bg = []

      ;[
        [49*vw, 50*vh],
        [19*vw, 42*vh],
        [54*vw, 30*vh],
        [80*vw, 62*vh],
      ].map(([x, y], i)=> {
        let fill = f === i
                 ? mkRadGrad(x,y,u/2, x,y,2*u, '#F20', '#800')
                 : mkRadGrad(x,y,u/2, x,y,2*u, '#900', '#500')
        drawCircle(ctxFloor, x, y, 2*u, fill)
      })

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
    bh: [

    ],
    wh: [
      [10, 10, 6, 3],
    ],
    on: {}
  },

  { /* * * LEVEL 3 * * */
    name: 'Clones',
    info: 'freed all of them!',
    async bg() {
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
      [10, 10, 6, 0],
    ],
    on: {}
  },

  { /* * * LEVEL 4 * * */
    name: 'Minefield',
    info: 'Caution!',
    async bg() {
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
      [10, 10, 6, 0],
    ],
    on: {}
  },

  { /* * * LEVEL 5 * * */
    name: 'Solaris',
    info: '',
    async bg() {
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
      [10, 10, 6, 0],
    ],
    on: {}
  }

]

function lowerPin(pin) {
  pin[3] -= .1
  pin[6] = (pin[3]*10 + pin[6]) / 2
  if (pin[3] <= 0) pin[3] = 0
  else setTimeout(()=> lowerPin(pin), 60)
}

function downPinProp(pin, prop, to=0, step=2) {
  pin[prop] -= step
  if (pin[prop] <= to) pin[prop] = to
  else setTimeout(()=> downPinProp(pin, prop, to, step), 60)
}

const getFloorImageData = ()=> ctxFloor.getImageData(0, 0, w, h)
