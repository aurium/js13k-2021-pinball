/* INI DEBUG */

function buildToDate(build) {
  return new Date(build.replace(/(....)(..)(..)(..)(..)(..)/, '$1-$2-$3T$4:$5:$6'))
}
if (isMainThread && ['localhost','0.0.0.0'].includes(document.location.hostname)) {
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
