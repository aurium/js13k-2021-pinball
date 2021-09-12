log('Is Main Thread?', isMainThread)
let worker, workerIsAlive = 0
if (isMainThread) {
  log('Building worker!')
  worker = new Worker('game.js?cache=#BUILD#')
  worker.onerror = (err)=> { log(err); notify('Worker fail.\n\n' + err.message) }

  worker.onmessage = (ev)=> {
    const [evName, payload] = ev.data;
    //log('Worker msg:', evName)
    if (worker['on_'+evName]) worker['on_'+evName](payload)
    else log('Unknown event', evName)
  }

  worker.$ = (evName, payload)=> worker.postMessage([evName, payload])

  window.goLvl = (index)=> worker.$('goLvl', index)

  worker.on_alive = ()=> workerIsAlive = 1

  /* INI DEBUG */
  // Auto reload when the watching builder updates the code.
  function buildToDate(build) {
    return new Date(build.replace(/(....)(..)(..)(..)(..)(..)/, '$1-$2-$3T$4:$5:$6'))
  }
  if (['localhost','0.0.0.0'].includes(document.location.hostname)) {
    setInterval(()=> fetch('/update?t='+Date.now())
      .then(response => response.text())
      .then(update => {
        const updateDate = new Date(update.trim())
        const buildDate = buildToDate('#BUILD#')
        if (updateDate > buildDate) document.location.reload()
      })
      , 1500)
  }
  /* END DEBUG */

  if (navigator.wakeLock) {
    navigator.wakeLock.request()
    .then(()=> log('Screen locked!'))
    .catch(err=> console.log('Cant lock!', err.message)) // Intentional. console.log will not be removed in production.
  } else {
    log('This browser has no WakeLock feature')
  }

  /* INI DEBUG FPS and Stats */
  scopeShared.stats = { begin(){}, end(){} }
  scopeShared.statBack = { update(){} }
  import('https://mrdoob.github.io/stats.js/build/stats.module.js').then(mod => {
    const Stats = mod.default
    scopeShared.stats = new Stats()
  	scopeShared.statBack = scopeShared.stats.addPanel( new Stats.Panel( 'back', '#ff8', '#221' ) )
  	document.body.appendChild(scopeShared.stats.dom)
    scopeShared.stats.dom.children.map(c => {
      c.style.position = 'relative'
      c.style.display = 'inline-block'
    })
  })
  const fps = $('fps')
  let fpsCounter = 0
  let fpsLast = Date.now()
  function fixNum(n) {
    return (typeof(n)==='number') ? n.toFixed(1) : String(n)
  }
  scopeShared.updateFPS = function() {
    fpsCounter++
    if ((fpsCounter%10) === 0) {
      fps.innerText =
        '#BUILD# ' +
        getRotate() +'deg '+ (~~w+'x'+~~h+' ') +
        'G: '+ fixNum(gravity.x)+', '+fixNum(gravity.y) //+' - '+
        //'FPS: '+ fixNum(1000 / ((Date.now() - fpsLast) / 10)) +
        //' / '+ fixNum(bakFPS)
      fpsLast = Date.now()
    }
  }
  let bakFPS = 0
  worker.on_bakFPS = val => {
    bakFPS = val
    scopeShared.statBack.update(val, 140)
  }
  /* END DEBUG FPS and Stats */

  record = localStorage[localStorageRecordKey] || 12345
  setInterval(()=> {
    if (points > record) {
      localStorage[localStorageRecordKey] = record = points
    }
  }, 500)

  function onWinResize() {
    setTimeout(()=> {
      log('RESIZED!')
      const wOrig = window.innerWidth
      const hOrig = window.innerHeight
      doc.documentElement.className = isMobile ? 'rot' + getRotate() : 'rot90'
      u = isMobile ? getRotate() ? hOrig/100 : wOrig/100 : (hOrig*.6)/100
      vw = u
      vh = u*screenRatio
      canvasFloor.width = canvasShadow.width = canvasPieces.width
      = w = round(vw*100)
      canvasFloor.height = canvasShadow.height = canvasPieces.height
      = h = round(vh*100)
      ctxFloor.mustUpdate = 1
    }, 100)
  }
  onWinResize()
  window.addEventListener('resize', onWinResize)

  ctxFloor = canvasFloor.getContext('2d')
  ctxShadow = canvasShadow.getContext('2d')
  ctxPieces = canvasPieces.getContext('2d')
  window.ctx = ctxPieces // DEBUG

  /// Initialization ///////////////////////////////
  body.classList.add(isMobile ? 'is-mobile' : 'not-mobile')
  var preSetupDone = 0

  log(`Is ${isMobile ? '' : 'NOT'} Mobile.`)
  body.addEventListener('click', ()=> {
    if (preSetupDone) return;
    if (!isMobile) return initGame()
    if (body.requestFullscreen) {
      body.requestFullscreen()
      .then(()=> setTimeout(lockOrientation, 500))
      .catch(err => notify('This game needs the fullscreen mode.\n\n' + err.message))
      .finally(initGame)
    } else {
      notify('Your browser do not have fullscreen API.')
    }
  })
}

function lockOrientation() {
  // Do no works on Firefox Android:
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1610745
  // Failover to CSS lock. However that will also not work properly:
  // https://github.com/mozilla-mobile/fenix/issues/20405
  if (scrOrient.lock)
    scrOrient
    .lock('portrait-primary')
    .then(res => log('Lock OK!'))
    .catch(err => TTS(
      'Please, lock the screen rotation on your mobile configuration.', .8
    ))
  else
    log('This browser has no orientation lock feature! Try failover to CSS.')
}

if (isMainThread && doc.location.search.match(/force-start/)) setTimeout(initGame, 100) // DEBUG
async function initGame() {
  log('Init Game!')
  initAudio()
  TTS('Please wait! It is building!', .8)
  await promiseAfterScreenUpdate()
  preSetupDone = 1
  let sequence = Promise.resolve()
  levels.map((lvl, i)=> sequence = sequence.then(async ()=> {
    $('b').innerText = `Building...\nLevel ${i}  `
    await promiseAfterScreenUpdate()
    let start = Date.now() // DEBUG
    log(`Building BG for ${levels[i].name}...`)
    let onlyLvl = doc.location.search.match(/only-lvl=([0-9]+)/) // DEBUG
    onlyLvl = onlyLvl ? parseInt(onlyLvl[1]) : -1 // DEBUG
    if (onlyLvl == -1 || onlyLvl == i) // DEBUG
      await lvl.bg(i) // Real code!
    else Promise.resolve() // DEBUG
    log(`Building BG for ${levels[i].name} done!`, (Date.now()-start)/1000)
  }))
  await sequence

  log('Set Header BG')
  if (levels[5].bg[0]) {
    ctxFloor.putImageData(levels[5].bg[0], 0, 0)
    $('pre').style.backgroundImage = `url(${canvasFloor.toDataURL()})`
  }
  tryToInitGame()
}

function tryToInitGame() {
  if (!workerIsAlive) return setTimeout(tryToInitGame, 200)
  worker.$('start', doc.location.search.match(/lvl=([0-9]+)/))
  $('b').remove()
  log('Start animation')
  initMusic()
  TTS('The game is started!')
  scopeShared.tic()
}
