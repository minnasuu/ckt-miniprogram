// 权限管理工具类
class PermissionUtils {
  
  /**
   * 检查用户是否有指定权限
   * @param {string} permission 权限名称
   * @returns {Promise<boolean>} 是否有权限
   */
  static async checkPermission(permission) {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.openId) {
        return false;
      }

      const result = await wx.cloud.callFunction({
        name: 'userManagement',
        data: {
          action: 'checkPermission',
          openId: userInfo.openId,
          permission: permission
        }
      });

      return result.result && result.result.success && result.result.data.hasPermission;
    } catch (error) {
      console.error('检查权限失败:', error);
      return false;
    }
  }

  /**
   * 获取用户角色信息
   * @returns {Promise<Object>} 角色信息
   */
  static async getUserRole() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.openId) {
        return { role: 'normal', roleName: '普通用户', permissions: [] };
      }

      const result = await wx.cloud.callFunction({
        name: 'userManagement',
        data: {
          action: 'getUserPermissions',
          openId: userInfo.openId
        }
      });

      if (result.result && result.result.success) {
        return result.result.data;
      } else {
        return { role: 'normal', roleName: '普通用户', permissions: [] };
      }
    } catch (error) {
      console.error('获取用户角色失败:', error);
      return { role: 'normal', roleName: '普通用户', permissions: [] };
    }
  }

  /**
   * 检查是否为管理员
   * @returns {Promise<boolean>} 是否为管理员
   */
  static async isAdmin() {
    const roleInfo = await this.getUserRole();
    return roleInfo.role === 'admin';
  }

  /**
   * 检查是否为高级用户
   * @returns {Promise<boolean>} 是否为高级用户
   */
  static async isPremium() {
    const roleInfo = await this.getUserRole();
    return roleInfo.role === 'premium' || roleInfo.role === 'admin';
  }

  /**
   * 权限装饰器 - 用于页面方法
   * @param {string} permission 所需权限
   * @param {Function} callback 无权限时的回调
   */
  static requirePermission(permission, callback) {
    return async function(...args) {
      const hasPermission = await PermissionUtils.checkPermission(permission);
      if (!hasPermission) {
        if (callback) {
          callback();
        } else {
          wx.showToast({
            title: '权限不足',
            icon: 'none'
          });
        }
        return;
      }
      return this.apply(this, args);
    };
  }

  /**
   * 角色权限映射
   */
  static getRolePermissions() {
    return {
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
  }

  /**
   * 权限说明映射
   */
  static getPermissionDescriptions() {
    return {
      'view_tools': '查看工具',
      'create_content': '创建内容',
      'view_tutorials': '查看教程',
      'advanced_tools': '高级工具',
      'export_data': '导出数据',
      'priority_support': '优先支持',
      'user_management': '用户管理',
      'system_config': '系统配置',
      'data_analysis': '数据分析'
    };
  }
}

module.exports = PermissionUtils;
