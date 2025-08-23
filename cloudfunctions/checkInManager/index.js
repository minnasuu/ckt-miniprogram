const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 打卡管理云函数
 * 处理用户打卡数据的增删改查
 */
exports.main = async (event, context) => {
  const { action, data } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    switch (action) {
      case 'recordCheckIn':
        return await recordCheckIn(OPENID, data);
      case 'getCheckInData':
        return await getCheckInData(OPENID, data);
      case 'getWeeklyData':
        return await getWeeklyData(OPENID);
      case 'getCheckInStats':
        return await getCheckInStats(OPENID);
      default:
        return {
          success: false,
          message: '未知操作类型'
        };
    }
  } catch (error) {
    console.error('打卡管理云函数错误:', error);
    return {
      success: false,
      message: error.message || '服务器错误'
    };
  }
};

/**
 * 记录打卡
 * @param {string} openId 用户openId
 * @param {object} data 打卡数据
 */
async function recordCheckIn(openId, data) {
  const { type, creationCount = 0 } = data;
  const today = new Date();
  const dateStr = formatDate(today);
  
  console.log('云函数 recordCheckIn 开始执行');
  console.log('参数 - openId:', openId);
  console.log('参数 - type:', type);
  console.log('参数 - creationCount:', creationCount);
  console.log('参数 - dateStr:', dateStr);
  
  try {
    // 查找今天的打卡记录
    console.log('查找今天的打卡记录...');
    const existingRecord = await db.collection('checkInRecords')
      .where({
        openId: openId,
        date: dateStr
      })
      .get();

    console.log('查找结果:', existingRecord.data.length, '条记录');

    if (existingRecord.data.length > 0) {
      // 更新现有记录
      console.log('更新现有记录...');
      const record = existingRecord.data[0];
      console.log('现有记录:', record);
      
      const updateData = {
        updatedAt: db.serverDate()
      };

      if (type === 'login') {
        console.log('更新登录打卡状态');
        updateData.hasLogin = true;
        updateData.loginTime = db.serverDate();
      } else if (type === 'create') {
        console.log('更新创作打卡状态');
        updateData.hasCreate = true;
        updateData.creationCount = (record.creationCount || 0) + creationCount;
        updateData.lastCreateTime = db.serverDate();
      }

      console.log('更新数据:', updateData);
      
      const updateResult = await db.collection('checkInRecords')
        .doc(record._id)
        .update({
          data: updateData
        });
      
      console.log('更新结果:', updateResult);
    } else {
      // 创建新记录
      console.log('创建新记录...');
      const newRecord = {
        openId: openId,
        date: dateStr,
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
        weekday: today.getDay(),
        hasLogin: type === 'login',
        hasCreate: type === 'create',
        creationCount: type === 'create' ? creationCount : 0,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      };

      if (type === 'login') {
        newRecord.loginTime = db.serverDate();
      } else if (type === 'create') {
        newRecord.lastCreateTime = db.serverDate();
      }

      console.log('新记录数据:', newRecord);

      const addResult = await db.collection('checkInRecords').add({
        data: newRecord
      });
      
      console.log('创建结果:', addResult);
    }

    console.log('打卡记录成功完成');
    return {
      success: true,
      message: '打卡记录成功'
    };
  } catch (error) {
    console.error('记录打卡失败:', error);
    throw new Error('记录打卡失败: ' + error.message);
  }
}

/**
 * 获取指定日期的打卡数据
 * @param {string} openId 用户openId
 * @param {object} data 查询参数
 */
async function getCheckInData(openId, data) {
  const { date } = data;
  
  try {
    const result = await db.collection('checkInRecords')
      .where({
        openId: openId,
        date: date
      })
      .get();

    return {
      success: true,
      data: result.data[0] || null
    };
  } catch (error) {
    console.error('获取打卡数据失败:', error);
    throw new Error('获取打卡数据失败');
  }
}

/**
 * 获取近一周的打卡数据
 * @param {string} openId 用户openId
 */
