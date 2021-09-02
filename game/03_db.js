const dbName = gameBaseKey+'DB'
const picsStoreName = 'basePics'
let gameDB

if (isMainThread) {

  let reqDB
  if (typeof(indexedDB) == 'object' && indexedDB) {
    reqDB = indexedDB.open(dbName, #BUILD#)
  } else {
    gameDB = { __FAIL: 1 }
  }

  reqDB.onerror = ()=> {
    console.log('Oh man... Cant open game DB.')
    if (gameDB) gameDB.__FAIL = 1
  }

  reqDB.onupgradeneeded = ()=> {
    log('DB must to upgrade to version', #BUILD#)
    gameDB = reqDB.result
    if ([...gameDB.objectStoreNames].includes(picsStoreName)) {
      // Clean existent data (I have no time to write migrations):
      gameDB.deleteObjectStore(picsStoreName)
    }
    // Create the object store for level floor base pics:
    const picsStore = gameDB.createObjectStore(picsStoreName, { keyPath: 'lvl' })
    picsStore.transaction.oncomplete = (ev)=> log('Game DB v#BUILD# is created') // DEBUG
  }

  reqDB.onsuccess = ()=> {
    log('DB loaded version', #BUILD#)
    gameDB = reqDB.result
    gameDB.__OK = 1
  }
}

function picsStoreReadWriteTransaction() {
  if (gameDB && gameDB.__FAIL) return Promise.reject(Error('No DB'))
  if (!gameDB || !gameDB.__OK) {
    return promiseTimeout(50).then(picsStoreReadWriteTransaction)
  }
  const transaction = gameDB.transaction([picsStoreName], 'readwrite');
  transaction.oncomplete = (ev)=> log('Transaction complete.') // DEBUG
  return Promise.resolve(transaction.objectStore(picsStoreName))
}

async function addBasePic(lvl, imgData) {
  const { data, width, height } = imgData
  imgData = { lvl, data, width, height }
  log('Saving base image for level', levels[lvl].name)
  const picsStore = await picsStoreReadWriteTransaction()
  const req = picsStore.add(imgData)
  return new Promise((resolve, reject)=> {
    req.onsuccess = resolve
    req.onerror = async (ev)=> { // add() wont work. May key exists... Try put()
      const picsStore = await picsStoreReadWriteTransaction()
      const req2 = picsStore.put(imgData)
      req2.onerror = (ev)=> reject(Error(`Cant save pic ${imgData.lvl}. ${ev.target.error.message}`))
      req2.onsuccess = resolve
    }
  })
}

async function getBasePic(lvl) {
  const picsStore = await picsStoreReadWriteTransaction()
  const req = picsStore.get(lvl)
  return new Promise((resolve, reject)=> {
    req.onerror = ()=> reject(Error('Cant read pic for', lvl))
    req.onsuccess = ()=> {
      const imgData = req.result
      if (!imgData) resolve()
      else resolve(new ImageData(imgData.data, imgData.width))
    }
  })
}
