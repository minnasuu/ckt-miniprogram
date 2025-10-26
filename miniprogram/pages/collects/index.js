// pages/collects/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight:0,
    collects: [
      {
        id: 'pattern',
        type: "AI 工具",
        data: [
          {
            id: "pattern-1",
            icon: '📖',
            title: '答案之书',
            description: 'AI 版答案之书',
            new: true,
            path: '/pages/collects/ai-answer-book/index'
          },
        ]
      },
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
  },

  /**
   * 卡片点击事件
   */
  onToolTap(e) {
    const { id, path } = e.currentTarget.dataset;
    
    if (path) {
      wx.navigateTo({
        url: path
      });
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})