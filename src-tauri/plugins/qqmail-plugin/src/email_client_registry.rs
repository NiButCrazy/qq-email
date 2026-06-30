/// Windows 邮件客户端注册表操作
///
/// 将应用注册为 Windows 认可的默认电子邮件客户端，
/// 使其出现在 设置 > 默认应用 > 电子邮件 列表中。

#[cfg(windows)]
use winreg::enums::*;
#[cfg(windows)]
use winreg::RegKey;

const APP_NAME: &str = "QQMail";
const APP_DISPLAY_NAME: &str = "QQ 邮箱";
const APP_DESCRIPTION: &str = "QQ 邮箱桌面客户端";

/// 写入完整的邮件客户端注册表项（HKCU，无需管理员权限）
///
/// 注册表布局：
/// - `SOFTWARE\RegisteredApplications` → 指向 Capabilities
/// - `SOFTWARE\Clients\Mail\QQMail` → 应用显示名称
/// - `SOFTWARE\Clients\Mail\QQMail\Capabilities` → 描述、名称、URL关联
/// - `SOFTWARE\Classes\QQMail.mailto` → ProgID
#[cfg(windows)]
pub fn register_email_client() -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("无法获取 exe 路径: {}", e))?;
    let exe_path_str = exe_path.to_string_lossy().to_string();
    let open_cmd = format!("\"{}\" \"%1\"", exe_path_str);

    // 1. RegisteredApplications — 让 Windows 知道此应用
    let (reg_apps, _) = hkcu
        .create_subkey(r"SOFTWARE\RegisteredApplications")
        .map_err(|e| format!("创建 RegisteredApplications 失败: {}", e))?;
    reg_apps
        .set_value(APP_NAME, &r"SOFTWARE\Clients\Mail\QQMail\Capabilities")
        .map_err(|e| format!("设置 RegisteredApplications 值失败: {}", e))?;

    // 2. Clients\Mail\QQMail — 显示名称
    let (clients_mail, _) = hkcu
        .create_subkey(r"SOFTWARE\Clients\Mail\QQMail")
        .map_err(|e| format!("创建 Clients\\Mail\\QQMail 失败: {}", e))?;
    clients_mail
        .set_value("", &APP_DISPLAY_NAME)
        .map_err(|e| format!("设置默认邮件客户端名称失败: {}", e))?;

    // 3. Capabilities
    let (cap, _) = hkcu
        .create_subkey(r"SOFTWARE\Clients\Mail\QQMail\Capabilities")
        .map_err(|e| format!("创建 Capabilities 失败: {}", e))?;
    cap.set_value("ApplicationDescription", &APP_DESCRIPTION)
        .map_err(|e| format!("设置 ApplicationDescription 失败: {}", e))?;
    cap.set_value("ApplicationName", &APP_DISPLAY_NAME)
        .map_err(|e| format!("设置 ApplicationName 失败: {}", e))?;

    // 4. Capabilities\UrlAssociations
    let (url_assoc, _) = hkcu
        .create_subkey(r"SOFTWARE\Clients\Mail\QQMail\Capabilities\UrlAssociations")
        .map_err(|e| format!("创建 UrlAssociations 失败: {}", e))?;
    url_assoc
        .set_value("mailto", &"QQMail.mailto")
        .map_err(|e| format!("设置 mailto URL 关联失败: {}", e))?;

    // 5. Capabilities\StartMenu
    let (start_menu, _) = hkcu
        .create_subkey(r"SOFTWARE\Clients\Mail\QQMail\Capabilities\StartMenu")
        .map_err(|e| format!("创建 StartMenu 失败: {}", e))?;
    start_menu
        .set_value("StartMenu", &APP_DISPLAY_NAME)
        .map_err(|e| format!("设置 StartMenu 失败: {}", e))?;

    // 6. Classes\QQMail.mailto — ProgID
    let (progid, _) = hkcu
        .create_subkey(r"SOFTWARE\Classes\QQMail.mailto")
        .map_err(|e| format!("创建 QQMail.mailto ProgID 失败: {}", e))?;
    progid
        .set_value("", &"QQ Mail mailto Handler")
        .map_err(|e| format!("设置 ProgID 失败: {}", e))?;
    progid
        .set_value("URL Protocol", &"")
        .map_err(|e| format!("设置 URL Protocol 失败: {}", e))?;

    // 7. Classes\QQMail.mailto\shell\open\command
    let (cmd_key, _) = hkcu
        .create_subkey(r"SOFTWARE\Classes\QQMail.mailto\shell\open\command")
        .map_err(|e| format!("创建 shell\\open\\command 失败: {}", e))?;
    cmd_key
        .set_value("", &open_cmd.as_str())
        .map_err(|e| format!("设置打开命令失败: {}", e))?;

    Ok(())
}

/// 检查邮件客户端是否已注册
#[cfg(windows)]
pub fn is_email_client_registered() -> Result<bool, String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    match hkcu.open_subkey(r"SOFTWARE\RegisteredApplications") {
        Ok(reg_apps) => {
            let value: Result<String, _> = reg_apps.get_value(APP_NAME);
            Ok(value.is_ok())
        }
        Err(_) => Ok(false),
    }
}

// 非 Windows 平台的空实现
#[cfg(not(windows))]
pub fn register_email_client() -> Result<(), String> {
    Ok(())
}

#[cfg(not(windows))]
pub fn is_email_client_registered() -> Result<bool, String> {
    Ok(true) // 非 Windows 平台不需要注册
}
