// pages/tutorial/adbout-wave/crochet-base/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    title: "",
    selectedIndex: 0, // 当前选中的导航项索引
    isLoading: true // 页面数据加载态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getData(options.index);
  },

  getData(index){
    this.setData({ isLoading: true });
      wx.request({
        url: 'https://suminhan.cn/ckt/api/crochetCourseData.json',
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
                  img_src: detail.img_src ? detail.img_src.replace('./', 'https://suminhan.cn/ckt/') : '',
                  isImgLoaded: false,
                  hasImgError: false
                }
              })
            }
          })
          this.setData({
            list: newData
          })
        },
        fail: () => { },
        complete: () => {
          this.setData({ isLoading: false });
        }
      })
  },

  onImageLoad(e) {
    const menuIndex = e.currentTarget.dataset.menuindex;
    const imgIndex = e.currentTarget.dataset.imgindex;
    const key = `list[${menuIndex}].imgList[${imgIndex}].isImgLoaded`;
    this.setData({ [key]: true });
  },

  onImageError(e) {
    const menuIndex = e.currentTarget.dataset.menuindex;
    const imgIndex = e.currentTarget.dataset.imgindex;
    const keyLoaded = `list[${menuIndex}].imgList[${imgIndex}].isImgLoaded`;
    const keyError = `list[${menuIndex}].imgList[${imgIndex}].hasImgError`;
    this.setData({ [keyLoaded]: true, [keyError]: true });
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