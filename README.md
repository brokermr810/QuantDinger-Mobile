# QuantDinger Mobile

📱 QuantDinger 移动端应用 - 基于 Vue 3 + Capacitor

## 技术栈

- **Vue 3** - 前端框架
- **Vite** - 构建工具
- **Capacitor 6** - 跨平台打包
- **Vant 4** - 移动端 UI 组件库
- **Pinia** - 状态管理
- **Vue Router 4** - 路由管理

## 项目结构

```
QuantDinger-Mobile/
├── src/
│   ├── api/          # API 接口
│   ├── assets/       # 静态资源
│   ├── components/   # 公共组件
│   ├── router/       # 路由配置
│   ├── stores/       # Pinia 状态
│   ├── styles/       # 全局样式
│   ├── utils/        # 工具函数
│   ├── views/        # 页面组件
│   ├── App.vue       # 根组件
│   └── main.js       # 入口文件
├── android/          # Android 原生项目（需要运行 cap add android）
├── ios/              # iOS 原生项目（需要运行 cap add ios）
├── capacitor.config.json  # Capacitor 配置
├── vite.config.js    # Vite 配置
└── package.json
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（H5）
npm run dev

# 构建生产版本
npm run build

# 添加 Android 平台
npx cap add android

# 添加 iOS 平台（需要 Mac）
npx cap add ios

# 同步代码到原生项目
npm run cap:sync

# 打开 Android Studio
npm run cap:android

# 打开 Xcode（需要 Mac）
npm run cap:ios

# 一键构建 Android
npm run build:android

# 一键构建 iOS
npm run build:ios
```

## 配置后端地址

在设置页面配置服务器地址，例如：
- 本地开发：`http://localhost:8000`
- 局域网：`http://192.168.1.100:8000`
- 公网：`https://your-domain.com`

## 打包 APK

1. 运行 `npm run build:android`
2. 打开 Android Studio
3. Build → Generate Signed Bundle / APK
4. 选择 APK，配置签名
5. 选择 release 版本
6. 生成 APK

## 打包 IPA（需要 Mac）

1. 运行 `npm run build:ios`
2. 打开 Xcode
3. Product → Archive
4. Distribute App

## 功能规划

- [x] 首页 - 账户概览、策略状态、最近信号
- [x] 行情 - 自选列表、实时价格
- [x] 策略 - 策略列表、启动/停止
- [x] 通知 - 信号通知列表
- [x] 设置 - 服务器配置、通知设置
- [ ] K 线图表
- [ ] 推送通知
- [ ] 生物识别登录

## 注意事项

1. 当前 Node 版本（18.x）与部分依赖的推荐版本不完全匹配，但功能正常
2. 如遇问题，建议升级 Node 到 20.x 或 22.x
3. iOS 打包需要 Mac 和 Apple 开发者账号
