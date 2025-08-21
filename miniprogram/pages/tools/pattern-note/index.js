Page({
  data: {
    statusBarHeight: 0,
    patternTitle: '', // 图解标题
    isEditingTitle: false, // 是否正在编辑标题
    initData:[
      { id: '1', title: '第 1 部分', values: '', nums: [], edited: false },
    ],
    data:[],
    cur: '1',
    curItem: {},
    titleInputId: '-1',
    lineNumbers: [],
    curLine: -1,
    showStich:false,
    stiches: [],
    saving: false,
    showPreviewDialog:false,
    saveLoading:false,
    downloadLoading:false, // 控制下载按钮状态
    previewData: [], // 预览数据
    isShowStichDisabled: true, // 控制显示针数功能是否禁用
    canvasHeight: 0, // Canvas高度
    canvasId: 'pattern-preview-canvas', // Canvas ID
    showSaveConfirmDialog: false, // 控制确认保存弹窗显示
    showAlert: false, // 控制提示消息显示
    alertMessage: '', // 提示消息内容
    // 历史文档相关
    showHistoryDrawer: false, // 控制历史文档抽屉显示
    historyDocuments: [], // 历史文档列表
    currentDocumentId: null, // 当前文档ID
    showSwitchConfirmDialog: false, // 控制切换确认弹窗显示
    switchTargetDocument: null, // 要切换到的目标文档
    hasUnsavedChanges: false, // 是否有未保存的更改
    isDocumentNew: true, // 当前文档是否为新文档
    // 用户等级和保存限制相关
    userInfo: null, // 用户信息
    saveQuota: { // 保存配额信息
      used: 0, // 已使用数量
      limit: 0, // 限制数量
      level: 'guest' // 用户等级：guest, normal, premium, admin
    }
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    // 生成默认标题（当前时间）
    const defaultTitle = this.formatDateTime(new Date());
    // 生成新文档ID
    const documentId = this.generateDocumentId();
    
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      patternTitle: defaultTitle,
      currentDocumentId: documentId,
      isDocumentNew: true
    });
    if(this.data.data.length === 0){
      this.setData({
        data: this.data.initData
      });
      this.updateCurItem();
      this.calculateLineNumbers();
      this.caculateStiches();
    }
    // 初始化用户信息和保存配额
    this.initUserInfo();
    // 加载历史文档
    this.loadHistoryDocuments();
  },

  onShow() {
    // 页面显示时重新检查用户信息，以防用户在其他页面登录
    this.initUserInfo();
  },

  // 初始化用户信息和保存配额
  initUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || null;
      this.setData({
        userInfo: userInfo
      });
      // 更新保存配额
      this.updateSaveQuota();
    } catch (error) {
      console.error('初始化用户信息失败:', error);
    }
  },

  // 获取用户等级
  getUserLevel(userInfo) {
    if (!userInfo || !userInfo.openId) {
      return 'guest'; // 未登录用户
    }
    
    // 管理员判断（使用项目中现有的管理员openId）
    if (userInfo.openId === 'od7SO5Pt8HG7dDS5A_1Uuv7ky_Mg') {
      return 'admin';
    }
    
    // 高级用户判断（这里可以根据实际业务逻辑调整）
    // 例如：可以根据用户的创建时间、活跃度等判断
    if (userInfo.isPremium || userInfo.level === 'premium') {
      return 'premium';
    }
    
    // 普通用户
    return 'normal';
  },

  // 获取保存限制数量
  getSaveLimit(level) {
    const limits = {
      guest: 0,     // 未登录不允许保存
      normal: 2,    // 普通用户最多2个
      premium: 20,  // 高级用户最多20个
      admin: -1     // 管理员无限制
    };
    return limits[level] || 0;
  },

  // 更新保存配额信息
  updateSaveQuota() {
    const userLevel = this.getUserLevel(this.data.userInfo);
    const saveLimit = this.getSaveLimit(userLevel);
    const usedCount = this.data.historyDocuments.length;
    
    this.setData({
      saveQuota: {
        used: usedCount,
        limit: saveLimit,
        level: userLevel
      }
    });
  },

  // 生成文档ID
  generateDocumentId() {
    return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // 加载历史文档
  loadHistoryDocuments() {
    try {
      const historyDocuments = wx.getStorageSync('pattern-notes') || [];
      this.setData({
        historyDocuments: historyDocuments
      });
      // 更新文档新旧状态
      this.updateDocumentNewStatus();
      // 更新保存配额
      this.updateSaveQuota();
    } catch (error) {
      console.error('加载历史文档失败:', error);
    }
  },

  // 格式化时间为标题
  formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  // 格式化历史文档的时间显示
  formatHistoryTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 小于1分钟
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    
    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}分钟前`;
    }
    
    // 小于1天
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}小时前`;
    }
    
    // 小于7天
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}天前`;
    }
    
    // 超过7天显示具体日期
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // 如果是今年，不显示年份
    if (date.getFullYear() === now.getFullYear()) {
      return `${month}-${day} ${hours}:${minutes}`;
    } else {
      return `${date.getFullYear()}-${month}-${day}`;
    }
  },

  // 更新 curItem 的方法
  updateCurItem() {
    const { data, cur } = this.data;
    const newCurItem = data.find(item => item.id === cur) || {};
    // 确保 nums 数组存在且与行数匹配
    if (newCurItem.values !== undefined) {
      const lines = (newCurItem.values || '').split('\n');
      if (!newCurItem.nums || newCurItem.nums.length !== lines.length) {
        newCurItem.nums = lines.map(line => this.calculateExpression(line));
      }
    }
    this.setData({
      curItem: newCurItem
    }, () => {
      this.calculateLineNumbers();
      this.updateShowStichDisabled();
    });
  },

  // 更新显示针数功能的禁用状态
  updateShowStichDisabled() {
    const { data } = this.data;
    // 检查是否有任何一个部分有内容，而不是只检查当前部分
    const hasAnyContent = data.some(item => item.values && item.values.trim() !== '');
    this.setData({
      isShowStichDisabled: !hasAnyContent
    });
  },

  calculateLineNumbers() {
    const { curItem } = this.data;
    if (curItem) {
      // 如果values为空，至少要有一行
      const lines = curItem.values || '';
      const lineNumbers = lines.split('\n').map((_, index) => `R${index + 1}: `);
      this.setData({
        lineNumbers: lineNumbers
      });
    }
  },
  caculateStiches(){
    const data = this.data.data;
    const newData = data.map(item => {
      const lines = (item.values || '').split('\n');
      const nums = lines.map(line => this.calculateExpression(line));
      return Object.assign(item, { nums: nums });
    });
    this.setData({
      data: newData
    }, () => {
      // 更新当前项
      this.updateCurItem();
    });
  },

  // 当 cur 发生变化时调用
  setCur(newCur) {
    this.setData({
      cur: newCur
    }, () => {
      this.updateCurItem();
    });
  },

  // 当 data 发生变化时调用
  updateData(newData) {
    this.setData({
      data: newData
    }, () => {
      this.updateCurItem();
    });
  },

  // 当 curItem 或者其 values 发生变化时，需要重新计算
  handleInputChange(e) {
    const cur = this.data.cur;
    const val = e.detail.value;
    const newData = this.data.data.map((i) => i.id===cur ? Object.assign(i,{values: val}):i);
    this.setData({
      data: newData,
      curItem: newData.find(i => i.id === cur),
    })
    this.calculateLineNumbers();
    this.caculateStiches();
    this.updateShowStichDisabled();
  },
  lastTapTime: 0, // 记录上次点击的时间

  handleTitleTap(e) {
    const id = e.currentTarget.dataset.id;
    const now = Date.now();
    const timeDiff = now - this.lastTapTime;
    this.lastTapTime = now;

    if (timeDiff < 300) {
      // 双击事件处理逻辑
      this.handleTitleDoubleTap(id);
    } else {
      // 单击事件处理逻辑
      this.setData({
        cur: id
      }, () => {
        this.updateCurItem();
      });
    }
  },

  handleTitleDoubleTap(id) {
    this.setData({
      titleInputId: id
    });
  },
  handleTitleBlur(){
    this.setData({
      titleInputId: '-1'
    });
  },
  handleTItleChange(e){
    const val = e.detail.value;
    const data = this.data.data;
    const titleInputId = this.data.titleInputId;
    if(!val||data.filter(i=>i.id===titleInputId)[0].title === val)return
    const newData = data?.map(i=>i.id===titleInputId ? Object.assign(i,{title: val}) : i);
   this.setData({
    data: newData
   })
  },
  handleAddPart(){
    const data = this.data.data;
    const newData = [...data, { id: `${data?.length + 1}`, title: `第 ${data?.length + 1} 部分`, values: '', nums: [], edited: false }];
    this.setData({
      data: newData,
      cur: `${data?.length+1}`,
    })
    this.updateCurItem()
    this.updateShowStichDisabled()
  },
  handleShowStich(){
    const newShowStich = !this.data.showStich;
    console.log('显示针数状态:', newShowStich);
    console.log('当前项:', this.data.curItem);
    console.log('行数:', this.data.lineNumbers);
    this.setData({
      showStich: newShowStich
    });
    // 如果开启显示针数，重新计算针数
    if (newShowStich) {
      this.caculateStiches();
    }
  },

  // 图解标题双击事件处理
  lastPatternTitleTapTime: 0,
  handlePatternTitleTap() {
    const now = Date.now();
    const timeDiff = now - this.lastPatternTitleTapTime;
    this.lastPatternTitleTapTime = now;

    if (timeDiff < 300) {
      // 双击事件 - 进入编辑模式
      this.setData({
        isEditingTitle: true
      });
    }
  },

  // 图解标题输入完成
  handlePatternTitleBlur() {
    this.setData({
      isEditingTitle: false
    });
  },

  // 图解标题输入变化
  handlePatternTitleChange(e) {
    const val = e.detail.value;
    if (!val) return;
    this.setData({
      patternTitle: val
    });
  },

  // 处理针数输入变化
  handleNumsInputChange(e) {
    const { lineIndex } = e.currentTarget.dataset;
    const value = e.detail.value;
    const cur = this.data.cur;
    const newData = this.data.data.map(item => {
      if (item.id === cur) {
        const newNums = [...item.nums];
        newNums[lineIndex] = parseFloat(value) || 0;
        return Object.assign(item, { nums: newNums });
      }
      return item;
    });

    this.setData({
      data: newData,
      curItem: newData.find(i => i.id === cur)
    });
  },
  calculateExpression(input) {
    if (!input || typeof input !== 'string') return 0;

    // 定义字母对应的值（根据需求）
    const valueMap = {
      // *1 的情况
        'x': 1, 'X': 1,
      'f': 1, 'F': 1,
      't': 1, 'T': 1,
      // *2 的情况
        'v': 2, 'V': 2,
      'tv': 2, 'TV': 2,
      'fv': 2, 'FV': 2,
      // *3 的情况
      'tw': 3, 'TW': 3,
      'fww': 3, 'FWW': 3,
      // *0.5 的情况
      'a': 0.5, 'A': 0.5,
      'ta': 0.5, 'TA': 0.5,
      'fa': 0.5, 'FA': 0.5
    };

    // 解析单个表达式（数字+字母或字母组合）
    function parseSingle(expr) {
      if (!expr) return 0;

      // 如果是纯数字，直接返回
      if (/^\d+(\.\d+)?$/.test(expr)) {
        return parseFloat(expr);
      }

      // 检查是否有数字前缀
      const match = expr.match(/^(\d+(\.\d+)?)([a-zA-Z]+)$/i);
      if (match) {
        const num = parseFloat(match[1]);
        const letter = match[3].toLowerCase();
        const value = valueMap[letter] || 1; // 如果字母不在映射中，默认为 1
        return num * value;
      }

      // 如果是纯字母组合，查找对应值
      const letter = expr.toLowerCase();
      if (valueMap[letter] !== undefined) {
        return valueMap[letter];
        }

        // 如果是其他字母，返回 1
        if (/^[a-zA-Z]+$/.test(expr)) {
            return 1;
        }

      return 0;
    }

    // 处理括号表达式，支持分配律
    function handleBrackets(expr) {
      // 匹配类似 "6(2X V)" 的模式
      const bracketPattern = /(\d+(\.\d+)?)\s*\(\s*([^)]+)\s*\)/g;

      return expr.replace(bracketPattern, (match, multiplier, _, inside) => {
        const mult = parseFloat(multiplier);
        const insideValue = parseExpression(inside);
        return (mult * insideValue).toString();
      });
    }

    // 解析表达式（处理空格分隔的多个部分）
    function parseExpression(expr) {
      if (!expr) return 0;

      // 去掉多余空格
      expr = expr.trim().replace(/\s+/g, ' ');

      // 先处理括号
      expr = handleBrackets(expr);

      // 按空格分割并计算每个部分
      const parts = expr.split(/\s+/).filter(Boolean);
      return parts.reduce((sum, part) => {
        return sum + parseSingle(part);
      }, 0);
    }

    return parseExpression(input);
  },
  handlePreviewBtnTap(){
    // 确保针数是最新的，然后处理预览数据
    const data = this.data.data;
    const updatedData = data.map(item => {
      const lines = (item.values || '').split('\n');
      const nums = lines.map(line => this.calculateExpression(line));
      return Object.assign({}, item, { nums: nums });
    });
    
    // 预处理数据，为每个部分添加行数据
    const processedData = updatedData.map(item => {
      const lines = item.values ? item.values.split('\n') : [];
      return {
        ...item,
        lines: lines.map((line, index) => ({
          lineNumber: `R${index + 1}: `,
          content: line,
          stitch: item.nums && item.nums[index] !== undefined ? item.nums[index] : null
        }))
      };
    });
    
    this.setData({
      showPreviewDialog: true,
      previewData: processedData,
      data: updatedData
    }, () => {
      // 显示弹窗后绘制Canvas
      this.drawPatternCanvas();
    });
  },
  handlePreviewDialogClose(){
    this.setData({
      showPreviewDialog: false
    });
  },
  
  // 下载图解功能
  handleDownloadPattern(){
    if (this.data.downloadLoading) return;
    
    this.setData({
      downloadLoading: true
    });
    
    const that = this;
    // 获取 canvas 的临时文件路径
    wx.canvasToTempFilePath({
      canvasId: this.data.canvasId,
      success: (res) => {
        const tempFilePath = res.tempFilePath;
        // 请求用户授权保存图片到相册的权限
        wx.getSetting({
          success: (settingRes) => {
            if (!settingRes.authSetting['scope.writePhotosAlbum']) {
              wx.authorize({
                scope: 'scope.writePhotosAlbum',
                success: () => {
                  // 授权成功，保存图片到相册
                  that.saveImageToAlbum(tempFilePath);
                },
                fail: () => {
                  // 用户拒绝授权，提示用户手动开启权限
                  that.setData({ downloadLoading: false });
                  wx.showModal({
                    title: '提示',
                    content: '需要您授权保存图片到相册，请前往设置开启权限',
                    success: (modalRes) => {
                      if (modalRes.confirm) {
                        wx.openSetting();
                      }
                    }
                  });
                }
              });
            } else {
              // 已经授权，直接保存图片到相册
              that.saveImageToAlbum(tempFilePath);
            }
          }
        });
      },
      fail: (err) => {
        console.error('获取 canvas 临时文件路径失败:', err);
        this.setData({ downloadLoading: false });
        this.showMessage('下载失败，请重试', 'error');
      }
    });
  },

  // 保存图片到相册的方法
  saveImageToAlbum(tempFilePath) {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        this.setData({ downloadLoading: false });
        this.showMessage('图片已保存到相册🎉', 'success');
      },
      fail: (err) => {
        console.error('保存图片到相册失败:', err);
        this.setData({ downloadLoading: false });
        this.showMessage('保存失败，请重试', 'error');
      }
    });
  },


  // 上传图解到云存储
  async uploadPatternToCloud(tempFilePath) {
    try {
      // 生成文件名
      const fileName = `pattern_${Date.now()}.png`;
      const cloudPath = `patterns/${fileName}`;
      
      // 上传到云存储
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempFilePath
      });

      // 保存记录到云数据库
      await this.savePatternRecord(uploadResult.fileID);
      
    } catch (error) {
      console.error('上传失败:', error);
      this.setData({ saveLoading: false });
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'error'
      });
    }
  },

  // 保存图解记录到云数据库
  async savePatternRecord(fileID) {
    try {
      const db = wx.cloud.database();
      
      // 获取用户信息
      const userInfo = wx.getStorageSync('userInfo') || {};
      
      await db.collection('patterns').add({
        data: {
          title: this.data.patternTitle,
          imageUrl: fileID,
          content: JSON.stringify(this.data.previewData),
          author: userInfo.nickName || '匿名用户',
          authorId: userInfo.openId || '',
          createTime: new Date(),
          tag: '图解笔记',
          type: 'pattern-note'
        }
      });

      this.setData({
        saveLoading: false,
        showPreviewDialog: false
      });
      
      wx.showToast({
        title: '保存成功🎉',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('保存到数据库失败:', error);
      this.setData({ saveLoading: false });
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'error'
      });
    }
  },

  // 显示消息提示
  showMessage(message, type = 'none') {
    wx.showToast({
      title: message,
      icon: type,
      duration: 2000
    });
  },

  // Canvas绘制方法
  drawPatternCanvas() {
    const { previewData, patternTitle, showStich, canvasId } = this.data;
    
    // 延迟执行以确保Canvas元素已渲染
    setTimeout(() => {
      // 获取设备像素比
      const systemInfo = wx.getSystemInfoSync();
      const pixelRatio = systemInfo.pixelRatio || 2;
      
      // 获取Canvas宽度
      const query = wx.createSelectorQuery().in(this);
      query.select('.pattern-preview-canvas').boundingClientRect((rect) => {
        const canvasWidth = rect ? rect.width : 335; // 默认宽度
        
        // 获取Canvas上下文
        const ctx = wx.createCanvasContext(canvasId, this);
        
        // Canvas样式配置
        const padding = 12;
        const lineHeight = 24;
        const sectionGap = 20;
        const titleHeight = 30;
        const fontSize = 14;
        const smallFontSize = 12;
        
        // 计算Canvas高度
        let totalHeight = padding + titleHeight + 20 + 12; // 标题高度 + 间距 + 分割线后间距
        
        previewData.forEach(section => {
          totalHeight += 20 + 8; // 部分标题高度
          if (section.lines && section.lines.length > 0) {
            totalHeight += section.lines.length * lineHeight + 8;
          } else {
            totalHeight += lineHeight + 8; // 空内容高度
          }
          totalHeight += sectionGap;
        });
        
        // 添加底部padding确保内容不被截断
        totalHeight += padding;
        
        // 设置Canvas高度
        this.setData({
          canvasHeight: totalHeight
        }, () => {
          // 开始绘制
          this.performCanvasDraw(ctx, previewData, patternTitle, showStich, padding, lineHeight, sectionGap, titleHeight, fontSize, smallFontSize, totalHeight, canvasWidth);
        });
      }).exec();
    }, 100);
  },

  // 处理保存按钮点击
  handleSaveBtnTap() {
    // 检查用户登录状态和保存权限
    if (!this.checkSavePermission()) {
      return;
    }

    // 检查是否有内容需要保存
    const hasContent = this.data.data.some(item => item.values && item.values.trim() !== '');
    if (!hasContent) {
      this.showAlert('请先添加一些内容再保存', 'warning');
      return;
    }

    // 检查标题是否为空
    if (!this.data.patternTitle || this.data.patternTitle.trim() === '') {
      this.showAlert('请设置图解标题', 'warning');
      return;
    }

    // 智能保存逻辑：检查是否为新文档
    if (this.isNewDocument()) {
      // 新文档：显示确认保存弹窗，让用户确认是否要保存
      this.setData({
        showSaveConfirmDialog: true
      });
    } else {
      // 已保存的文档：直接更新保存，无需弹窗确认
      this.performDirectSave();
    }
  },

  // 检查保存权限
  checkSavePermission() {
    const { saveQuota, userInfo } = this.data;
    
    // 检查是否登录 - 未登录用户不允许保存
    if (saveQuota.level === 'guest') {
      this.showLoginRequiredDialog();
      return false;
    }
    
    // 检查保存数量限制（仅对新文档检查，更新已有文档不受限制）
    // 管理员无限制，普通用户最多2个，高级用户最多20个
    if (saveQuota.level !== 'admin' && this.isNewDocument()) {
      if (saveQuota.used >= saveQuota.limit) {
        this.showSaveLimitDialog();
        return false;
      }
    }
    
    return true;
  },

  // 显示登录提示弹窗
  showLoginRequiredDialog() {
    wx.showModal({
      title: '需要登录',
      content: '保存文档需要先登录账号，是否前往登录？',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到用户中心页面进行登录
          wx.switchTab({
            url: '/pages/user-center/index'
          });
        }
      }
    });
  },

  // 显示保存限制提示弹窗
  showSaveLimitDialog() {
    const { saveQuota } = this.data;
    let levelText = '';
    let upgradeText = '';
    
    switch (saveQuota.level) {
      case 'normal':
        levelText = '普通用户';
        upgradeText = '升级到高级用户可保存20个文档';
        break;
      case 'premium':
        levelText = '高级用户';
        upgradeText = '感谢您的支持！';
        break;
    }
    
    wx.showModal({
      title: '保存数量已达上限',
      content: `${levelText}最多可保存 ${saveQuota.limit} 个文档，当前已保存 ${saveQuota.used} 个。\n\n${upgradeText}\n\n您可以删除一些历史文档后再保存新文档。`,
      confirmText: '查看历史',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          // 打开历史文档抽屉
          this.handleHistoryBtnTap();
        }
      }
    });
  },

  // 检查是否为新文档
  isNewDocument() {
    return this.data.isDocumentNew;
  },

  // 更新文档新旧状态
  updateDocumentNewStatus() {
    // 如果没有当前文档ID，肯定是新文档
    if (!this.data.currentDocumentId) {
      this.setData({
        isDocumentNew: true
      });
      return;
    }
    
    // 检查当前文档ID是否存在于历史记录中
    const existsInHistory = this.data.historyDocuments.some(doc => doc.id === this.data.currentDocumentId);
    this.setData({
      isDocumentNew: !existsInHistory
    });
  },

  // 执行直接保存（不显示弹窗）
  performDirectSave() {
    this.setData({
      saving: true
    });

    // 显示保存中的提示
    this.showAlert('保存中...', 'loading');

    // 模拟保存过程
    setTimeout(() => {
      // 保存到本地存储
      this.saveToLocalStorage();
      
      this.setData({
        saving: false
      });
      
      this.showAlert('保存成功！', 'success');
    }, 800); // 稍微缩短保存时间，提升用户体验
  },

  // 处理历史按钮点击
  handleHistoryBtnTap() {
    this.loadHistoryDocuments();
    this.setData({
      showHistoryDrawer: true
    });
  },

  // 处理历史文档抽屉关闭
  handleHistoryDrawerClose() {
    this.setData({
      showHistoryDrawer: false
    });
  },

  // 注意：drawer-layout组件的"确定"按钮会触发handleCreateNewDocument方法

  // 创建新文档
  handleCreateNewDocument() {
    // 检查是否有未保存的更改
    if (this.hasUnsavedChanges()) {
      wx.showModal({
        title: '确认创建新文档',
        content: '当前文档有未保存的更改，创建新文档后将丢失这些更改。',
        success: (res) => {
          if (res.confirm) {
            this.createNewDocument();
          }
        }
      });
    } else {
      this.createNewDocument();
    }
  },

  // 创建新文档的实际逻辑
  createNewDocument() {
    const defaultTitle = this.formatDateTime(new Date());
    const documentId = this.generateDocumentId();
    
    this.setData({
      patternTitle: defaultTitle,
      data: [...this.data.initData], // 复制初始数据
      currentDocumentId: documentId,
      showHistoryDrawer: false,
      cur: '1',
      isDocumentNew: true // 新创建的文档
    });
    
    this.updateCurItem();
    this.calculateLineNumbers();
    this.caculateStiches();
    this.updateShowStichDisabled();
    
    this.showAlert('已创建新文档', 'success');
  },

  // 处理历史文档点击
  handleHistoryDocumentTap(e) {
    const documentId = e.currentTarget.dataset.id;
    const targetDocument = this.data.historyDocuments.find(doc => doc.id === documentId);
    
    if (!targetDocument) return;
    
    // 检查是否有未保存的更改
    if (this.hasUnsavedChanges()) {
      this.setData({
        switchTargetDocument: targetDocument,
        showSwitchConfirmDialog: true
      });
    } else {
      this.switchToDocument(targetDocument);
    }
  },

  // 检查是否有未保存的更改
  hasUnsavedChanges() {
    // 简单检查：如果有任何内容且当前文档不在历史记录中，则认为有未保存更改
    const hasContent = this.data.data.some(item => item.values && item.values.trim() !== '');
    if (!hasContent) return false;
    
    const currentExists = this.data.historyDocuments.some(doc => doc.id === this.data.currentDocumentId);
    return !currentExists;
  },

  // 切换到指定文档
  switchToDocument(document) {
    this.setData({
      patternTitle: document.patternTitle,
      data: document.data,
      currentDocumentId: document.id,
      showHistoryDrawer: false,
      showSwitchConfirmDialog: false,
      switchTargetDocument: null,
      isDocumentNew: false // 切换到已保存的文档
    });
    
    // 重置当前选中项为第一个
    if (document.data && document.data.length > 0) {
      this.setData({
        cur: document.data[0].id
      });
    }
    
    this.updateCurItem();
    this.calculateLineNumbers();
    this.caculateStiches();
    this.updateShowStichDisabled();
    
    this.showAlert('文档已切换', 'success');
  },

  // 处理切换确认弹窗关闭
  handleSwitchConfirmDialogClose() {
    this.setData({
      showSwitchConfirmDialog: false,
      switchTargetDocument: null
    });
  },

  // 处理确认切换
  handleConfirmSwitch() {
    if (this.data.switchTargetDocument) {
      this.switchToDocument(this.data.switchTargetDocument);
    }
  },

  // 删除历史文档
  handleDeleteHistoryDocument(e) {
    e.stopPropagation(); // 阻止事件冒泡
    const documentId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个历史文档吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          this.deleteDocument(documentId);
        }
      }
    });
  },

  // 删除文档
  deleteDocument(documentId) {
    try {
      const historyDocuments = this.data.historyDocuments.filter(doc => doc.id !== documentId);
      
      // 更新本地存储
      wx.setStorageSync('pattern-notes', historyDocuments);
      
      // 更新页面数据
      this.setData({
        historyDocuments: historyDocuments
      });
      
      // 更新保存配额
      this.updateSaveQuota();
      
      this.showAlert('文档已删除', 'success');
    } catch (error) {
      console.error('删除文档失败:', error);
      this.showAlert('删除失败，请重试', 'error');
    }
  },

  // 处理确认保存弹窗关闭
  handleSaveConfirmDialogClose() {
    if (this.data.saving) return; // 如果正在保存，不允许关闭
    this.setData({
      showSaveConfirmDialog: false
    });
  },

  // 处理确认保存
  handleConfirmSave() {
    if (this.data.saving) return;

    this.setData({
      saving: true
    });

    // 模拟保存过程
    setTimeout(() => {
      // 保存到本地存储
      this.saveToLocalStorage();
      
      this.setData({
        saving: false,
        showSaveConfirmDialog: false
      });
      
      this.showAlert('保存成功！', 'success');
    }, 1000);
  },

  // 保存到本地存储
  saveToLocalStorage() {
    try {
      const saveData = {
        patternTitle: this.data.patternTitle,
        data: this.data.data,
        saveTime: new Date().toISOString(),
        id: this.data.currentDocumentId || this.generateDocumentId() // 使用当前文档ID或生成新ID
      };

      // 获取现有的保存记录
      const existingSaves = wx.getStorageSync('pattern-notes') || [];
      
      // 检查是否已存在相同ID的记录
      const existingIndex = existingSaves.findIndex(item => item.id === saveData.id);
      
      if (existingIndex > -1) {
        // 更新现有记录
        existingSaves[existingIndex] = saveData;
      } else {
        // 添加新记录
        existingSaves.unshift(saveData);
      }

      // 限制最多保存20条记录
      if (existingSaves.length > 20) {
        existingSaves.splice(20);
      }

      // 保存到本地存储
      wx.setStorageSync('pattern-notes', existingSaves);
      
      // 更新当前文档ID和状态
      if (!this.data.currentDocumentId) {
        this.setData({
          currentDocumentId: saveData.id
        });
      }
      
      // 保存成功后，文档不再是新文档
      this.setData({
        isDocumentNew: false
      });
      
      // 刷新历史文档列表
      this.loadHistoryDocuments();
      
      console.log('保存成功:', saveData);
    } catch (error) {
      console.error('保存失败:', error);
      this.showAlert('保存失败，请重试', 'error');
    }
  },

  // 显示提示消息
  showAlert(message, type = 'info') {
    this.setData({
      alertMessage: message,
      showAlert: true
    });

    // 3秒后自动隐藏
    setTimeout(() => {
      this.setData({
        showAlert: false
      });
    }, 3000);
  },

  // 执行Canvas绘制
  performCanvasDraw(ctx, previewData, patternTitle, showStich, padding, lineHeight, sectionGap, titleHeight, fontSize, smallFontSize, totalHeight, canvasWidth) {
    let currentY = padding;
    
    // 绘制标题
    ctx.setFillStyle('#333333');
    ctx.setFontSize(16);
    ctx.setTextAlign('left');
    ctx.fillText(patternTitle, padding, currentY + titleHeight);
    
    // 绘制分割线
    currentY += titleHeight + 20;
    ctx.setStrokeStyle('#e5e5e5');
    ctx.setLineWidth(1);
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(canvasWidth - padding, currentY);
    ctx.stroke();
    currentY += 12;
    
    // 绘制各个部分
    previewData.forEach(section => {
      // 绘制部分标题
      ctx.setFillStyle('#666666');
      ctx.setFontSize(16);
      ctx.setTextAlign('left');
      ctx.fillText(section.title, padding, currentY + 16);
      currentY += 20 + 8;
      
      if (section.lines && section.lines.length > 0) {
        section.lines.forEach((lineData, index) => {
          const y = currentY + lineHeight;
          
          // 绘制行号
          ctx.setFillStyle('#999999');
          ctx.setFontSize(fontSize);
          ctx.setTextAlign('left');
          ctx.fillText(lineData.lineNumber, padding, y);
          
          // 绘制内容
          ctx.setFillStyle('#333333');
          ctx.fillText(lineData.content, padding + 50, y);
          
          // 如果显示针数且有针数数据
          if (showStich && lineData.stitch !== null && lineData.stitch !== undefined) {
            // 绘制虚线
            const contentWidth = ctx.measureText(lineData.content).width;
            const dashStartX = padding + 50 + contentWidth + 8;
            const dashEndX = canvasWidth - padding - 40; // 留出针数显示空间
            
            ctx.setStrokeStyle('#cccccc');
            ctx.setLineWidth(1);
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(dashStartX, y - 3);
            ctx.lineTo(dashEndX, y - 3);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 绘制针数
            ctx.setFillStyle('#666666');
            ctx.setFontSize(smallFontSize);
            ctx.setTextAlign('right');
            ctx.fillText(lineData.stitch.toString(), canvasWidth - padding, y);
          }
          
          currentY += lineHeight;
        });
      } else {
        // 绘制空内容提示
        ctx.setFillStyle('#cccccc');
        ctx.setFontSize(fontSize);
        ctx.setTextAlign('center');
        ctx.fillText('暂无内容', canvasWidth / 2, currentY + lineHeight);
        currentY += lineHeight + 8;
      }
      
      currentY += sectionGap;
    });
    
    // 绘制到Canvas
    ctx.draw();
  }
});