/* INI DEBUG */
if (isMainThread && ['localhost','0.0.0.0'].includes(document.location.hostname)) {
  setInterval(()=> fetch('/update?t='+Date.now())
    .then(response => response.text())
    .then(update => {
      const updateDate = new Date(update.trim().replace('_', 'T'))
      const buildDate = new Date('#BUILD#'.replace('_', 'T'))
      if (updateDate > buildDate) document.location.reload()
    })
    , 1500)
}
/* END DEBUG */
