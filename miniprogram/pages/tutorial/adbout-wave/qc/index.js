// pages/tutorial/adbout-wave/xc/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    selectedIndex: 0, // 当前选中的导航项索引
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getData();
  },

  getData(){
      wx.request({
        url: 'https://suminhan.cn/ckt/api/qcListData.json',
        success: (res) => {
          const newData = res.data.data.map(item => {
            return {
              ...item,
              detailList: item.detailList.map(detail => {
                return {
                  ...detail,
                  img: detail.img ? detail.img.replace('./', 'https://suminhan.cn/ckt/') : ''
                }
              })
            }
          })
          this.setData({
            list: newData
          })
        }
      })
  },

  // 点击左侧导航项
  onMenuClick(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedIndex: index
    });
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