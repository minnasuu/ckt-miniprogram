# 编织工具小程序 (CKT Miniprogram)

一个集成了编织工具和趣味 AI 功能的微信小程序。

## 🎯 主要功能

### 织作时光（工具页）
- 📐 像素画板
- 🎨 图案配色
- 🖼️ 图片转像素
- 🌈 提取图片主色
- 🏙️ 图片换色
- 🔢 计数器

### 玩✨（趣味页）
- 📖 **AI 答案之书** - 用 AI 为你的问题提供智慧答案

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd ckt-miniprogram
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置云开发
在 `miniprogram/app.js` 中配置你的云开发环境 ID：
```javascript
wx.cloud.init({
  env: "你的环境ID",
  traceUser: true,
});
```

### 4. 上传云函数（如需使用 AI 答案之书）
参考：[QUICK_START_AI.md](./QUICK_START_AI.md)

## 📚 文档

- [AI 答案之书快速启动](./QUICK_START_AI.md) - 5分钟快速配置
- [AI 答案之书详细配置](./AI_ANSWER_BOOK_SETUP.md) - 完整配置指南
- [AI 集成总结](./AI_INTEGRATION_SUMMARY.md) - 技术实现说明
- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## 🛠️ 技术栈

- 微信小程序
- 微信云开发
- LESS
- AI 扩展（可选）

## 📦 项目结构

```
ckt-miniprogram/
├── miniprogram/              # 小程序源码
│   ├── pages/               # 页面
│   │   ├── tools/          # 工具页面
│   │   └── collects/       # 趣味页面
│   │       └── ai-answer-book/  # AI 答案之书
│   ├── components/          # 组件
│   └── utils/              # 工具函数
├── cloudfunctions/          # 云函数
│   └── getAIAnswer/        # AI 答案之书云函数
└── docs/                   # 文档
```

## 🎨 特色功能

### AI 答案之书
- ✨ 优雅的打字机效果
- 🎨 精美的 UI 设计
- 💫 流畅的动画效果
- 🔄 智能降级机制
- 📱 完美的移动端适配

## 📝 开发说明

### 本地开发
1. 使用微信开发者工具打开项目
2. 配置云开发环境
3. 编译运行

### 云函数部署
```bash
# 使用快速部署脚本
./deploy-ai-answer.sh

# 或在微信开发者工具中右键上传
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

---

**Made with ❤️ for knitting enthusiasts**

