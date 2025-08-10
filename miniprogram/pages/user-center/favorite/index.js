Page({
  data: {
    list: []
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    // TODO: 从服务器加载数据
    // 模拟数据
    this.setData({
      list: [
        {
          id: 1,
          title: '收藏内容1',
          image: '/images/default-content.png',
          author: {
            avatar: '/images/default-avatar.png',
            name: '用户1'
          },
          tag: '灵感'
        },
        {
          id: 2,
          title: '收藏内容2',
          image: '/images/default-content.png',
          author: {
            avatar: '/images/default-avatar.png',
            name: '用户2'
          },
          tag: '动态'
        }
      ]
    });
  },

  onItemTap(e) {
    const { id } = e.detail;
    // TODO: 处理点击事件
    wx.showToast({
      title: '点击了收藏' + id,
      icon: 'none'
    });
  }
}); 