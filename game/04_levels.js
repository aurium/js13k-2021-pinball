let curLevel
const levels = [

  { /* * * LEVEL 0 * * */
    async bg() {
      this.bg = []
      // Create base image:
      for (let x=0; x<w; x++) for (let y=0; y<h; y++) {
        ctxFloor.fillStyle = `hsl(${240+(y/h)*70},100%,20%)`
        ctxFloor.fillRect(x,y,1,1)
      }
      const base = await mkBGStars(6, .52, 35, -128)
      // Create Frames:
      ctxFloor.lineWidth = u/2
      for (let f=1; f<7; f++) {
        ctxFloor.clearRect(0,0,w,h)
        await promiseAfterScreenUpdate()
        ctxFloor.putImageData(base, 0, 0)
        for (let i=1; i<6; i++) {
          [
            [50*vw + i*u*6, 50*vh],
            [50*vw - i*u*6, 50*vh],
            [50*vw, 50*vh + i*u*6],
            [50*vw, 50*vh - i*u*6]
          ].map(([x, y])=> {
            let fill = f%6 === i
                     ? mkRadGrad(x,y,u/2, x,y,2*u, '#F20', '#800')
                     : mkRadGrad(x,y,u/2, x,y,2*u, '#900', '#500')
            drawCircle(x, y, 2*u, fill)
          })
        }
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
        this.bg.push(ctxFloor.getImageData(0, 0, w, h))
      }
    },
    bgFreq: 300,
    pins: [
      [50, 130, 2, 6,   0,100,50],
      [20,  84, 6, 5,  90,100,25],
      [50,  37, 3, 4, 180, 30,50],
      [80,  84, 3, 3, 270,100,50],

      [15,  20, 2, 4,   0,  0,25],
      [15,  25, 2, 4,   0,  0,25],
      [15,  30, 2, 4,   0,  0,25],
      [15,  35, 2, 4,   0,  0,25],
      [15,  40, 2, 4,   0,  0,25],

      [20,  20, 2, 4,   0,  0,25],
      [20,  25, 2, 4,   0,  0,25],
      [20,  30, 2, 4,   0,  0,25],
      [20,  35, 2, 4,   0,  0,25],
      [20,  40, 2, 4,   0,  0,25],

      [25,  20, 2, 4,   0,  0,25],
      [25,  25, 2, 4,   0,  0,25],
      [25,  30, 2, 4,   0,  0,25],
      [25,  35, 2, 4,   0,  0,25],
      [25,  40, 2, 4,   0,  0,25],

      [85,  10, 2, 4,   0,  0,25],
      [85,  20, 2, 4,   0,  0,25],
      [85,  25, 2, 4,   0,  0,25],
      [85,  30, 2, 4,   0,  0,25],
      [85, 145, 2, 4,   0,  0,25],
      [85, 155, 2, 4,   0,  0,25],

      [80,  10, 2, 4,   0,  0,25],
      [80,  20, 2, 4,   0,  0,25],
      [80, 145, 2, 4,   0,  0,25],
      [80, 155, 2, 4,   0,  0,25],

      [75,  10, 2, 4,   0,  0,25],
      [75,  20, 2, 4,   0,  0,25],
      [75, 145, 2, 4,   0,  0,25],
      [75, 155, 2, 4,   0,  0,25],

      [20,  10, 2, 4,   0,  0,25],
      [20, 145, 2, 4,   0,  0,25],
      [20, 155, 2, 4,   0,  0,25],
      [25,  10, 2, 4,   0,  0,25],
      [25, 145, 2, 4,   0,  0,25],
      [25, 155, 2, 4,   0,  0,25],
    ],
    wallsV: [
      //[ 28, 19,  17, 4,   0,40,40,.8],
      [ 10, 30, 100, 4,   0,40,40,.6],
      [ 90, 16, 150, 4,  90,40,40,.6]
    ],
    wallsH: [
      [ 20, 15,  69, 4, 180,40,40,.6],
      [ 20, 150, 69, 4, 180,40,40,.6]
    ]
  },

  { /* * * LEVEL 1 * * */
    async bg() {
      this.bg = []
      // Create base image:
      const base = ctxFloor.getImageData(0, 0, w, h)
      // const base = mkBGJulia(5, .511, -5, -24, 500, 150, 2.5, (x,y)=>
      //   `${hypotenuse(x-.5,y-.5)*500},100%,40%`
      // )
      // Create Frames:
      ctxFloor.lineWidth = u/2
      for (let f=1; f<6; f++) {
        ctxFloor.putImageData(base, 0, 0)
        for (let i=1; i<6; i++) {
          [
            [50*vw + i*u*8, 50*vh],
            [50*vw - i*u*8, 50*vh],
            [50*vw, 50*vh + i*u*8],
            [50*vw, 50*vh - i*u*8]
          ].map(([x, y])=> {
            let fill = f === i
                     ? mkRadGrad(x,y,u/2, x,y,2*u, '#F20', '#800')
                     : mkRadGrad(x,y,u/2, x,y,2*u, '#900', '#500')
            drawCircle(x, y, 2*u, fill)
          })
        }
        this.bg.push(ctxFloor.getImageData(0, 0, w, h))
      }
    },
    bgFreq: 500,
    pins: [
      [50, 130, 2, 6,   0,100,50],
      [20,  84, 6, 5,  90,100,25],
      [50,  37, 3, 4, 180, 30,50],
      [80,  84, 3, 3, 270,100,50]
    ],
    walls: [
      [1,  10, 37, 130,   0,40,40],
      [1,  90, 16, 130,  90,40,40],
      [0,  15, 20,  89, 180,40,40]
    ]
  }

]
