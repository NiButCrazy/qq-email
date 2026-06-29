(async function(){

  if (window.hasTray) return;
  window.hasTray = true;

  // console.log(window.location.pathname);

  const isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
  const trayID = 'qq-email-app-tray'
  // console.log(window.__TAURI__)
  const { menu, tray, app, autostart } = window.__TAURI__

  window.appWindow = new window.__TAURI__.window.Window('main')

  // 显示窗口
  window.showAppWindow = async function() { 
    const isMini = await appWindow.isMinimized()
    const isVisible = await appWindow.isVisible()
    if (isMini) {
      await appWindow.unminimize()
    }else if(!isVisible){
      await appWindow.show()
    }
    appWindow.setFocus()
    console.log('已显示并聚焦窗口')
  }

  if (window.location.pathname !== '/home/index'){
    console.log('非邮箱页面，不创建系统托盘')
    window.noTray = true
    return
  }

  async function click(e) {
    if (e.type === 'Click' && e.button === 'Left' && e.buttonState === 'Up'){
      showAppWindow()
    }
  }
  const isAutostart = await autostart.isEnabled()

  const AppMenu = await menu.Menu.new({
    items: [
      {
        id: 'write',
        text: '写信',
        action: () => {
          showAppWindow()
          document.querySelector('.frame-sidebar-compose-btn').click()
        }
      },
      {
        id: 'autostart',
        text: '开机启动',
        checked: isAutostart,
        action: async () => {
          const isAutostart = await autostart.isEnabled()
          console.log('开机自启: ' + isAutostart)
          if (isAutostart) {
            autostart.disable()
          }else {
            autostart.enable()
          }
        }
      },
      {
        id: 'switch',
        text: '切换账号',
        action: () => {
          location.href = '/'
        }
      },
      {
        id: 'quit',
        text: '退出邮箱',
        action: () => {
          appWindow.close()
        }
      },
    ],
  });

  const initalIcon = 'assets/tray-loading' + (isDark ? '-dark':'') + '.png'
  const appTray = await tray.TrayIcon.new({ 
    tooltip: '加载邮箱中...',
    icon: initalIcon,
    menu: AppMenu,
    menuOnLeftClick: false,
    id: trayID,
    action: click,
  });

  // 刷新页面前先删除上一次的托盘
  window.addEventListener('beforeunload', () => {appTray.close()})

  window.setTrayIcon = (mode) => {
    const isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
    window.EmailMode = mode
    switch (mode) {
      case 'loading':
        appTray.setIcon('assets/tray-loading' + (isDark ? '-dark':'') + '.png')
        break;
      case 'loaded':
        appTray.setIcon('assets/tray' + (isDark ? '-dark':'') + '.png')
        break;
      case 'open':
        const menuActive = document.querySelector('.frame-sidebar-menu.sidebar-menu-active');
        const totalNum = menuActive.querySelector('.sidebar-menu-total')
        const emailNum = totalNum
          ? ('totalNum', parseInt(totalNum.innerText) + 1) : 1
        appTray.setTooltip(`${emailNum} 封未读邮件`)
        appTray.setIcon('assets/tray-open' + (isDark ? '-dark':'') + '.png')
        break;
    }
  }

  window.setTrayTooltip = (text='') => {
    if (text){
      appTray.setTooltip(text)
    }else{
      appTray.setTooltip('QQ 邮箱')
    }
  }
  
})();
