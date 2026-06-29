use ::tauri::Manager;
use base64::Engine;
use tauri::webview::WebviewWindowBuilder;
use tauri_plugin_log::{Target, TargetKind};

fn inject_scripts(window: &tauri::WebviewWindow<tauri::Wry>) {
    let script0 = include_str!("../injected/link-handler.js");
    let script = include_str!("../injected/titlebar.js");
    let script2 = include_str!("../injected/notify.js");
    let script3 = include_str!("../injected/darkreader.js");
    let script4 = include_str!("../injected/tray.js");
    let script5 = include_str!("../injected/nanoid.js");

    // 将通知音频编码为 base64 注入 JS，避免 IPC ACL 限制
    let wav_bytes = include_bytes!("../assets/Windows Notify Calendar.wav");
    let b64 = base64::engine::general_purpose::STANDARD.encode(wav_bytes);
    let audio_inject = format!(
        "window.__QQMAIL_NOTIFY_SOUND='data:audio/wav;base64,{}';",
        b64
    );

    // link-handler 应该最先注入，以便它能拦截后续脚本中的 window.open 重写
    let _ = window.eval(script0);
    let _ = window.eval(&audio_inject);
    let _ = window.eval(script5);
    let _ = window.eval(script4);
    let _ = window.eval(script3);
    let _ = window.eval(script);
    let _ = window.eval(script2);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                ])
                .build(),
        )
        .plugin(qqmail::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let window = app.get_webview_window("main").expect("no main window");
            window.unminimize().expect("恢复失败");
            window.show().expect("显示失败");
            window.set_focus().expect("聚焦失败");
        }))
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let config = app.config();
            let main_window_config = &config.app.windows[0];
            let data_path = app.path().app_data_dir().unwrap();
            // 修复自启动时工作目录错误导致找不到扩展文件的问题
            // 使用 current_exe 而非 current_dir，因为自启动时工作目录可能是 System32
            let exe_dir = std::env::current_exe().unwrap().parent().unwrap().to_path_buf();
            std::env::set_current_dir(&exe_dir).ok();
            // 指定加载扩展的根路径
            let ext_path = exe_dir.join("extensions");
            // let icon = Image::from_path("assets/tray-loading.png").unwrap();
            let _window = WebviewWindowBuilder::from_config(app.handle(), main_window_config)?
                .data_directory(data_path)
                .browser_extensions_enabled(true)
                .extensions_path(ext_path)
                .on_page_load(move |w, _payload| {
                    inject_scripts(&w);
                })
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("在运行 Tauri 应用进程时出现了错误");
}
