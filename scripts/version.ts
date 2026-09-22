import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import packageJson from "../package.json" with { type: "json" };
import { fileURLToPath } from "url";


const { version } = packageJson;

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  gray: "\x1b[30m",
};

// 手动模拟 __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

(() => {
  const tomlPath = resolve(__dirname, "..", "src-tauri", "Cargo.toml");
  try {
    let content = readFileSync(tomlPath, "utf-8");

    // 修改后的逻辑：
    // 我们只修改 [package] 块下的第一个 version
    // 这样即便 name 和 version 之间有其他字段也能成功
    
    // 匹配 [package] 之后紧跟着的第一个 version = "..."
    // 使用 m 标志进行多行匹配，^ 匹配行首
    const versionMatch = content.match(/^version\s*=\s*"([^"]*)"/m);
    const oldVersion = versionMatch ? versionMatch[1] : "unknown";
    if (oldVersion === version) {
      console.log(`${colors.gray}- 版本号未改变${colors.reset} ${oldVersion}`)
      return;
    }

    const newContent = content.replace(
      /^version\s*=\s*"[^"]*"/m, 
      `version = "${version}"`
    );

    if (content !== newContent) {
      writeFileSync(tomlPath, newContent);
      console.log(`${colors.green}✓${colors.reset} Cargo.toml${colors.reset} ${colors.gray}${oldVersion}${colors.reset} -> ${colors.bold}${colors.green}${version}${colors.reset}`);
    }
  } catch (err:any) {
    console.error(`${colors.red}✕${colors.reset} 无法更新 Cargo.toml 版本号: ${colors.red}${err.message}${colors.reset}`);
  }
})();
