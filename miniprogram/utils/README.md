# 公共工具类使用说明

## LoginUtils - 登录工具类

### 简介
`LoginUtils` 是一个公共的登录工具类，提供统一的微信登录逻辑，可在各个页面调用。

### 主要功能
- 执行微信登录流程
- 检查用户登录状态
- 显示登录弹窗
- 退出登录

### 使用方法

#### 1. 导入工具类
```javascript
const LoginUtils = require('../../utils/loginUtils'); // 根据实际路径调整
```

#### 2. 显示登录弹窗并执行登录
```javascript
LoginUtils.showLoginModal({
  title: '需要登录',
  content: '此功能需要先登录账号，是否立即登录？',
  confirmText: '立即登录',
  onLoginSuccess: (userInfo) => {
    // 登录成功后的处理逻辑
    console.log('登录成功:', userInfo);
    // 更新页面数据
    this.setData({
      userInfo: userInfo
    });
  },
  onCancel: () => {
    console.log('用户取消登录');
  }
});
```

#### 3. 直接执行登录（不显示弹窗）
```javascript
LoginUtils.performLogin({
  onLoginStart: () => {
    // 登录开始时的处理，如显示loading
    this.setData({ isLoggingIn: true });
  },
  onLoginSuccess: (userInfo) => {
    // 登录成功处理
    this.setData({ 
      userInfo: userInfo,
      isLoggingIn: false 
    });
  },
  onLoginFail: (error) => {
    // 登录失败处理
    this.setData({ isLoggingIn: false });
    console.error('登录失败:', error);
  },
  desc: '用于完善用户资料' // 可选，默认为 '用于完善用户资料'
});
```

#### 4. 检查登录状态
```javascript
const { isLoggedIn, userInfo } = LoginUtils.checkLoginStatus();
if (isLoggedIn) {
  console.log('用户已登录:', userInfo);
} else {
  console.log('用户未登录');
}
```

#### 5. 退出登录
```javascript
LoginUtils.logout(() => {
  // 退出登录后的处理
  this.setData({
    userInfo: null
  });
});
```

### 注意事项
1. 使用前请确保已配置好云开发环境和登录云函数
2. 登录成功后用户信息会自动保存到本地存储中
3. 工具类会自动显示相应的成功/失败提示
4. 可以根据具体需求自定义回调函数

### 当前使用页面
- `pages/tools/pattern-note/index.js` - 图解笔记页面的保存功能登录
