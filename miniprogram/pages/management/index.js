// pages/management/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: 88,
    // 管理功能列表
    managementFunctions: [
      { id: 'user-management', title: '用户管理', desc: '管理用户权限和角色', icon: '👥' },
      { id: 'permission-config', title: '权限配置', desc: '配置系统权限设置', icon: '⚙️' },
    // { id: 'data-statistics', title: '数据统计', desc: '查看用户使用统计', icon: '📊' },
    // { id: 'system-settings', title: '系统设置', desc: '系统参数配置', icon: '🔧' }
    ],

    // 用户管理相关
    currentView: 'main', // main, userList, userDetail, permissionConfig
    userList: [],
    filteredUserList: [],
    currentUser: null,
    loading: false,
    searchKeyword: '',

    // 权限配置相关
    rolePermissions: {
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
    },

    // 灵感日推 - 临时隐藏
    showIdeaUpdateDrawer:false,
    ideaUpdateTitleValue:'',
    ideaUpdateDescValue:'',
    ideaUpdateImages: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const systemInfo = wx.getSystemInfo();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });

    // 检查管理员权限
    this.checkAdminPermission();
  },

  /**
   * 检查管理员权限
   */
  checkAdminPermission() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.openId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 检查是否为管理员（这里可以根据实际需求调整判断逻辑）
    const adminOpenIds = ['od7SO5Pt8HG7dDS5A_1Uuv7ky_Mg']; // 管理员openId列表
    if (!adminOpenIds.includes(userInfo.openId)) {
      wx.showToast({
        title: '无权限访问',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
  },
  /**
   * 管理功能卡片点击事件
   */
  onCardTap(e) {
    const { type } = e.currentTarget.dataset;
    switch (type) {
      case 'user-management':
        this.showUserManagement();
        break;
      case 'permission-config':
        this.showPermissionConfig();
        break;
      case 'data-statistics':
        this.showDataStatistics();
        break;
      case 'system-settings':
        this.showSystemSettings();
        break;
      case 'idea-update':
        this.updateIdea();
        break;
      default:
        break;
    }
  },

  /**
   * 显示用户管理界面
   */
  showUserManagement() {
    this.setData({
      currentView: 'userList'
    });
    this.loadUserList();
  },

  /**
   * 显示权限配置界面
   */
  showPermissionConfig() {
    this.setData({
      currentView: 'permissionConfig'
    });
  },

  /**
   * 显示数据统计界面
   */
  showDataStatistics() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  /**
   * 显示系统设置界面
   */
  showSystemSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  /**
   * 返回主界面
   */
  goBackToMain() {
    this.setData({
      currentView: 'main',
      currentUser: null,
      searchKeyword: ''
    });
  },

  /**
   * 加载用户列表
   */
  async loadUserList() {
    this.setData({ loading: true });

    try {
      console.log('开始调用云函数获取用户列表...');

      // 调用云函数获取用户列表
      const result = await wx.cloud.callFunction({
        name: 'userManagement',
        data: {
          action: 'getUserList'
        }
      });

      console.log('云函数返回结果:', result);

      if (result.result && result.result.success) {
        const userList = result.result.data || [];
        console.log('获取到的用户列表:', userList);

        this.setData({
          userList: userList,
          filteredUserList: userList,
          loading: false
        });

        console.log('用户列表数据已更新到页面');
      } else {
        console.error('云函数返回失败:', result.result);
        throw new Error(result.result?.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);

      // 如果是云函数未找到的错误，显示提示信息
      if (error.errMsg && error.errMsg.includes('FunctionName parameter could not be found')) {
        wx.showModal({
          title: '云函数未部署',
          content: 'userManagement 云函数尚未部署，请先在微信开发者工具中部署该云函数。',
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        wx.showToast({
          title: '加载失败: ' + error.message,
          icon: 'none'
        });
      }

      this.setData({ loading: false });
    }
  },

  /**
   * 搜索用户
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    this.filterUserList();
  },

  /**
   * 过滤用户列表
   */
  filterUserList() {
    const { userList, searchKeyword } = this.data;
    if (!searchKeyword.trim()) {
      this.setData({
        filteredUserList: userList
      });
      return;
    }

    const filtered = userList.filter(user =>
      user.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      user.openId.toLowerCase().includes(searchKeyword.toLowerCase())
    );

    this.setData({
      filteredUserList: filtered
    });
  },

  /**
   * 查看用户详情
   */
  viewUserDetail(e) {
    const { user } = e.currentTarget.dataset;
    this.setData({
      currentView: 'userDetail',
      currentUser: user
    });
  },

  /**
   * 修改用户角色
   */
  async changeUserRole(e) {
    const { user, role } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认修改',
      content: `确定要将用户 ${user.username} 的角色修改为 ${this.data.rolePermissions[role].name} 吗？`,
      success: async (res) => {
        if (res.confirm) {
          await this.updateUserRole(user.openId, role);
        }
      }
    });
  },

  /**
   * 更新用户角色
   */
  async updateUserRole(openId, newRole) {
    try {
      wx.showLoading({ title: '更新中...' });

      const result = await wx.cloud.callFunction({
        name: 'userManagement',
        data: {
          action: 'updateUserRole',
          openId: openId,
          role: newRole
        }
      });

      if (result.result && result.result.success) {
        wx.hideLoading();
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });

        // 更新本地数据
        const userList = this.data.userList.map(user => {
          if (user.openId === openId) {
            return { ...user, role: newRole };
          }
          return user;
        });

        this.setData({ userList });

        // 如果当前查看的是该用户，更新当前用户信息
        if (this.data.currentUser && this.data.currentUser.openId === openId) {
          this.setData({
            currentUser: { ...this.data.currentUser, role: newRole }
          });
        }
      } else {
        throw new Error(result.result?.message || '更新失败');
      }
    } catch (error) {
      console.error('更新用户角色失败:', error);
      wx.hideLoading();

      // 如果是云函数未找到的错误，显示提示信息
      if (error.errMsg && error.errMsg.includes('FunctionName parameter could not be found')) {
        wx.showModal({
          title: '云函数未部署',
          content: 'userManagement 云函数尚未部署，无法更新用户角色。',
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        wx.showToast({
          title: '更新失败: ' + error.message,
          icon: 'none'
        });
      }
    }
  },
  // 发布灵感每日更新
  updateIdea(){
    this.setData({
      showIdeaUpdateDrawer:true
    })
  },
  onIdeaUpdateCancel(){
    this.setData({
      showIdeaUpdateDrawer:false
    })
  },
  // 假设需要先上传图片
async onIdeaUpdateSubmit() {
  wx.showLoading({
    title: '上传中...',
  })
  const {ideaUpdateTitleValue,ideaUpdateDescValue,ideaUpdateImages} = this.data;
  try {
    // 上传所有图片到云存储
    const fileIDs = await Promise.all(
      this.data.ideaUpdateImages.map(tempPath => 
        wx.cloud.uploadFile({
          cloudPath: `idea-images/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
          filePath: tempPath
        })
      )
    ).then(resList => resList.map(res => res.fileID));

    // 上传到数据库
    const db = wx.cloud.database();
    await db.collection('ideaList').add({ name: ideaUpdateTitleValue.trim(), desc: ideaUpdateDescValue.trim(), imgUrls: ideaUpdateImages });

    wx.showToast({ title: '上传成功' });
    wx.hideLoading()
  } catch (err) {
    console.error('上传失败:', err);
    wx.showToast({ title: '上传失败', icon: 'none' });
  }
},
  onIdeaUpdateTitleInput(e){
    const value = e.detail.value;
    this.setData({
      ideaUpdateTitleValue: value
    })
  },
  onIdeaUpdateDescInput(e){
    const value = e.detail.value;
    this.setData({
      ideaUpdateDescValue: value
    })
  },
  onIdeaUpdateImgChange(e){
    const {resData} = e.detail;
    this.setData({
      ideaUpdateImages:[...this.data.ideaUpdateImages,resData]
    })
  }
})