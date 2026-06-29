use tauri_winrt_notification::{ Sound, Toast };
use tauri::{AppHandle, Emitter};

#[tauri::command]
fn notification(app: AppHandle, title: String, text: String, id: String) {
    Toast::new(Toast::POWERSHELL_APP_ID)
        .title(&title)
        .text1(&text)
        .sound(Some(Sound::Reminder))
        .on_activated(move |_|{
            app.emit("notify-activated", &id).unwrap();
            Ok(())
        })
        .show()
        .expect("unable to toast");
}

pub fn init() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri::plugin::Builder::new("qqmail")
        .invoke_handler(tauri::generate_handler![notification])
        .build()
}
