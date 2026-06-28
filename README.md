# Tauri + React + TypeScript 创建模板

个人自用

## 安装使用

```shell
npm create nbc-app < projectName | 可选 >
# yarn create nbc-app < projectName | 可选 >
# pnpm create nbc-app < projectName | 可选 >
```

## 开发调试

```shell
# 下载依赖
pnpm i

# Tauri 常规开发模式
pnpm tauri dev

# [最兼容] Tauri 连接「React Devtools 独立版」开发模式 
pnpm tauri:dev    # 需额外配置 React Devtools

# [最真实] Tauri 窗口直接加载内置的的「汉化版 React Devtools」扩展
pnpm tauri:ext    # 仅 Windows 平台

# [最丰富] Tauri 在外部浏览器中注入 Tauri API，利用浏览器扩展达到近乎完美的前端开发
pnpm tauri:web    # 浏览器打开 localhost:1420 进行开发

# 应用构建
pnpm tauri build

# 版本自增
# 内置 script 脚本，可同时更新 cargo.toml
pnpm version `major | minor | patch`
# ↑↑↑
# 默认使用 git-cliff 生成日志，不喜欢可以把这段命令行删了
```

## 配置 React Devtools
> [!TIP]
> 仅需使用 `pnpm tauri:dev` 时配置

1. 安装 React Devtools 独立版

```shell
pnpm add -D react-devtools
# 或者全局安装
pnpm -g add react-devtools
```

2. 运行 React Devtools 独立版
> [!NOTE]
> 记得单独开一个终端进程
```shell
# 作为项目依赖时
pnpm react-devtools
# 或者全局运行
react-devtools
```

3. 启动特殊 Tauri 开发模式

```shell
pnpm tauri:dev
```

### 第三方库

- #### 生产
    - Immer - 处理状态结构
    - Zustand - 全局状态管理
    - clsx - 样式类名管理工具
    - @tanstack/react-router - 路由管理
    - @unocss/reset - 统一浏览器之间的原生样式
- #### 开发
    - Less - 样式预处理
    - UnoCSS - 原子化 CSS
    - React Compiler - React 性能编译器
    - Eslint - React Hooks 与 Refresh 静态代码检查
    - @tanstack/router-plugin - 集成路由自动生成器插件
    - @tanstack/react-router-devtools - 专用路由调试工具


### 浏览器开发模式
![示例图](./website/screenshots/img.png)



### Windows 平台使用 React Devtools 扩展辅助开发

![示例图](/website/screenshots/img2.png)
