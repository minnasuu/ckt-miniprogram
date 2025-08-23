# updateUserInfo 云函数

## 功能说明
用于更新用户信息的云函数，支持更新用户名和头像。

## 部署步骤

### 1. 安装依赖（重要！）

#### 方法一：使用脚本（推荐）
- **macOS/Linux**: 在终端中运行 `./install-deps.sh`
- **Windows**: 双击运行 `install-deps.bat`

#### 方法二：手动安装
在 `cloudfunctions/updateUserInfo` 目录下执行：
```bash
npm install
```

#### 验证依赖安装
安装成功后，目录中应该包含：
- `node_modules/` 文件夹
- `package-lock.json` 文件

### 2. 上传并部署
在微信开发者工具中：
1. 右键点击 `cloudfunctions/updateUserInfo` 目录
2. 选择【上传并部署：云端安装依赖】
3. 等待部署完成

### 3. 验证部署
部署成功后，可以在云开发控制台的云函数列表中看到 `updateUserInfo` 函数。

## 故障排除

### 常见错误及解决方案

#### 错误：`Cannot find module 'wx-server-sdk'`
**原因**: 依赖没有正确安装
**解决方案**: 
1. 确保在正确的目录下运行 `npm install`
2. 检查是否有 `node_modules` 文件夹
3. 重新安装依赖：`rm -rf node_modules package-lock.json && npm install`

#### 错误：`FunctionName parameter could not be found`
**原因**: 云函数没有正确部署
**解决方案**: 
1. 确保依赖已安装
2. 重新上传并部署云函数
3. 检查云开发控制台中的云函数列表

#### 错误：`Environment not found`
**原因**: 云开发环境配置错误
**解决方案**: 
1. 检查 `miniprogram/app.js` 中的环境ID
2. 确认云开发环境已开通
3. 检查环境ID是否正确

## 数据库要求
需要创建 `users` 集合，包含以下字段：
- `openId`: 用户的openId（主键）
- `username`: 用户名
- `avatar`: 头像URL
- `createTime`: 创建时间
- `updateTime`: 更新时间

## 调用参数
```javascript
{
  userInfo: {
    openId: "用户的openId",
    username: "新用户名",
    avatar: "新头像URL"
  }
}
```

## 返回结果
成功时：
```javascript
{
  success: true,
  message: "用户信息更新成功",
  data: {
    updated: 1
  }
}
```

失败时：
```javascript
{
  success: false,
  message: "错误信息",
  error: "详细错误信息"
}
```

## 开发调试
- 云函数日志可以在云开发控制台的云函数日志中查看
- 前端调用日志可以在微信开发者工具的控制台中查看
