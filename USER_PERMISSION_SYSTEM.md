# 用户权限管理系统

## 概述

本系统实现了完整的用户权限管理功能，支持三种用户角色：普通用户、高级用户和管理员。管理员可以通过后台界面管理所有用户的权限。

## 功能特性

### 1. 用户角色定义

- **普通用户 (normal)**
  - 查看工具
  - 创建内容
  - 查看教程

- **高级用户 (premium)**
  - 普通用户的所有权限
  - 高级工具
  - 导出数据
  - 优先支持

- **管理员 (admin)**
  - 高级用户的所有权限
  - 用户管理
  - 系统配置
  - 数据分析

### 2. 管理功能

- **用户列表管理**：查看所有注册用户
- **权限配置**：修改用户角色和权限
- **搜索功能**：按用户名或OpenID搜索用户
- **角色切换**：一键切换用户角色

### 3. 权限检查

- **工具函数**：`PermissionUtils` 提供权限检查方法
- **装饰器**：支持方法级权限控制
- **实时验证**：确保用户只能访问有权限的功能

## 文件结构

```
miniprogram/
├── pages/management/           # 管理页面
│   ├── index.js               # 管理页面逻辑
│   ├── index.wxml             # 管理页面模板
│   └── index.wxss             # 管理页面样式
├── utils/
│   └── permissionUtils.js     # 权限工具类
└── cloudfunctions/
    └── userManagement/        # 用户管理云函数
        ├── index.js           # 云函数逻辑
        └── package.json       # 依赖配置
```

## 使用方法

### 1. 部署云函数

```bash
# 在 cloudfunctions/userManagement 目录下
npm install
# 在微信开发者工具中右键选择"上传并部署"
```

### 2. 在页面中使用权限检查

```javascript
// 引入权限工具
const PermissionUtils = require('../../utils/permissionUtils');

// 检查权限
const hasPermission = await PermissionUtils.checkPermission('advanced_tools');
if (!hasPermission) {
  wx.showToast({ title: '权限不足', icon: 'none' });
  return;
}

// 检查角色
const isAdmin = await PermissionUtils.isAdmin();
const isPremium = await PermissionUtils.isPremium();

// 获取用户角色信息
const roleInfo = await PermissionUtils.getUserRole();
console.log(roleInfo.role, roleInfo.roleName, roleInfo.permissions);
```

### 3. 使用权限装饰器

```javascript
// 在页面方法上使用权限装饰器
onAdvancedFeature: PermissionUtils.requirePermission('advanced_tools', () => {
  wx.showToast({ title: '需要高级用户权限', icon: 'none' });
})
```

## 数据库结构

### userInfo 集合
存储用户基本信息
```javascript
{
  _id: "用户记录ID",
  openId: "用户OpenID",
  username: "用户名",
  avatar: "头像URL",
  createTime: "创建时间",
  lastLoginTime: "最后登录时间"
}
```

### userPermissions 集合
存储用户权限信息
```javascript
{
  _id: "权限记录ID",
  openId: "用户OpenID",
  role: "用户角色 (normal/premium/admin)",
  createTime: "创建时间",
  updateTime: "更新时间"
}
```

## 权限常量

### 权限名称
- `view_tools`: 查看工具
- `create_content`: 创建内容
- `view_tutorials`: 查看教程
- `advanced_tools`: 高级工具
- `export_data`: 导出数据
- `priority_support`: 优先支持
- `user_management`: 用户管理
- `system_config`: 系统配置
- `data_analysis`: 数据分析

### 角色名称
- `normal`: 普通用户
- `premium`: 高级用户
- `admin`: 管理员

## 安全说明

1. **权限验证**：所有权限检查都在云函数中进行，确保安全性
2. **管理员限制**：只有指定的管理员OpenID才能访问管理后台
3. **数据保护**：用户敏感信息只在必要时传输
4. **操作日志**：建议添加操作日志记录功能

## 扩展功能

### 1. 添加新权限
在 `permissionUtils.js` 和云函数中添加新的权限定义

### 2. 添加新角色
在角色权限映射中添加新的角色配置

### 3. 操作日志
可以添加操作日志记录功能，记录权限变更历史

### 4. 批量操作
可以添加批量修改用户权限的功能

## 注意事项

1. 确保云函数已正确部署
2. 数据库集合需要正确创建
3. 管理员OpenID需要在代码中正确配置
4. 建议定期备份用户权限数据
5. 权限变更会立即生效，无需重新登录

## 故障排除

### 常见问题

1. **权限检查失败**
   - 检查云函数是否已部署
   - 确认用户已登录
   - 检查网络连接

2. **管理后台无法访问**
   - 确认当前用户OpenID在管理员列表中
   - 检查用户是否已登录

3. **用户列表为空**
   - 检查数据库集合是否存在
   - 确认云函数权限配置正确

### 调试方法

1. 查看控制台日志
2. 检查云函数调用结果
3. 验证数据库数据
4. 测试权限检查逻辑
