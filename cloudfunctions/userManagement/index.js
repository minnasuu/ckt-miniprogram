// 用户管理云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 权限定义
const PERMISSIONS = {
  'normal': {
    name: '普通用户',
    permissions: ['view_tools', 'create_content', 'view_tutorials']
  },
  'premium': {
    name: '高级用户', 
    permissions: ['view_tools', 'create_content', 'view_tutorials', 'advanced_tools', 'export_data', 'priority_support']
  },
  'admin': {
    name: '管理员',
    permissions: ['view_tools', 'create_content', 'view_tutorials', 'advanced_tools', 'export_data', 'priority_support', 'user_management', 'system_config', 'data_analysis']
  }
};

exports.main = async (event, context) => {
  const { action } = event;
  
  try {
    switch (action) {
      case 'getUserList':
        return await getUserList(event);
      case 'updateUserRole':
        return await updateUserRole(event);
      case 'getUserPermissions':
        return await getUserPermissions(event);
      case 'checkPermission':
        return await checkPermission(event);
      case 'createTestUser':
        return await createTestUser(event);
      case 'testConnection':
        return await testConnection(event);
      default:
        return {
          success: false,
          message: '未知操作'
        };
    }
  } catch (error) {
    console.error('用户管理云函数错误:', error);
    return {
      success: false,
      message: error.message || '操作失败'
    };
  }
};

/**
 * 获取用户列表
 */
async function getUserList(event) {
  try {
    console.log('开始获取用户列表...');
    
    // 直接从 users 集合获取用户数据
    const userResult = await db.collection('users').get();
    console.log('用户数据查询结果:', userResult);
    
    // 从 users 表获取用户信息（包含角色）
    const userList = userResult.data.map(user => {
      console.log('处理用户数据:', user);
      return {
        openId: user.openId,
        username: user.username || '未设置',
        avatar: user.avatar || '',
        role: user.role || 'normal', // 从 users 表获取角色
        createTime: user.createTime || user.createdAt || user._createTime,
        lastLoginTime: user.lastLoginTime || user._updateTime,
        // 添加权限信息
        permissions: PERMISSIONS[user.role || 'normal'].permissions,
        roleName: PERMISSIONS[user.role || 'normal'].name
      };
    });
    
    console.log('处理后的用户列表:', userList);
    
    // 按创建时间倒序排列
    userList.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
    
    return {
      success: true,
      data: userList
    };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    
    // 如果是集合不存在的错误，返回空列表
    if (error.errCode === -502005) {
      console.log('users 集合不存在，返回空列表');
      return {
        success: true,
        data: []
      };
    }
    
    return {
      success: false,
      message: '获取用户列表失败: ' + error.message
    };
  }
}

/**
 * 更新用户角色
 */
async function updateUserRole(event) {
  const { openId, role } = event;
  
  if (!openId || !role) {
    return {
      success: false,
      message: '参数不完整'
    };
  }
  
  if (!PERMISSIONS[role]) {
    return {
      success: false,
      message: '无效的角色'
    };
  }
  
  try {
    // 直接在 users 集合中更新用户角色
    const updateResult = await db.collection('users').where({
      openId: openId
    }).update({
      data: {
        role: role,
        updateTime: new Date()
      }
    });
    
    if (updateResult.stats.updated > 0) {
      return {
        success: true,
        message: '角色更新成功'
      };
    } else {
      return {
        success: false,
        message: '用户不存在或更新失败'
      };
    }
  } catch (error) {
    console.error('更新用户角色失败:', error);
    return {
      success: false,
      message: '更新用户角色失败: ' + error.message
    };
  }
}

/**
 * 获取用户权限
 */
async function getUserPermissions(event) {
  const { openId } = event;
  
  if (!openId) {
    return {
      success: false,
      message: '缺少用户ID'
    };
  }
  
  try {
    // 直接从 users 集合获取用户角色
    const userResult = await db.collection('users').where({
      openId: openId
    }).get();
    
    const role = userResult.data.length > 0 ? (userResult.data[0].role || 'normal') : 'normal';
    const permissions = PERMISSIONS[role] || PERMISSIONS['normal'];
    
    return {
      success: true,
      data: {
        role: role,
        roleName: permissions.name,
        permissions: permissions.permissions
      }
    };
  } catch (error) {
    console.error('获取用户权限失败:', error);
    return {
      success: false,
      message: '获取用户权限失败: ' + error.message
    };
  }
}

/**
 * 检查用户权限
 */
async function checkPermission(event) {
  const { openId, permission } = event;
  
  if (!openId || !permission) {
    return {
      success: false,
      message: '参数不完整'
    };
  }
  
  try {
    // 获取用户权限
    const permissionResult = await getUserPermissions({ openId });
    
    if (!permissionResult.success) {
      return permissionResult;
    }
    
    const hasPermission = permissionResult.data.permissions.includes(permission);
    
    return {
      success: true,
      data: {
        hasPermission: hasPermission,
        role: permissionResult.data.role,
        roleName: permissionResult.data.roleName
      }
    };
  } catch (error) {
    console.error('检查用户权限失败:', error);
    return {
      success: false,
      message: '检查用户权限失败'
    };
  }
}

/**
 * 创建测试用户
 */
async function createTestUser(event) {
  try {
    const testUsers = [
      {
        openId: 'test-user-1',
        username: '测试用户1',
        avatar: '/images/default-avatar.png',
        role: 'normal'
      },
      {
        openId: 'test-user-2', 
        username: '测试用户2',
        avatar: '/images/default-avatar.png',
        role: 'premium'
      },
      {
        openId: 'test-user-3',
        username: '测试用户3', 
        avatar: '/images/default-avatar.png',
        role: 'admin'
      }
    ];

    const results = [];
    
    for (const user of testUsers) {
      try {
        // 创建用户记录（包含角色信息）
        const userResult = await db.collection('users').add({
          data: {
            openId: user.openId,
            username: user.username,
            avatar: user.avatar,
            role: user.role,
            createTime: new Date(),
            updateTime: new Date()
          }
        });

        results.push({
          openId: user.openId,
          username: user.username,
          role: user.role,
          success: true
        });

        console.log(`创建测试用户成功: ${user.username}`);
      } catch (error) {
        console.error(`创建测试用户失败: ${user.username}`, error);
        results.push({
          openId: user.openId,
          username: user.username,
          role: user.role,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      message: '测试用户创建完成',
      data: results
    };
  } catch (error) {
    console.error('创建测试用户失败:', error);
    return {
      success: false,
      message: '创建测试用户失败: ' + error.message
    };
  }
}

/**
 * 测试云函数连接
 */
async function testConnection(event) {
  try {
    console.log('测试云函数连接...');
    
    return {
      success: true,
      message: '云函数连接正常',
      data: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    };
  } catch (error) {
    console.error('测试连接失败:', error);
    return {
      success: false,
      message: '测试连接失败: ' + error.message
    };
  }
}
