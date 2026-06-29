(function() {
  'use strict';
  if (document.getElementById('__qqmail_titlebar')) return;


  const TITLEBAR_H = 32;
  const INVOKE = window.__TAURI_INTERNALS__?.invoke;
  if (!INVOKE) return;

  // 开启自动深色模式
  DarkReader.auto({
    brightness: 90,
    contrast: 110,
    sepia: 0
  });

  // ── 样式 ──────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #__qqmail_titlebar {
      position: fixed; top:0; left:0; right:0; z-index:2147483647;
      height:${TITLEBAR_H}px; min-height:${TITLEBAR_H}px;
      display:flex; align-items:center; justify-content:space-between;
      background-color:transport; color:#374151;
      font-family:system-ui,'Segoe UI',sans-serif; font-size:13px;
      user-select:none;
      pointer-events: none;
    }
    #__qqmail_titlebar.dark {
      background-color:transport; color:#e5e7eb;
    }
    #__qqmail_titlebar .__label {
      display:flex; align-items:center; gap:8px; padding-left:12px;
      height:100%; flex:1; font-weight:500;
    }
    #__qqmail_titlebar .__icon { font-size:16px; }
    #__qqmail_titlebar .__ctrls { display:flex; height:100%;pointer-events: all; }
    #__qqmail_titlebar .__btn {
      width:46px; height:100%; border:none; background:transparent;
      color:inherit; display:flex; align-items:center; justify-content:center;
      cursor:pointer; outline:none; transition:background .1s;
    }
    #__qqmail_titlebar .__btn:hover { background-color:rgba(0,0,0,.08)}
    #__qqmail_titlebar.dark .__btn:hover { background-color:rgba(70,70,70)}
    #__qqmail_titlebar .__btn:active { background:rgba(128,128,128,.2); }
    #__qqmail_titlebar .__btn--close:hover { background:#e81123 !important; color:#fff; }
    #__qqmail_titlebar .__btn svg { pointer-events:none; }
    #__qqmail_titlebar .__btn.blur,#__qqmail_titlebar .__btn--close.blur{background:none !important;color:inherit}
    #mailMainApp .frame-header{padding-top:20px;height:80px;}
    #root .login-page-header,.accounts-list-page-header{padding-top:20px;}
    .login-page-header>.header-left{pointer-events:none;}
  `;
  document.head.appendChild(style);

  // ── 标题栏 HTML ───────────────────────────
  const bar = document.createElement('div');
  bar.id = '__qqmail_titlebar';
  bar.innerHTML = `
    <div class="__label">
      
    </div>
    <div class="__ctrls">
      <button class="__btn" id="__btn_min" title="最小化">
        <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="5.5" width="10" height="1" fill="currentColor"/></svg>
      </button>
      <button class="__btn" id="__btn_max" title="最大化">
        <svg id="__svg_max" width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
        <svg id="__svg_restore" width="12" height="12" viewBox="0 0 12 12" style="display:none"><rect x="2" y="0" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/><rect x="0" y="4" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/></svg>
      </button>
      <button class="__btn __btn--close" id="__btn_close" title="关闭">
        <svg width="12" height="12" viewBox="0 0 12 12"><line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.2"/><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1.2"/></svg>
      </button>
    </div>
  `;
  document.body.prepend(bar);

  // ── 窗口控制 ──────────────────────────────
  const minBtn = document.getElementById('__btn_min')
  minBtn.onclick = () => {
    INVOKE('plugin:window|minimize')
    minBtn.classList.add('blur');
  };
  minBtn.onmouseenter = () => minBtn.classList.remove('blur');

  const closeBtn = document.getElementById('__btn_close')
  closeBtn.onclick = () => {
    // 根据有无托盘采取不同行为
    if (window.noTray){
      INVOKE('plugin:window|close')
    }else{
      INVOKE('plugin:window|hide')
    }
    
    closeBtn.classList.add('blur');
  };
  closeBtn.onmouseenter = () => closeBtn.classList.remove('blur');

  const btnMax = document.getElementById('__btn_max');
  btnMax.onclick = () => INVOKE('plugin:window|toggle_maximize');

  async function updateMaxState() {
    try {
      const maximized = await INVOKE('plugin:window|is_maximized');
      btnMax.title = maximized ? '还原' : '最大化';
    } catch(e) {}
  }

  updateMaxState();
  window.addEventListener('resize', updateMaxState);


  // ── 主题跟随 ──────────────────────────────
  function updateTheme(e) {
    bar.classList.toggle('dark', e.matches);
    window.setTrayIcon(window.EmailMode);
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', updateTheme);
  bar.classList.toggle('dark', media.matches);

})();
