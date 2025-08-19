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
    isShowStichDisabled: true // 控制显示针数功能是否禁用
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    // 生成默认标题（当前时间）
    const defaultTitle = this.formatDateTime(new Date());
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      patternTitle: defaultTitle
    });
    if(this.data.data.length === 0){
      this.setData({
        data: this.data.initData
      });
      this.updateCurItem();
      this.calculateLineNumbers();
      this.caculateStiches();
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
    
    // 这里可以实现下载功能，比如生成图片或PDF
    // 目前先模拟下载过程
    setTimeout(() => {
      this.setData({
        downloadLoading: false
      });
      wx.showToast({
        title: '下载完成',
        icon: 'success'
      });
    }, 2000);
  },
  
  // 保存图解到仓库功能
  handleSavePatternImg(){
    if (this.data.saveLoading) return;
    
    this.setData({
      saveLoading: true
    });
    
    // 这里可以实现保存到仓库的功能
    // 目前先模拟保存过程
    setTimeout(() => {
      this.setData({
        saveLoading: false,
        showPreviewDialog: false
      });
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    }, 2000);
  }
});