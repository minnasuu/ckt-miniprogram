// tools.js
Page({
  data: {
    statusBarHeight: 0,
    tools: [
      {
        id: 1,
        icon: '/images/tools/export.png',
        title: '图解笔记本',
        description: '记录图解笔记、导出为图片',
        new: true,
        path: '/pages/tools/pattern-note/index'
      },
      {
        id: 2,
        icon: '/images/tools/export.png',
        title: '图片转像素',
        description: '图片一键转像素图、两种算法',
        new: true,
        path: '/pages/tools/image-to-pixel/index'
      },
      {
        id: 3,
        icon: '/images/tools/design.png',
        title: '提取图片主色',
        description: '一键提取图片主要颜色、生成色卡',
        new: false,
        path: '/pages/tools/extract-color/index'
      },
      {
        id: 4,
        icon: '/images/tools/material.png',
        title: '配色',
        description: '内置常用图样、线材色卡',
        new: false,
        path: '/pages/tools/color-palette/index'
      },
      {
        id: 5,
        icon: '/images/tools/template.png',
        title: '像素画板',
        description: '在线绘制像素图、内置线材色卡',
        new: false,
        path: '/pages/tools/pixel-canvas/index'
      },
      {
        id: 6,
        icon: '/images/tools/template.png',
        title: '图片换色',
        description: '在线更换图片颜色，一键预览相同款式的其他颜色效果',
        new: false,
        path: '/pages/tools/color-change/index'
      }
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
  
  // 卡片点击事件
  onToolTap(e) {
    const { id } = e.currentTarget.dataset;
    const tool = this.data.tools.find(item => item.id === id);
    
    if (tool && tool.path) {
      wx.navigateTo({
        url: tool.path
      });
    }
  },
  
  // 在Page对象中添加以下方法
  onAiToolTap(e) {
    const { id } = e.currentTarget.dataset;
    const aiTool = this.data.aiTools.find(item => item.id === id);
    
    if (aiTool && aiTool.path) {
      wx.navigateTo({
        url: aiTool.path
      });
    }
  }
});