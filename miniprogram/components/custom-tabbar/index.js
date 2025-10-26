Component({
  properties: {
    selected: {
      type: Number,
      value: 0
    }
  },
  data: {
    list: [
      {
        id: "tools",
        pagePath: "pages/tools/index",
        text: "织作时光"
      },
      {
        id: "collects",
        pagePath: "pages/collects/index",
        text: "玩✨"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const index = data.index;
      const path = this.data.list[index].pagePath;
      
      // 如果点击的是当前选中的 tab，不做处理
      if (this.properties.selected === index) {
        return;
      }

      // 打印调试信息
      console.log('切换到页面:', path);

      // 切换页面
      wx.switchTab({
        url: `/${path}`,
        success: () => {
          console.log('切换成功');
        },
        fail: (error) => {
          console.error('切换失败:', error);
        }
      });
    }
  }
}); 