(async function() { 
  const { deepLink, clipboardManager } = window.__TAURI__
  deepLink.onOpenUrl((urls) => {
    console.log('deep link:', urls);
    document.querySelector('.frame-sidebar-compose-btn').click()
    setTimeout(() => {
      const emails = urls[0].split('?')[0].split('@')
      const inputR = document.querySelector('.xmail-cmp-accounts-editor.receiver-editor')
      inputR.click()
      clipboardManager.writeText(urls[0])
    },100)
  });
})()