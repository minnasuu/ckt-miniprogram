// tools.js
Page({
  data: {
    statusBarHeight: 0,
    showAiTools: false, // 控制AI工具显示/隐藏的开关
    tools: [
      {
        id: 'note',
        type: '图解工具',
        data: [
          {
            id: 1,
            icon: '/images/tools/export.png',
            title: '图解笔记本',
            description: '记录图解笔记、导出为图片',
            new: true,
            path: '/pages/tools/pattern-note/index'
          },
        ]
      },
      {
        id: 'image',
        type: "图片工具",
        data: [
          {
            id: "iamge-1",
            icon: '/images/tools/export.png',
            title: '图片转像素',
            description: '图片一键转像素图、两种算法',
            new: true,
            path: '/pages/tools/image-to-pixel/index'
          },
          {
            id: "image-2",
            icon: '/images/tools/design.png',
            title: '提取图片主色',
            description: '一键提取图片主要颜色、生成色卡',
            new: false,
            path: '/pages/tools/extract-color/index'
          },
          {
            id: "image-5",
            icon: '/images/tools/template.png',
            title: '图片换色',
            description: '在线更换图片颜色，一键预览相同款式的其他颜色效果',
            new: false,
            path: '/pages/tools/color-change/index'
          }
        ]
      },
      {
        id: 'pattern',
        type: "图案",
        data: [
          {
            id: "pattern-1",
            icon: '/images/tools/template.png',
            title: '像素画板',
            description: '在线绘制像素图、内置线材色卡',
            new: false,
            path: '/pages/tools/pixel-canvas/index'
          },
          {
            id: "pattern-2",
            icon: '/images/tools/material.png',
            title: '配色',
            description: '内置常用图样、线材色卡',
            new: false,
            path: '/pages/tools/color-palette/index'
          },
        ]
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
    const { id, path } = e.currentTarget.dataset;
    
    if (path) {
      wx.navigateTo({
        url: path
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