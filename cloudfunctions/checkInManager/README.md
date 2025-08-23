# 打卡管理云函数

## 功能说明

这个云函数用于管理用户的打卡数据，包括登录打卡和创作打卡。

## 数据库集合

### checkInRecords 集合

存储用户的打卡记录，每天每个用户一条记录。

#### 字段说明

- `openId`: 用户的openId（必填）
- `date`: 日期字符串，格式为 YYYY-MM-DD（必填）
- `year`: 年份（数字）
- `month`: 月份（数字，1-12）
- `day`: 日期（数字，1-31）
- `weekday`: 星期几（数字，0-6，0为周日）
- `hasLogin`: 是否登录打卡（布尔值）
- `hasCreate`: 是否创作打卡（布尔值）
- `creationCount`: 创作数量（数字，默认为0）
- `loginTime`: 登录时间（Date对象）
- `lastCreateTime`: 最后创作时间（Date对象）
- `createdAt`: 记录创建时间（Date对象）
- `updatedAt`: 记录更新时间（Date对象）

#### 建议的数据库索引

为了优化查询性能，建议在微信云开发控制台中为 `checkInRecords` 集合创建以下索引：

1. **主查询索引**：
   - 字段：`openId` (升序) + `date` (降序)
   - 用途：快速查询用户的特定日期记录和近期记录

2. **时间范围查询索引**：
   - 字段：`openId` (升序) + `year` (降序) + `month` (降序)
   - 用途：按月份查询用户记录

3. **统计查询索引**：
   - 字段：`openId` (升序) + `hasLogin` (升序) + `hasCreate` (升序)
   - 用途：统计用户的打卡情况

## API 接口

### recordCheckIn
记录用户打卡

**参数**：
```javascript
{
  action: 'recordCheckIn',
  data: {
    type: 'login' | 'create',  // 打卡类型
    creationCount: number      // 创作数量（仅创作打卡时使用）
  }
}
```

### getCheckInData
获取指定日期的打卡数据

**参数**：
```javascript
{
  action: 'getCheckInData',
  data: {
    date: 'YYYY-MM-DD'  // 日期字符串
  }
}
```

### getWeeklyData
获取近一周的打卡数据

**参数**：
```javascript
{
  action: 'getWeeklyData'
}
```

### getCheckInStats
获取打卡统计数据（包含近一周数据、连续天数、反馈信息等）

**参数**：
```javascript
{
  action: 'getCheckInStats'
}
```

## 使用示例

```javascript
// 记录登录打卡
const result = await wx.cloud.callFunction({
  name: 'checkInManager',
  data: {
    action: 'recordCheckIn',
    data: {
      type: 'login'
    }
  }
});

// 记录创作打卡
const result = await wx.cloud.callFunction({
  name: 'checkInManager',
  data: {
    action: 'recordCheckIn',
    data: {
      type: 'create',
      creationCount: 1
    }
  }
});

// 获取打卡统计
const result = await wx.cloud.callFunction({
  name: 'checkInManager',
  data: {
    action: 'getCheckInStats'
  }
});
```

## 部署说明

1. 在微信开发者工具中右键点击 `cloudfunctions/checkInManager` 目录
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成
4. 在云开发控制台中为 `checkInRecords` 集合创建建议的索引

## 注意事项

1. 云函数会自动获取用户的 openId，无需前端传递
2. 每天每个用户只会有一条打卡记录，重复打卡会更新现有记录
3. 创作打卡会累加创作数量
4. 所有时间字段使用服务器时间，确保数据一致性
