/**
 * QQ邮箱 - 链接拦截脚本
 * 功能：
 *   1. 外部链接 → 在默认浏览器中打开
 *   2. wx.mail.qq.com 链接 → 不干预，原样放行
 */
(function () {
    'use strict';

    function getTauri() {
        return window.__TAURI__;
    }

    function openInBrowser(url) {
        try {
            var tauri = getTauri();
            if (tauri && tauri.opener && tauri.opener.openUrl) {
                tauri.opener.openUrl(url);
            } else if (tauri && tauri.core && tauri.core.invoke) {
                tauri.core.invoke('plugin:opener|open_url', { url: url });
            }
        } catch (e) {
            console.error('[QQ邮箱] 打开链接失败:', e);
        }
    }

    function isMailQQ(url) {
        try {
            var u = new URL(url, window.location.origin);
            return u.hostname === 'wx.mail.qq.com';
        } catch (e) {
            return false;
        }
    }

    // ========== 拦截 window.open() ==========
    var _originalWindowOpen = window.open;
    window.open = function (url, target, features) {
        if (!url || typeof url !== 'string') {
            return _originalWindowOpen.call(window, url, target, features);
        }

        if (url.startsWith('http://') || url.startsWith('https://')) {
            if (isMailQQ(url)) {
                window.location.href = url;
                return window;
            }
            openInBrowser(url);
            return null;
        }

        return _originalWindowOpen.call(window, url, target, features);
    };

    console.log('[QQ邮箱] 链接拦截脚本已注入');
})();
