// pages/tutorial/knit/knit-detail/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    title: "",
    selectedIndex: 0, // 当前选中的导航项索引
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getData(options.index);
  },

  getData(index){
      wx.request({
        url: 'https://suminhan.cn/ckt/api/knitCourseData.json',
        success: (res) => {
          const newIndex = index || 0;
          this.setData({
            title: res.data.data[newIndex].cap
          })
          const newData = res.data.data[newIndex].contentMenuList.map(item => {
            return {
              ...item,
              imgList: item.imgList.map(detail => {
                return {
                  ...detail,
                  img_src: detail.img_src ? detail.img_src.replace('./', 'https://suminhan.cn/ckt/') : ''
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