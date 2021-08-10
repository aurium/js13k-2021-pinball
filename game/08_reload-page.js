/* INI DEBUG */
if (document.location.hostname === 'localhost') {
  setInterval(()=> fetch('/update?t='+Date.now())
    .then(response => response.text())
    .then(update => {
      const updateDate = new Date(update.trim().replace('_', 'T'))
      const buildDate = new Date('#BUILD#'.replace('_', 'T'))
      if (updateDate > buildDate) document.location.reload()
    })
    , 500)
}
/* END DEBUG */
