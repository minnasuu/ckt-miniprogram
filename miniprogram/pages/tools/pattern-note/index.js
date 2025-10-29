const LoginUtils = require('../../../utils/loginUtils');
const { addWatermarkToCanvas } = require('../../../utils/watermarkUtils');

Page({
  data: {
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
    lineValues: [],
    curLine: -1,
    showStich: false,
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
    showPermissionDialog: false, // 控制权限提示弹窗
    isDocumentNew: true, // 当前文档是否为新文档
    // 用户等级和保存限制相关
    userInfo: null, // 用户信息
    saveQuota: { // 保存配额信息
      used: 0, // 已使用数量
      limit: 0, // 限制数量
      level: 'guest' // 用户等级：guest, normal, premium, admin
    }
  },

  async onLoad(options) {

    // 检查是否有传入的图解ID
    if (options.id) {
      // 有传入ID，加载指定的图解文档
      await this.loadSpecificDocument(options.id);
    } else {
      // 没有传入ID，创建新文档
      this.createNewDocumentOnLoad();
    }

    // 初始化用户信息和保存配额
    this.initUserInfo();
    // 加载历史文档
    await this.loadHistoryDocuments();
  },

  onShow() {
    // 页面显示时重新检查用户信息，以防用户在其他页面登录
    this.initUserInfo();
  },

  // 创建新文档（onLoad时调用）
  createNewDocumentOnLoad() {
    // 生成默认标题（当前时间）
    const defaultTitle = this.formatDateTime(new Date());
    // 生成新文档ID
    const documentId = this.generateDocumentId();
    
    this.setData({
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
      this.calculateLineValues();
    }
  },

  // 加载指定的图解文档
  async loadSpecificDocument(documentId) {
    try {
      // 获取用户信息
      const userInfo = wx.getStorageSync('userInfo') || {};
      if (!userInfo.openId) {
        // 如果用户未登录，显示提示并创建新文档
        this.showAlert('请先登录以编辑图解文档', 'warning');
        this.createNewDocumentOnLoad();
        return;
      }

      const db = wx.cloud.database();

      // 从数据库获取指定文档
      const res = await db.collection('patternList')
        .doc(documentId)
        .get();

      if (!res.data) {
        // 文档不存在，显示提示并创建新文档
        this.showAlert('图解文档不存在或已被删除', 'error');
        this.createNewDocumentOnLoad();
        return;
      }

      const document = res.data;

      // 检查文档是否属于当前用户
      if (document.authorId !== userInfo.openId) {
        // 不是当前用户的文档，显示提示并创建新文档
        this.showAlert('无权限编辑此图解文档', 'error');
        this.createNewDocumentOnLoad();
        return;
      }

      // 解析文档数据
      let patternData = [];
      try {
        const contentData = JSON.parse(document.data || '[]');
        patternData = contentData.map(section => ({
          id: section.id || '1',
          title: section.title,
          values: section.values,
          nums: section.nums,
          edited: false
        }));
      } catch (parseError) {
        console.warn('解析文档内容失败:', parseError);
        // 如果解析失败，使用默认数据
        patternData = [{ id: '1', title: '第 1 部分', values: '', nums: [], edited: false }];
      }

      // 设置文档数据
      this.setData({
        patternTitle: document.title || '未命名图解',
        data: patternData,
        currentDocumentId: documentId,
        isDocumentNew: false, // 加载的是已存在的文档
        cur: patternData.length > 0 ? patternData[0].id : '1'
      });

      // 更新相关状态
      this.updateCurItem();
      this.calculateLineNumbers();
      this.caculateStiches();
      this.updateShowStichDisabled();
      this.calculateLineValues();
      this.showAlert('图解文档已加载', 'success');

    } catch (error) {
      console.error('加载指定文档失败:', error);
      this.showAlert('加载图解文档失败', 'error');
      // 加载失败时创建新文档
      this.createNewDocumentOnLoad();
    }
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
  async loadHistoryDocuments() {
    try {
      // 获取当前用户信息
      const userInfo = wx.getStorageSync('userInfo') || {};
      if (!userInfo.openId) {
        this.setData({
          historyDocuments: []
        });
        // 更新文档新旧状态
        this.updateDocumentNewStatus();
        // 更新保存配额
        this.updateSaveQuota();
        return;
      }

      const db = wx.cloud.database();

      // 从patternList集合获取用户保存的图解文档
      let res;
      try {
        res = await db.collection('patternList')
          .where({
            authorId: userInfo.openId,
            type: 'pattern-note'
          })
          .orderBy('createTime', 'desc')
          .get();
      } catch (collectionError) {
        // 如果是集合不存在的错误
        if (collectionError.errCode === -502005) {
          console.log('patternList集合不存在，用户暂无图解文档');
          this.setData({
            historyDocuments: []
          });
          // 更新文档新旧状态
          this.updateDocumentNewStatus();
          // 更新保存配额
          this.updateSaveQuota();
          return;
        }
        // 其他错误继续抛出
        throw collectionError;
      }

      const patterns = res.data || [];

      // 转换数据格式以适应现有的历史文档结构
      const historyDocuments = patterns.map(pattern => {
        let patternData = [];
        try {
          // 解析content字段中的JSON数据
          const contentData = JSON.parse(pattern.data || '[]');
          // 从解析的数据中提取实际的pattern数据
          patternData = contentData.map(section => ({
            id: section.id || '1',
            title: section.title,
            values: section.values,
            nums: section.nums,
            edited: false
          }));
        } catch (parseError) {
          console.warn('解析文档内容失败:', parseError);
          // 如果解析失败，使用默认数据
          patternData = [{ id: '1', title: '第 1 部分', values: '', nums: [], edited: false }];
        }

        const createTime = pattern.createTime || new Date();
        const updateTime = pattern.updateTime || pattern.createTime || new Date();


        const createTimeFormatted = this.formatHistoryTime(createTime);
        const updateTimeFormatted = this.formatHistoryTime(updateTime);
        return {
          id: pattern._id, // 使用数据库记录的_id作为文档ID
          patternTitle: pattern.title || '未命名图解',
          data: patternData,
          createTime: createTime,
          updateTime: updateTime,
          createTimeFormatted: createTimeFormatted,
          updateTimeFormatted: updateTimeFormatted,
          dataStrs: patternData.reduce((total, item) => total + item.values.length, 0)
        };
      });

      this.setData({
        historyDocuments: historyDocuments
      });
      // 更新文档新旧状态
      this.updateDocumentNewStatus();
      // 更新保存配额
      this.updateSaveQuota();
    } catch (error) {
      console.error('加载历史文档失败:', error);
      // 出错时设置为空数组，避免页面崩溃
      this.setData({
        historyDocuments: []
      });
      // 更新文档新旧状态
      this.updateDocumentNewStatus();
      // 更新保存配额
      this.updateSaveQuota();
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
  formatHistoryTime(dateInput) {
    console.log('formatHistoryTime 输入:', dateInput, typeof dateInput, dateInput instanceof Date);
    let date;

    // 处理各种可能的日期格式
    try {
      if (dateInput instanceof Date) {
        // 如果已经是Date对象
        date = dateInput;
        console.log('使用Date对象:', date);
      } else if (typeof dateInput === 'string') {
        // 如果是字符串，尝试解析
        // 处理类似 "Fri Aug 22 2025 22:00:42 GMT+0800 (中国标准时间) {}" 的格式
        const cleanDateString = dateInput.replace(/\s*\{\}$/, ''); // 移除末尾的 {}
        date = new Date(cleanDateString);
        console.log('从字符串解析:', cleanDateString, '->', date);
      } else if (typeof dateInput === 'object' && dateInput.$date) {
        // 处理MongoDB的日期格式
        date = new Date(dateInput.$date);
        console.log('从MongoDB格式解析:', dateInput.$date, '->', date);
      } else {
        // 其他情况直接尝试创建Date对象
        date = new Date(dateInput);
        console.log('其他格式解析:', dateInput, '->', date);
      }

      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('无效的日期格式:', dateInput, '解析结果:', date);
        return '时间未知';
      }
    } catch (error) {
      console.error('解析日期失败:', error, dateInput);
      return '时间未知';
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 如果时间差为负数（未来时间），直接显示具体日期
    if (diff < 0) {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
    }

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
      this.calculateLineValues();
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
  calculateLineValues() {
    const { curItem } = this.data;
    if (curItem) {
      const lines = curItem.values || '';
      const lineValues = lines.split('\n');
      this.setData({
        lineValues: lineValues
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
    this.calculateLineValues();
    this.caculateStiches();
    this.updateShowStichDisabled();
    this.updateUnsavedState();

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
    this.updateUnsavedState();
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
    this.updateUnsavedState();
  },
  handleShowStich(){
    const newShowStich = !this.data.showStich;
    console.log('显示针数状态:', newShowStich);
    console.log('当前项:', this.data.curItem);
    console.log('行数:', this.data.lineNumbers);
    console.log('行值:', this.data.lineValues);
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
    this.updateUnsavedState();
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
    this.updateUnsavedState();
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
      'w': 3, 'W': 3,
      'tw': 3, 'TW': 3,
      'fw': 3, 'FW': 3,
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
    // 使用高分辨率绘制方法
    this.drawHighResPatternCanvas((tempFilePath) => {
      if (tempFilePath) {
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
                    confirmColor: '#003472',
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
      } else {
        this.setData({ downloadLoading: false });
        this.showAlert('生成高分辨率图片失败，请重试', 'error');
      }
    });
  },

  // 高分辨率绘制方法
  drawHighResPatternCanvas(callback) {
    const { previewData, patternTitle, showStich } = this.data;
    const scaleFactor = 3; // 3倍放大

    // 延迟执行以确保Canvas元素已渲染
    setTimeout(() => {
      // 获取设备像素比
      const systemInfo = wx.getSystemInfoSync();
      const pixelRatio = systemInfo.pixelRatio || 2;

      // 获取Canvas宽度
      const query = wx.createSelectorQuery().in(this);
      query.select('.pattern-preview-canvas').boundingClientRect((rect) => {
        const canvasWidth = rect ? rect.width : 335; // 默认宽度
        const highResCanvasWidth = canvasWidth * scaleFactor;

        // 创建高分辨率canvas上下文
        const ctx = wx.createCanvasContext(this.data.canvasId, this);

        // Canvas样式配置
        const padding = 12 * scaleFactor;
        const lineHeight = 24 * scaleFactor;
        const sectionGap = 20 * scaleFactor;
        const titleHeight = 30 * scaleFactor;
        const fontSize = 14 * scaleFactor;
        const smallFontSize = 12 * scaleFactor;

        // 计算Canvas高度
        let totalHeight = padding + titleHeight + 20 + 12; // 标题高度 + 间距 + 分割线后间距
        totalHeight *= scaleFactor;

        previewData.forEach(section => {
          totalHeight += (20 + 8) * scaleFactor; // 部分标题高度
          if (section.lines && section.lines.length > 0) {
            totalHeight += section.lines.length * lineHeight + 8 * scaleFactor;
          } else {
            totalHeight += lineHeight + 8 * scaleFactor; // 空内容高度
          }
          totalHeight += sectionGap;
        });

        // 添加底部padding确保内容不被截断
        totalHeight += padding;

        // 开始绘制
        this.performHighResCanvasDraw(ctx, previewData, patternTitle, showStich, padding, lineHeight, sectionGap, titleHeight, fontSize, smallFontSize, totalHeight, highResCanvasWidth, scaleFactor, callback);
      }).exec();
    }, 100);
  },

  // 高分辨率Canvas绘制实现
  performHighResCanvasDraw(ctx, previewData, patternTitle, showStich, padding, lineHeight, sectionGap, titleHeight, fontSize, smallFontSize, totalHeight, canvasWidth, scaleFactor, callback) {
    let currentY = padding;
    ctx.clearRect(0, 0, canvasWidth, totalHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, totalHeight);

    // 绘制标题
    ctx.setFillStyle('#333333');
    ctx.setFontSize(16 * scaleFactor);
    ctx.setTextAlign('left');
    ctx.fillText(patternTitle, padding, currentY + titleHeight);

    // 绘制分割线
    currentY += titleHeight + 20 * scaleFactor;
    ctx.setStrokeStyle('#e5e5e5');
    ctx.setLineWidth(1 * scaleFactor);
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(canvasWidth - padding, currentY);
    ctx.stroke();
    currentY += 12 * scaleFactor;

    // 绘制各个部分
    previewData.forEach(section => {
      // 绘制部分标题
      ctx.setFillStyle('#666666');
      ctx.setFontSize(fontSize);
      ctx.fillText(section.title, padding, currentY + lineHeight);
      currentY += lineHeight + 8 * scaleFactor;

      // 绘制部分内容
      if (section.lines && section.lines.length > 0) {
        section.lines.forEach(line => {
          ctx.setFillStyle('#333333');
          ctx.setFontSize(smallFontSize);
          ctx.fillText(line, padding, currentY + lineHeight);
          currentY += lineHeight;
        });
      } else {
        ctx.setFillStyle('#999999');
        ctx.setFontSize(smallFontSize);
        ctx.fillText('暂无内容', padding, currentY + lineHeight);
        currentY += lineHeight;
      }

      currentY += sectionGap;
    });

    // 添加水印
    addWatermarkToCanvas(null, ctx, '织作时光', {
      fontSize: 12 * scaleFactor,
      color: 'rgba(0, 0, 0, 0)',
      position: 'bottom-right',
      padding: 10 * scaleFactor,
      canvasWidth: canvasWidth,
      canvasHeight: totalHeight
    });

    // 绘制完成后导出为图片
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: this.data.canvasId,
        success: (res) => {
          callback(res.tempFilePath);
        },
        fail: (err) => {
          console.error('导出高分辨率图片失败:', err);
          callback(null);
        }
      });
    });
  },

  // 保存图片到相册的方法（优化版：带权限检查）
  saveImageToAlbum(tempFilePath) {
    const saveHelper = require('../../../utils/saveImageHelper.js');
    saveHelper.saveImageToAlbum(tempFilePath, {
      onSuccess: () => {
        this.setData({ downloadLoading: false });
        this.showAlert('高分辨率图片已保存到相册🎉', 'success');
      },
      onFail: (err) => {
        console.error('保存图片到相册失败:', err);
        this.setData({ downloadLoading: false });
        this.showAlert('保存失败，请重试', 'error');
      },
      onCancel: () => {
        this.setData({ downloadLoading: false });
      }
    });
  },


  // 保存图解记录到云数据库
  async savePatternRecord() {
    // 首先生成Canvas图片
    const fileID = await this.generateCanvasImage();
    try {
      const db = wx.cloud.database();
      
      // 获取用户信息
      const userInfo = wx.getStorageSync('userInfo') || {};
      
      // 检查是否为新文档还是更新现有文档
      const isNewDoc = this.isNewDocument();

      if (isNewDoc) {
        // 新文档：使用add方法
        const result = await db.collection('patternList').add({
          data: {
            author: userInfo.username || '匿名用户',
            authorId: userInfo.openId || '',
            createTime: new Date(),
            updateTime: new Date(),
            title: this.data.patternTitle,
            data: JSON.stringify(this.data.data),
            tag: '图解笔记',
            type: 'pattern-note'
          }
        });

        // 更新当前文档ID为数据库生成的ID
        this.setData({
          currentDocumentId: result._id,
          isDocumentNew: false // 保存后不再是新文档
        });
      } else {
        // 更新现有文档：使用update方法
        await db.collection('patternList').doc(this.data.currentDocumentId).update({
          data: {
            title: this.data.patternTitle,
            data: JSON.stringify(this.data.data),
            updateTime: new Date()
          }
        });
      }

      // 重新加载历史文档以更新列表
      await this.loadHistoryDocuments();

      // 记录创作打卡（新建和更新都记录）
      const { recordCreationCheckIn } = require('../../../utils/checkInUtils');
      recordCreationCheckIn(1);

      this.setData({
        saveLoading: false,
        showPreviewDialog: false
      });

      
    } catch (error) {
      console.error('保存到数据库失败:', error);
      this.setData({ saveLoading: false });
      this.showAlert('保存失败，请重试', 'error');
    }
  },

  // 生成Canvas图片并上传到云存储
  async generateCanvasImage() {
    return new Promise((resolve, reject) => {
      // 确保预览数据是最新的
      const data = this.data.data;
      const updatedData = data.map(item => {
        const lines = (item.values || '').split('\n');
        const nums = lines.map(line => this.calculateExpression(line));
        return Object.assign({}, item, { nums: nums });
      });

      // 预处理数据
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
        previewData: processedData,
        data: updatedData
      }, () => {
        // 绘制Canvas
        this.drawPatternCanvas();

        // 等待Canvas绘制完成后生成图片
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvasId: this.data.canvasId,
            success: (res) => {
              const tempFilePath = res.tempFilePath;
              // 上传到云存储
              wx.cloud.uploadFile({
                cloudPath: `pattern-notes/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`,
                filePath: tempFilePath,
                success: (uploadRes) => {
                  resolve(uploadRes.fileID);
                },
                fail: (uploadErr) => {
                  console.error('上传图片失败:', uploadErr);
                  reject(uploadErr);
                }
              });
            },
            fail: (canvasErr) => {
              console.error('生成Canvas图片失败:', canvasErr);
              reject(canvasErr);
            }
          });
        }, 1000); // 等待Canvas绘制完成
      });
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
    const that = this;
    
    // 使用统一的权限检查
    return LoginUtils.checkSavePermission({
      onLoginRequired: () => {
        that.showLoginRequiredDialog();
      },
      onPermissionDenied: (userLevel) => {
        // 基础用户显示权限提示弹窗
        if (userLevel === 'normal') {
          that.setData({
            showPermissionDialog: true
          });
        }
      }
    });
  },

  // 显示登录提示弹窗
  showLoginRequiredDialog() {
    // 使用公共登录工具直接在当前页面执行登录
    LoginUtils.showLoginModal({
      title: '需要登录',
      content: '保存文档需要先登录账号，是否立即登录？',
      confirmText: '立即登录',
      onLoginSuccess: (userInfo) => {
        // 登录成功后更新用户信息和保存配额
        this.setData({
          userInfo: userInfo
        });
        this.updateSaveQuota();
        
        // 显示成功提示并自动重新尝试保存
        this.showAlert('登录成功！正在保存文档...', 'success');
        
        // 延迟一下再执行保存，让用户看到登录成功的提示
        setTimeout(() => {
          this.handleSaveBtnTap();
        }, 1000);
      },
      onCancel: () => {
        console.log('用户取消登录');
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
      confirmColor: '#003472',
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
  async performDirectSave() {
    this.setData({
      saving: true
    });

    // 显示保存中的提示
    this.showAlert('保存中...', 'loading');

    try {
      await this.savePatternRecord();
      // 保存成功后更新原始数据
      this.setData({
        saving: false,
        showSaveConfirmDialog: false,
        originalData: JSON.parse(JSON.stringify(this.data.data)),
        originalTitle: this.data.patternTitle,
        hasUnsavedChanges: false
      });
      
      this.showAlert('保存成功！', 'success');
    } catch (error) {
      this.setData({
        saving: false
      });
      this.showAlert('保存失败，请重试', 'error');
    }
  },

  // 处理历史按钮点击
  async handleHistoryBtnTap() {
    await this.loadHistoryDocuments();
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
    if (this.data.hasUnsavedChanges) {
      wx.showModal({
        title: '确认创建新文档',
        content: '当前文档有未保存的更改，创建新文档后将丢失这些更改。',
        confirmColor: '#003472',
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
    this.calculateLineValues();
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
    if (this.data.hasUnsavedChanges) {
      this.setData({
        switchTargetDocument: targetDocument,
        showSwitchConfirmDialog: true
      });
    } else {
      this.switchToDocument(targetDocument);
    }
  },

  // 检查是否有未保存的更改
  updateUnsavedState() {
    // 如果没有当前文档ID，说明是新文档，检查是否有内容
    const historyIds = this.data.historyDocuments.map(doc => doc.id);
    const currentDocument = this.data.historyDocuments.find(doc => doc.id === this.data.currentDocumentId);
    if (!historyIds.includes(this.data.currentDocumentId) || !currentDocument) {

      const hasContent = this.data.data.some(item => item.values && item.values.trim() !== '');
      if (hasContent) {
        this.setData({
          hasUnsavedChanges: true
        });
      }
      console.log('new document', hasContent);
    } else {
    // 比较标题是否有变化
      if (this.data.patternTitle !== currentDocument.title) {
        this.setData({
          hasUnsavedChanges: true
        });
    }

    // 比较数据内容是否有变化
    // 只比较关键字段：id, title, values, nums
    const currentDataStr = JSON.stringify(this.data.data.map(item => ({
      id: item.id,
      title: item.title,
      values: item.values || '',
      nums: item.nums || []
    })));

    const savedDataStr = JSON.stringify(currentDocument.data.map(item => ({
      id: item.id,
      title: item.title,
      values: item.values || '',
      nums: item.nums || []
    })));

      this.setData({
        hasUnsavedChanges: currentDataStr !== savedDataStr
      });
      console.log('hasUnsavedChanges', currentDataStr !== savedDataStr);
    }
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
    this.calculateLineValues();
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
    const documentId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个历史文档吗？删除后无法恢复。',
      confirmColor: '#003472',
      success: (res) => {
        if (res.confirm) {
          this.deleteDocument(documentId);
        }
      }
    });
  },

  // 删除文档
  async deleteDocument(documentId) {
    try {
      const db = wx.cloud.database();
      
      // 从数据库中删除文档
      await db.collection('patternList').doc(documentId).remove();
      
      // 重新加载历史文档以更新列表
      await this.loadHistoryDocuments();
      
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
  async handleConfirmSave() {
    if (this.data.saving) return;

    this.setData({
      saving: true
    });

    try {
      await this.savePatternRecord();
      // 保存成功后更新原始数据
      this.setData({
        saving: false,
        showSaveConfirmDialog: false,
        originalData: JSON.parse(JSON.stringify(this.data.data)),
        originalTitle: this.data.patternTitle,
        hasUnsavedChanges: false
      });
      
      this.showAlert('保存成功！', 'success');
    } catch (error) {
      this.setData({
        saving: false
      });
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

  // 关闭权限提示弹窗
  onPermissionDialogClose() {
    this.setData({
      showPermissionDialog: false
    });
  },

  // 执行Canvas绘制
  performCanvasDraw(ctx, previewData, patternTitle, showStich, padding, lineHeight, sectionGap, titleHeight, fontSize, smallFontSize, totalHeight, canvasWidth) {
    let currentY = padding;
    ctx.clearRect(0, 0, canvasWidth, totalHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, totalHeight);
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
    
    // 添加水印
    ctx.setFillStyle('rgba(0, 0, 0, 0)');
    ctx.setFontSize(10);
    ctx.setTextAlign('right');
    ctx.fillText('织作时光', canvasWidth - 8, totalHeight - 8);

    // 绘制到Canvas
    ctx.draw();
  },

  // 页面卸载时的处理
  onUnload() {
    // 页面卸载时不显示弹窗，直接退出
    // 这里可以做一些清理工作，但不能阻止页面卸载
  },

  // 自定义返回按钮处理（由custom-header触发）
  onCustomBack() {
    console.log('onCustomBack', this.data.hasUnsavedChanges);

    if (this.data.hasUnsavedChanges) {
      // 有未保存的更改，显示确认弹窗
      wx.showModal({
        title: '确认退出',
        content: '当前文档有未保存的更改，退出后将丢失这些更改。',
        confirmColor: '#003472',
        cancelText: '直接退出',
        confirmText: '保存退出',
        success: (res) => {
          if (res.confirm) {
            this.handleSaveAndExit();
          }
          if (res.cancel) {
            wx.navigateBack({
              delta: 1
            });
          }
        },
      });
    } else {
      wx.navigateBack({
        delta: 1
      });
    }
  },

  // 处理保存后退出
  async handleSaveAndExit() {
    if (!this.checkSavePermission()) {
      return;
    }

    this.setData({
      saving: true
    });

    try {
      await this.savePatternRecord();
      // 保存成功后直接退出
      this.setData({
        saving: false,
      });
      this.showAlert('保存成功！', 'success');
      // 延迟一下让用户看到成功提示
      setTimeout(() => {
        wx.navigateBack({
          delta: 1
        });
      }, 500);
    } catch (error) {
      this.setData({
        saving: false
      });
      this.showAlert('保存失败，请重试', 'error');
    }
  },
});