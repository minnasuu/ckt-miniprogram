// tools.js
Page({
  data: {
    statusBarHeight: 0,
    tools: [
      {
        id: 'pattern',
        type: "图案工具",
        data: [
          {
            id: "pattern-1",
            icon: '✏️',
            title: '像素画板',
            description: '在线绘制像素图',
            new: false,
            path: '/pages/tools/pixel-canvas/index'
          },
          {
            id: "pattern-2",
            icon: '🧩',
            title: '图案配色',
            description: '内置常用图样、线材色卡',
            new: false,
            path: '/pages/tools/color-palette/index'
          },
        ]
      },
      {
        id: 'image',
        type: "图片工具",
        data: [
          {
            id: "iamge-1",
            icon: '◾️',
            title: '图片转像素',
            description: '图片一键转像素图、平均和合并两种算法',
            new: true,
            path: '/pages/tools/image-to-pixel/index'
          },
          {
            id: "image-2",
            icon: '🌈',
            title: '提取图片主色',
            description: '一键提取图片主要颜色、生成色卡',
            new: false,
            path: '/pages/tools/extract-color/index'
          },
          {
            id: "image-5",
            icon: '🏙️',
            title: '图片换色',
            description: '提取并更换图片颜色，一键预览相同款式的其他颜色效果',
            new: true,
            path: '/pages/tools/color-change/index'
          }
        ]
      },
      {
        id: 'note',
        type: '图解工具',
        data: [
          // {
          //   id: 1,
          //   icon: '📖',
          //   title: '图解笔记本',
          //   description: '记录文字图解、导出图片并下载',
          //   new: true,
          //   path: '/pages/tools/pattern-note/index'
          // },
          {
            id: 2,
            icon: '🔢',
            title: '计数器',
            description: '计数、统计、记录操作历史',
            new: true,
            path: '/pages/tools/counter/index'
          },
        ]
      },
    ],
    aiTools:[
        {
        id: 1,
        color: 'var(--ckt-theme-1)',
        title: '基础对话',
        description: '图片转钩针、棒针风格',
        path: '/pages/tools/ai-chat/index'
        },
      {
        id: 2,
        color: 'var(--ckt-theme-1)',
        title: '针织风格化',
        description: '图片转钩针、棒针风格',
        path: '/pages/tools/ai-ck-style/index'
      },
      {
        id: 3,
        color: 'var(--ckt-theme-2)',
        title: '玩偶脑暴空间',
        description: '输入提示词，生成对应风格的玩偶效果图',
        path: '/pages/tools/pixel-canvas/index'
      }
    ]
  },
  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
  },

  // 卡片点击事件
  onToolTap(e) {
    const { id, path } = e.currentTarget.dataset;
    
    if (path) {
      wx.navigateTo({
        url: path
      });
    }
  },
  
  // AI工具点击事件
  onAiToolTap(e) {
    const { id } = e.currentTarget.dataset;
    const aiTool = this.data.aiTools.find(item => item.id === id);
    
    if (aiTool && aiTool.path) {
      // 记录创作打卡
      this.recordCreateCheckIn();
      
      wx.navigateTo({
        url: aiTool.path
      });
    }
  },

  /**
   * 用户点击右上角分享给朋友
   */
  onShareAppMessage(res) {
    console.log('分享来源:', res.from);
    
    return {
      title: 'minna的工具集合站',
      path: '/pages/tools/index',
      // imageUrl: '/images/tools-share-cover.png', // 可以设置自定义分享封面图
    };
  },

  /**
   * 用户点击右上角分享到朋友圈
   */
  onShareTimeline() {
    console.log('分享到朋友圈');
    
    return {
      title: 'minna的工具集合站',
      query: '',
      // imageUrl: '/images/tools-share-cover.png',
    };
  }
});