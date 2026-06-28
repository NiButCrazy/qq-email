// 防止在 Windows 发布版本中增加控制台窗口, 不要移除!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    qq_email_lib::run()
}
