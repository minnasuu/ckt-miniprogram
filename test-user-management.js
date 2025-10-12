// 用户管理功能测试脚本
// 在微信开发者工具的控制台中运行此脚本来测试用户管理功能

console.log('=== 用户管理功能测试 ===');

// 测试云函数连接
async function testUserManagement() {
  try {
    console.log('1. 测试云函数连接...');
    
    // 测试连接
    const connectionResult = await wx.cloud.callFunction({
      name: 'userManagement',
      data: {
        action: 'testConnection'
      }
    });
    
    console.log('连接测试结果:', connectionResult);
    
    if (connectionResult.result && connectionResult.result.success) {
      console.log('✅ 云函数连接正常');
    } else {
      console.log('❌ 云函数连接失败');
      return;
    }
    
    // 测试获取用户列表
    console.log('2. 测试获取用户列表...');
    
    const userListResult = await wx.cloud.callFunction({
      name: 'userManagement',
      data: {
        action: 'getUserList'
      }
    });
    
    console.log('用户列表结果:', userListResult);
    
    if (userListResult.result && userListResult.result.success) {
      const userList = userListResult.result.data || [];
      console.log(`✅ 成功获取用户列表，共 ${userList.length} 个用户`);
      
      // 显示用户信息
      userList.forEach((user, index) => {
        console.log(`用户 ${index + 1}:`, {
          username: user.username,
          openId: user.openId,
          role: user.role,
          roleName: user.roleName,
          permissions: user.permissions
        });
      });
      
      if (userList.length === 0) {
        console.log('⚠️ 用户列表为空，可能需要创建测试用户');
        
        // 创建测试用户
        console.log('3. 创建测试用户...');
        const createTestResult = await wx.cloud.callFunction({
          name: 'userManagement',
          data: {
            action: 'createTestUser'
          }
        });
        
        console.log('创建测试用户结果:', createTestResult);
        
        if (createTestResult.result && createTestResult.result.success) {
          console.log('✅ 测试用户创建成功');
          
          // 再次获取用户列表
          const newUserListResult = await wx.cloud.callFunction({
            name: 'userManagement',
            data: {
              action: 'getUserList'
            }
          });
          
          if (newUserListResult.result && newUserListResult.result.success) {
            const newUserList = newUserListResult.result.data || [];
            console.log(`✅ 重新获取用户列表，共 ${newUserList.length} 个用户`);
            
            newUserList.forEach((user, index) => {
              console.log(`用户 ${index + 1}:`, {
                username: user.username,
                openId: user.openId,
                role: user.role,
                roleName: user.roleName,
                permissions: user.permissions
              });
            });
          }
        } else {
          console.log('❌ 测试用户创建失败');
        }
      }
    } else {
      console.log('❌ 获取用户列表失败:', userListResult.result?.message);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
testUserManagement();

console.log('=== 测试完成 ===');
console.log('如果看到错误，请检查：');
console.log('1. 云函数是否已部署');
console.log('2. 云开发环境是否正确配置');
console.log('3. 是否有权限访问云函数');
