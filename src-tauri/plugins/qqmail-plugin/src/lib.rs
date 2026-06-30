pub mod email_client_registry;

use tauri::{AppHandle, Emitter};
use tauri_winrt_notification::{Sound, Toast};

#[tauri::command]
fn notification(app: AppHandle, title: String, text: String, id: String) {
    Toast::new(Toast::POWERSHELL_APP_ID)
        .title(&title)
        .text1(&text)
        .sound(Some(Sound::Reminder))
        .on_activated(move |_| {
            app.emit("notify-activated", &id).unwrap();
            Ok(())
        })
        .show()
        .expect("unable to toast");
}

#[tauri::command]
fn register_email_client() -> Result<(), String> {
    email_client_registry::register_email_client()
}

#[tauri::command]
fn is_email_client_registered() -> Result<bool, String> {
    email_client_registry::is_email_client_registered()
}

pub fn init() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri::plugin::Builder::new("qqmail")
        .invoke_handler(tauri::generate_handler![
            notification,
            register_email_client,
            is_email_client_registered
        ])
        .build()
}
