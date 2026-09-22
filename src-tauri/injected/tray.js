(async function(){

  if (window.hasTray) return;
  window.hasTray = true;

  // console.log(window.location.pathname);

  const isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
  const trayID = 'qq-email-app-tray'
  console.log(window.__TAURI__)
  const { menu, tray, app, autostart, deepLink, store, core } = window.__TAURI__
  const { invoke } = core

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
  // ---- 开机自启：注册表实际状态 + 用户意图 ----
  // 升级安装时 NSIS 会先调起旧版 uninstall.exe，其 Section Uninstall 里有
  //   DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCTNAME}"
  // 会把 Run 项删掉，界面上的勾就掉了。所以把用户意图存进 store（app data 目录，
  // 升级安装不会清），每次进来对一次，不一致就按意图补回来。
  let autostartStore = null
  try {
    autostartStore = await store.load('settings.json', { autoSave: true })
  } catch (e) {
    console.error('打开设置存储失败，本次不做开机自启自愈:', e)
  }

  const autostartEnabled = () => autostart.isEnabled().catch(() => false)

  // 开关的唯一入口：改注册表 + 记住用户意图（菜单点击与自愈都走它）
  const toggleAutostart = async () => {
    const enabled = !(await autostartEnabled())
    if (enabled) {
      await autostart.enable()
    } else {
      await autostart.disable()
    }
    if (autostartStore) {
      await autostartStore.set('autostart', enabled)
      await autostartStore.save()
    }
    console.log('开机自启: ' + enabled)
    return enabled
  }

  let isAutostart = await autostartEnabled()
  if (autostartStore) {
    const saved = await autostartStore.get('autostart')
    if (typeof saved === 'boolean') {
      // 有记录就按记录纠正（这是升级安装删掉 Run 项后的自愈路径）
      if (saved !== isAutostart) {
        console.log('开机自启与保存的意图不一致，按意图纠正: ' + isAutostart + ' -> ' + saved)
        isAutostart = await toggleAutostart()
      }
    } else {
      // 第一次跑（从没有这个功能的旧版本升上来）：把眼前的状态记成意图。
      // 这里只是记录、不改注册表，所以不会替用户做主；记下来之后，
      // 下次升级安装再把 Run 项删掉时就能自动补回来。
      await autostartStore.set('autostart', isAutostart)
      await autostartStore.save()
      console.log('首次记录开机自启意图: ' + isAutostart)
    }
  }

  const AppMenuTemplate = {
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
          await toggleAutostart()
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
  }

  const hasDeepLink = await deepLink.isRegistered("mailto")
  const isEmailClientRegistered = await invoke('plugin:qqmail|is_email_client_registered').catch(() => false)

  const DeepLink = {
    id: 'deep-link',
    text: '设置为默认邮箱应用',
    action: async () => {
      await deepLink.register("mailto")
      await invoke('plugin:qqmail|register_email_client').catch(e => console.error('注册邮件客户端失败:', e))
      const result = await deepLink.isRegistered("mailto")
      if (result) {
        window.appTray.setMenu((await menu.Menu.new(AppMenuTemplate.items.shift())))
      }
    }
  }

  if (!hasDeepLink || !isEmailClientRegistered) {
    AppMenuTemplate.items.unshift(DeepLink)
  }

  const AppMenu = await menu.Menu.new(AppMenuTemplate);

  const initalIcon = 'assets/tray-loading' + (isDark ? '-dark':'') + '.png'
  window.appTray = await tray.TrayIcon.new({ 
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
