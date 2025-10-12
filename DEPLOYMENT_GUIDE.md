# 云函数部署指南

## 错误说明
`Error: cloud.callFunction:fail Error: errCode: -501000 | errMsg: FunctionName parameter could not be found.`

这个错误表示 `userManagement` 云函数没有部署到云端。

## 解决步骤

### 步骤1：检查云开发环境
1. 在微信开发者工具中，点击"云开发"按钮
2. 确认云开发环境已开通且状态正常
3. 记录环境ID（在 `app.js` 中需要用到）

### 步骤2：部署 userManagement 云函数

#### 方法1：通过微信开发者工具（推荐）
1. 在项目文件树中找到 `cloudfunctions/userManagement` 文件夹
2. 右键点击该文件夹
3. 选择"上传并部署：云端安装依赖"
4. 等待部署完成（会显示进度条和日志）

#### 方法2：通过云开发控制台
1. 打开云开发控制台
2. 进入"云函数"页面
3. 点击"新建云函数"
4. 函数名称：`userManagement`
5. 上传代码文件：选择 `cloudfunctions/userManagement` 文件夹
6. 点击"确定"部署

### 步骤3：验证部署
1. 在云开发控制台的"云函数"页面
2. 确认 `userManagement` 函数已存在且状态为"正常"
3. 可以点击函数名称查看详情

### 步骤4：测试功能
1. 在测试页面（`pages/test-launch/index`）点击"测试用户管理云函数"
2. 查看测试结果
3. 如果成功，用户管理页面应该能正常显示用户列表

## 常见问题

### 问题1：部署失败
**可能原因**：
- 云开发环境未开通
- 环境ID配置错误
- 网络问题

**解决方案**：
- 检查云开发环境状态
- 确认 `app.js` 中的环境ID正确
- 重试部署

### 问题2：权限不足
**可能原因**：
- 云函数权限配置问题
- 数据库权限不足

**解决方案**：
- 检查云函数权限设置
- 确认数据库读写权限

### 问题3：依赖安装失败
**可能原因**：
- package.json 配置问题
- 网络问题

**解决方案**：
- 检查 `cloudfunctions/userManagement/package.json`
- 手动安装依赖：在云函数目录下运行 `npm install`

## 文件结构确认

确保以下文件存在且内容正确：

```
cloudfunctions/userManagement/
├── index.js          # 云函数主文件
└── package.json      # 依赖配置
```

## 环境配置

确保 `miniprogram/app.js` 中的云开发配置正确：

```javascript
wx.cloud.init({
  env: 'your-env-id',  // 替换为你的环境ID
  traceUser: true
});
```

## 测试验证

部署完成后，可以通过以下方式验证：

1. **云开发控制台**：查看云函数列表
2. **测试页面**：使用内置的测试功能
3. **管理页面**：查看用户列表是否正常显示

## 下一步

云函数部署成功后：
1. 用户管理页面将能正常显示用户列表
2. 可以搜索和查看用户详情
3. 可以修改用户角色和权限

如果仍有问题，请检查控制台日志获取详细错误信息。
