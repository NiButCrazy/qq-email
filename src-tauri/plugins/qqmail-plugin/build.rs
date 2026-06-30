const COMMANDS: &[&str] = &[
    "notification",
    "register_email_client",
    "is_email_client_registered",
    ];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
