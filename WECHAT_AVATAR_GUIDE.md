# 微信头像显示指南

## 概述

本应用显示的是用户授权的微信头像，通过微信小程序的`wx.getUserProfile` API获取用户的真实头像和昵称。

## 微信头像获取流程

### 1. 用户登录时获取头像

```javascript
// 在LoginUtils中获取用户信息
const userProfileRes = await wx.getUserProfile({
  desc: '用于完善用户资料'
});
userInfo = {
  nickName: userProfileRes.userInfo.nickName,
  avatarUrl: userProfileRes.userInfo.avatarUrl  // 这是微信头像URL
};
```

### 2. 头像URL特点

微信头像URL通常具有以下特征：
- 域名：`wx.qlogo.cn` 或 `thirdwx.qlogo.cn`
- 协议：`https://`
- 时效性：通常24-48小时有效
- 格式：`https://wx.qlogo.cn/mmopen/...`

### 3. 头像存储和显示

```javascript
// 云函数中存储头像URL
avatar: event.userInfo.avatarUrl || '/images/default-avatar.png'

// 前端显示头像
<image src="{{userInfo.avatar || '/images/default-avatar.png'}}" />
```

## 头像URL过期处理

### 1. 自动检测

系统会自动检测微信头像URL是否过期：

```javascript
// 检测是否为微信头像URL
userInfo.avatar.includes('wx.qlogo.cn') || 
userInfo.avatar.includes('thirdwx.qlogo.cn')
```

### 2. 错误处理

当头像加载失败时：

```javascript
onAvatarError(e) {
  // 如果是微信头像过期，提示重新登录
  if (isWechatAvatar) {
    wx.showModal({
      title: '头像加载失败',
      content: '微信头像链接可能已过期，是否重新登录获取最新头像？',
      confirmText: '重新登录',
      cancelText: '使用默认头像'
    });
  }
}
```

### 3. 用户选择

用户可以选择：
- **重新登录**：清除缓存，重新获取最新微信头像
- **使用默认头像**：切换到应用默认头像

## 调试功能

### 1. 头像信息调试

页面加载时会自动输出调试信息：

```javascript
debugWechatAvatar() {
  console.log('=== 微信头像调试信息 ===');
  console.log('用户头像URL:', userInfo.avatar);
  console.log('是否为微信头像:', isWechatAvatar);
  console.log('是否为HTTPS:', isHttps);
  console.log('URL长度:', urlLength);
}
```

### 2. 可访问性测试

```javascript
wx.getImageInfo({
  src: userInfo.avatar,
  success: (res) => {
    console.log('✅ 微信头像可访问，尺寸:', res.width, 'x', res.height);
  },
  fail: (err) => {
    console.error('❌ 微信头像不可访问:', err.errMsg);
  }
});
```

## 常见问题

### Q: 为什么微信头像会过期？
A: 微信为了安全考虑，头像URL有时效性。这是正常现象，需要定期更新。

### Q: 如何获取最新的微信头像？
A: 重新调用`wx.getUserProfile`获取最新的头像URL。

### Q: 头像显示不出来怎么办？
A: 
1. 查看控制台调试信息
2. 检查网络连接
3. 重新登录获取最新头像
4. 使用默认头像作为备选

### Q: 可以永久保存微信头像吗？
A: 可以，但需要将头像下载并上传到自己的云存储。

## 最佳实践

### 1. 定期更新头像
- 建议每次用户登录时都获取最新头像
- 检测头像URL是否过期

### 2. 错误处理
- 提供默认头像作为备选
- 给用户选择重新登录的机会

### 3. 用户体验
- 显示加载状态
- 提供清晰的错误提示
- 允许用户手动刷新头像

## 技术细节

### 微信头像URL格式示例
```
https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKrj3rZ8xqJQ.../132
https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKrj3rZ8xqJQ.../132
```

### 头像URL检测
```javascript
function isWechatAvatar(url) {
  return url.includes('wx.qlogo.cn') || url.includes('thirdwx.qlogo.cn');
}
```

### 头像更新流程
```javascript
1. 用户点击重新登录
2. 调用 wx.getUserProfile 获取最新头像
3. 调用登录云函数更新数据库
4. 更新页面显示和本地缓存
```

## 注意事项

1. **权限要求**：需要用户授权才能获取头像
2. **时效性**：微信头像URL有时效性，需要定期更新
3. **网络依赖**：头像显示依赖网络连接
4. **域名白名单**：确保微信头像域名在小程序域名白名单中
5. **用户体验**：提供备选方案和清晰的错误提示