async function getWeeklyData(openId) {
  try {
    console.log('getWeeklyData 开始执行, openId:', openId);
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    
    const startDate = formatDate(weekAgo);
    const endDate = formatDate(today);
    const todayStr = formatDate(today);

    console.log('查询日期范围:', startDate, '到', endDate);
    console.log('今日日期:', todayStr);

    const result = await db.collection('checkInRecords')
      .where({
        openId: openId,
        date: _.gte(startDate).and(_.lte(endDate))
      })
      .orderBy('date', 'asc')
      .get();

    console.log('数据库查询结果:', result.data.length, '条记录');
    console.log('查询到的记录:', result.data);

    // 生成完整的一周数据
    const weeklyData = [];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const recordMap = {};
    
    // 将查询结果转换为map
    result.data.forEach(record => {
      console.log('处理记录:', record.date, record);
      recordMap[record.date] = record;
    });

    console.log('记录映射:', recordMap);

    // 生成7天的数据
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = formatDate(date);
      const record = recordMap[dateStr];

      console.log(`处理第${i}天:`, dateStr, '记录:', record);

      const dayData = {
        date: dateStr,
        day: weekdays[date.getDay()],
        dayNum: date.getDate(),
        hasLogin: record ? record.hasLogin : false,
        hasCreate: record ? record.hasCreate : false,
        creationCount: record ? (record.creationCount || 0) : 0,
        isToday: i === 0
      };

      console.log('生成的日数据:', dayData);
      weeklyData.push(dayData);
    }

    console.log('最终周数据:', weeklyData);

    return {
      success: true,
      data: weeklyData
    };
  } catch (error) {
    console.error('获取周数据失败:', error);
    throw new Error('获取周数据失败');
  }
}

/**
 * 获取打卡统计数据
 * @param {string} openId 用户openId
 */
async function getCheckInStats(openId) {
  try {
    // 获取近一周数据用于计算连续天数
    const weeklyResult = await getWeeklyData(openId);
    if (!weeklyResult.success) {
      throw new Error('获取周数据失败');
    }

    const weeklyData = weeklyResult.data;
    
    // 计算连续登录天数
    let checkInStreak = 0;
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      const day = weeklyData[i];
      if (day.hasLogin) {
        checkInStreak++;
      } else {
        break;
      }
    }

    // 计算连续创作天数
    let creationStreak = 0;
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      const day = weeklyData[i];
      if (day.hasCreate) {
        creationStreak++;
      } else {
        break;
      }
    }

    // 计算总打卡次数和总创作次数
    let totalCheckIns = 0;
    let totalCreations = 0;

    try {
      // 查询用户的所有打卡记录
      const allRecords = await db.collection('checkInRecords')
        .where({
          openId: openId
        })
        .get();

      // 计算总打卡次数（有登录或创作的记录数）
      totalCheckIns = allRecords.data.filter(record => record.hasLogin || record.hasCreate).length;

      // 计算总创作次数（所有记录的创作数量总和）
      totalCreations = allRecords.data.reduce((total, record) => {
        return total + (record.creationCount || 0);
      }, 0);

    } catch (error) {
      console.error('计算总统计数据失败:', error);
      // 如果计算失败，设置为0
      totalCheckIns = 0;
      totalCreations = 0;
    }

    // 生成反馈信息
    const feedbackData = generateFeedback(checkInStreak, creationStreak);

    return {
      success: true,
      data: {
        weeklyData,
        checkInStreak,
        creationStreak,
        totalCheckIns,
        totalCreations,
        feedbackMessage: feedbackData.message,
        feedbackType: feedbackData.type
      }
    };
  } catch (error) {
    console.error('获取统计数据失败:', error);
    throw new Error('获取统计数据失败');
  }
}

/**
 * 生成反馈信息
 * @param {number} streak 连续登录天数
 * @param {number} creationStreak 连续创作天数
 */
function generateFeedback(streak, creationStreak) {
  if (creationStreak >= 7) {
    return {
      message: `太棒了！你已经连续创作${creationStreak}天，坚持就是胜利！`,
      type: 'excellent'
    };
  } else if (creationStreak >= 3) {
    return {
      message: `不错哦！连续${creationStreak}天创作，继续保持！`,
      type: 'good'
    };
  } else if (creationStreak > 0) {
    return {
      message: '加油！每一次创作都是进步的开始',
      type: 'normal'
    };
  } else {
    return {
      message: '开始你的创作之旅吧！',
      type: 'normal'
    };
  }
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date} date 日期对象
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
