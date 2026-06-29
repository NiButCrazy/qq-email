const COMMANDS: &[&str] = &[
    "notification"
    ];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
