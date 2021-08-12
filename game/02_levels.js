let curLevel
const levels = [

  { /* * * LEVEL 0 * * */
    bg() {
      log('Building BG "start"...')
      this.bg = []
      // Create base image:
      const base = mkBGJulia(5, -5, -24, .511, 300, 150, 2.5)
      // Create Frames:
      ctxFloor.lineWidth = u/2
      for (let f=1; f<6; f++) {
        ctxFloor.putImageData(base, 0, 0, 0,0, vw*300, vh*300)
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
      log('Building BG "start" done!')
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
