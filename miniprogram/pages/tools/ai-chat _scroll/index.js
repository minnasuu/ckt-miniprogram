// pages/tools/ai-ck-style/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: 88,
    keyboardHeight: 0,
    author:null,
    inputValue: '',
    messages: [],
    messageId: 0,
    generating: false,
    scrollToMessage: '',
    showAlert: false,
    alertMessage: '',
    scrollTop: 0,
    // 是否滚动监听中，区别于手动滚动
    isAutoSCroll:false,
    hisMessages:[],
    dragStartScrollTop:0,
    lastScrollTop: 0,
    // 是否正在加载历史消息
    isLoadingHistory: false,
    // 历史消息页码
    historyPage: 1,
    // 是否正在下拉刷新
    isRefreshing: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onReady(){
    wx.nextTick(() => {
      this.scrollToBottom();
    });
  },
  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });

    // 检查用户是否登录，获取用户头像
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        author: userInfo
      });
    }

    const hour = new Date().getHours();
    let txt = '你好'
    if (hour >= 5 && hour < 12) {
      txt = '早上好';
    } else if (hour >= 12 && hour < 18) {
      txt = '下午好';
    } else {
      txt = '晚上好';
    }   
    
    // 添加欢迎消息
    const username = userInfo.username
    this.addMessage({
      role: 'ai',
      content: `${txt}, ${username||''}${username?'。':''}有什么想要问我的吗？`
    });
  },
  
  scrollToBottom(){
    console.log('scrollToBottom');
    
    const query = wx.createSelectorQuery();
    query.select('#dialogue-scroll-inner').boundingClientRect();
    query.exec((res) => {
      query.select('#dialogue-scroll-container').boundingClientRect();
      query.exec((res) => {
        const innerHeight = res[0].height;
        const containerHeight = res[1].height;        
        const scrollTop = innerHeight-containerHeight;
        this.setData({
          scrollTop
        });
      })
    });
  },
  onInputChange(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },
  
  onKeyboardHeightChange(e) {
    this.setData({
      keyboardHeight: e.detail.height
    });
  },
  
  // 添加消息到聊天列表
  addMessage(message) {
    const messageId = this.data.messageId + 1;
    const newMessage = {
      ...message,
      id: messageId
    };
    
    const messages = [...this.data.messages,newMessage];
    
    this.setData({
      messages,
      messageId,
      scrollToMessage: `message-${messageId}`
    },()=>{
      wx.nextTick(() => {
        this.scrollToBottom();
      });
    });
    
    return messageId;
  },
  
  // 发送消息
  sendMessage() {
    if (!this.data.inputValue.trim()) return;
    if(this.data.generating){
      // 终止生成
      this.showMessage('生成已终止');
      this.setData({
        generating: false
      });
      return;
    }
    
    const userMessage = {
      role: 'user',
      content: this.data.inputValue.trim()
    };
    
    // 添加用户消息
    this.addMessage(userMessage);
    
    // 清空输入框
    this.setData({
      inputValue: '',
      generating: true
    });
    
    // 添加AI正在生成的消息
    const aiMessageId = this.addMessage({
      role: 'ai',
      content: '',
      generating: true
    });
    
    // 调用GPT生图API
    this.generateImageWithGPT(userMessage.content, aiMessageId);
  },
  
  // 使用GPT生成图片
  async generateImageWithGPT(prompt,aiMessageId) {
    this.setData({
      isAutoSCroll:true
    });
    const model = wx.cloud.extend.AI.createModel("deepseek");
    const systemPrompt = "当前的小程序叫织作时光（简称CKT），我是CKT小助手。";
    // 将系统提示词和用户输入，传入大模型
    const res = await model.streamText({
      data: {
        model: "deepseek-r1", // 指定具体的模型
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      },
    });
    for await (let str of res.textStream) {
      this.setData({
        messages: this.data.messages.map(msg => {
          if (msg.id === aiMessageId) {
            return {
             ...msg,
              content: msg.content + str,
              generating: false
            };
          }
          return msg;
        })
      },()=>{
        wx.nextTick(() => {
          if(this.data.isAutoSCroll)this.scrollToBottom();
        });
      });
    }
    this.setData({
      generating: false,
      isAutoSCroll:false
    });
  },
  onDragStart(e) {
    // 记录开始拖拽时的滚动位置
    this.setData({
      dragStartScrollTop: this.data.scrollTop,
      lastScrollTop: this.data.scrollTop
    });
  },
  onDragging(e) {
    const currentScrollTop = e.detail.scrollTop;
    const lastScrollTop = this.data.lastScrollTop;
    
    // 判断滚动方向
    if (currentScrollTop < lastScrollTop) {
      // 向上滚动，关闭自动滚动
      this.setData({
        isAutoSCroll: false
      });
    }
    
    // 更新最后的滚动位置
    this.setData({
      lastScrollTop: currentScrollTop
    });
  },
  onDragEnd(e) {
    if(this.data.isLoadingHistory)return;
    const query = wx.createSelectorQuery();
    query.select('#dialogue-scroll-inner').boundingClientRect();
    query.select('#dialogue-scroll-container').boundingClientRect();

    query.exec((res) => {
      if(this.data.lastScrollTop===0)return
      if (res[0] && res[1]) {
        const innerHeight = res[0].height;
        const containerHeight = res[1].height;
        const currentScrollTop = e.detail.scrollTop;
       if(innerHeight>containerHeight){
         // 计算最大可滚动距离
         const maxScrollTop = innerHeight - containerHeight;
         
         // 判断是否滚动到底部（允许一定的误差）
         const isAtBottom = Math.abs(maxScrollTop - currentScrollTop) <= 10;
         
         if (isAtBottom) {
           // 如果滚动到底部，开启自动滚动
           this.setData({
             isAutoSCroll: true
           });
         }
       }
      }
    });
  },
  
  // 获取随机示例图片
  
  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: [url],
      current: url
    });
  },
  
  // 显示提示消息
  showMessage(msg) {
    this.setData({
      showAlert: true,
      alertMessage: msg
    });
    
    // 2秒后自动隐藏
    setTimeout(() => {
      this.setData({
        showAlert: false,
        alertMessage: ''
      });
    }, 2000);
  },

  // 处理下拉刷新
  onRefresh() {
    if (this.data.isRefreshing || this.data.isLoadingHistory) return;
    
    this.setData({
      isRefreshing: true
    });

    // 触发加载历史消息
    this.loadHistoryMessages().finally(() => {
      this.setData({
        isRefreshing: false
      });
    });
  },

  // 加载历史消息
  async loadHistoryMessages() {
    this.setData({
      isLoadingHistory: true
    });

    try {
      // 模拟加载延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      // 模拟历史消息数据
      const mockMessages = this.data.mockHisMessages[this.data.historyPage%2];

      if (mockMessages.length > 0) {
        // 将新消息添加到历史消息列表
        const newHistoryMessages = mockMessages.map((msg, index) => ({
          ...msg,
          id: `history_${this.data.historyPage}_${index}`
        }));

        this.setData({
          hisMessages: [...newHistoryMessages],
          historyPage: this.data.historyPage + 1
        });

        // 等待DOM更新后计算新高度并调整滚动位置
        wx.nextTick(() => {
          const query = wx.createSelectorQuery();
          query.select('.alternate-history').boundingClientRect();
          query.exec((res) => {
            if (res[0]) {
              const newInnerHeight = res[0].height;
              
              // 设置新的滚动位置，保持原有内容在相同位置
              this.setData({
                scrollTop: newInnerHeight
              });
              wx.nextTick(() => {
                this.setData({
                  messages: [...newHistoryMessages,...this.data.messages],
                  isLoadingHistory: false
                });
              })
            }
          });
        });
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
      this.showMessage('加载历史消息失败');
    } finally {
      this.setData({
        isLoadingHistory: false
      });
    }
  },
});