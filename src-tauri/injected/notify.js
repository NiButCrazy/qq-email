(function() {
// const { sendNotification, } = window.__TAURI__.notification;

if (window.hasNotify) return;
window.hasNotify = true;

// 要监听的目标元素
const targetNode = document.getElementById('mailMainApp');

// 配置选项：监听子元素的新增、删除和属性变化
const config = {
  childList: true,      // 监听直接子节点的增删
  subtree: false,       // 监听所有后代节点的变化（若需要监听深层子元素）
};

let hasLoaded = false;

const listen = window.__TAURI__.event.listen;
const invoke = window.__TAURI__.core.invoke;
const notifyCallbackMap = {}

// 监听通知回调
listen('notify-activated', (event) => {
  notifyCallbackMap[event.payload] && notifyCallbackMap[event.payload]()
});

// 基础通知
window.QQ_notification = async ( title, text, callback=()=>{} )=>{
  const id = nanoid()
  notifyCallbackMap[id] = callback
  const result = await invoke('plugin:qqmail|notification', { 
    title: title,
    text: text,
    id: id
  });
}



const numObserver = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // 监听文本内容变化
    if (mutation.type === 'characterData') {
      const text = mutation.target.textContent;
      window.setTrayTooltip(text + ' 条未读邮件')
    }
  });
});

// 回调函数：当收件箱菜单发生变化时执行
const inboxCallback = function(mutationsList) {
  for (const mutation of mutationsList) {
    // 添加元素
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node;
          if (element.classList.contains('sidebar-menu-total')){
            // console.log('添加未读邮箱计数:', element);
            window.setTrayIcon('open')
            numObserver.observe(element.firstChild, {
              characterData: true,        // 监听文本节点内容变化
            });
            console.log('开始监听邮件计数器')
            window.setTrayTooltip(element.innerText + ' 条未读邮件')
          }
        }
      })
    }
    // 删除元素
    if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
      mutation.removedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node;
          if (element.classList.contains('sidebar-menu-total')){
            // console.log('移除未读邮箱计数:', element);
            numObserver.disconnect();
            console.log('停止监听邮箱计数器');
            // 重置托盘图标
            window.setTrayTooltip()
            window.setTrayIcon('loaded')
          }
        }
      })
    }
  }
}


// 回调函数：当主页面加载变化发生时执行
const callback = function(mutationsList) {
  for (const mutation of mutationsList) {
    // 1. 处理新增的节点
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node;
          if (!hasLoaded && element.classList.contains('frame-body')){
            console.log('主页面加载完毕');
            hasLoaded = true;

            // 给顶部栏设置成可拖拽
            document.querySelector('.frame-header').setAttribute('data-tauri-drag-region', '')
            // 捕获收件箱菜单
            const inboxMenu = element.querySelector(".sidebar-menu-content")
            const observer = new MutationObserver(inboxCallback);
            observer.observe(inboxMenu, config);
            console.log('开始监听收件箱菜单')

            const emailNum = inboxMenu.querySelector('.sidebar-menu-total')
            if (emailNum) {
              window.setTrayIcon('open')
              numObserver.observe(emailNum.firstChild, {
                characterData: true,        // 监听文本节点内容变化
              });
              console.log('开始监听邮件计数器')
              window.setTrayTooltip(emailNum.innerText + ' 条未读邮件')
            }else{
              window.setTrayIcon('loaded')
              window.setTrayTooltip()
            }
          }
          // 分别检查是否包含两个类
          if (element.classList.contains('xmail-page-notify-card') && 
              element.classList.contains('page-notify-card-show')) {
              console.log('邮箱通知元素:', element);
              const avatarImgElement = element.querySelector('.ui-avatar-img');
              const infoNameElement = element.querySelector('.page-notify-info-name');
              const infoTitleElement = element.querySelector('.page-notify-info-title');
              const avatarImgSrc = avatarImgElement.src;
              const infoName = infoNameElement.textContent;
              const infoTitle = infoTitleElement.textContent;
              // const notify = new Notification(infoName, { 
              //     body: infoTitle, 
              //     icon: avatarImgSrc,
              //   });
              // if (window.__QQMAIL_NOTIFY_SOUND) {
              //   new Audio(window.__QQMAIL_NOTIFY_SOUND).play();
              // }
              QQ_notification(infoName, infoTitle, ()=>{
                element.click()
                showAppWindow()
              })

              window.setTrayIcon('open')
              // 任务栏强调闪烁
              appWindow.requestUserAttention('Critical')
          }
        }
        // 可以在这里对新加入的节点做额外处理
      });
    }
  }
};

if (targetNode) {
  // 创建观察者实例并开始监听
  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
  console.log('开始监听全局加载节点')
  
  // 如果需要停止监听
  // observer.disconnect();
  return
}
const loginHeader = document.querySelector('.login-page-header');
if (loginHeader){
  return loginHeader.setAttribute('data-tauri-drag-region', '')
}
const accountsHeader = document.querySelector('.accounts-list-page-header');
if (accountsHeader){
  return accountsHeader.setAttribute('data-tauri-drag-region', '')
}
})();