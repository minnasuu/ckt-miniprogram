import { KNIT_BASE_PICTURE_DATA } from "../../data";

// pages/tutorial/knit/knit-detail/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    title: "",
    selectedIndex: 0, // 当前选中的导航项索引
    currentItem: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.updateData(options.id);
  },

  updateData(id){
    switch (id) {
      case 'base_picture':
        this.setData({
          title: '棒针基础教程（实图版）',
          list: KNIT_BASE_PICTURE_DATA
        })
        break;
    
      default:
        break;
    }
  },

  onImageLoad(e) {
    const imgIndex = e.detail?.imgIndex ?? e.currentTarget.dataset.imgindex;
    const currentItem = this.data.list[this.data.selectedIndex];
    const nextItem = { ...currentItem };
    const listKey = currentItem.imgList ? 'imgList' : 'detailList';
    const newList = nextItem[listKey].slice();
    newList[imgIndex] = { ...newList[imgIndex], isImgLoaded: true };
    nextItem[listKey] = newList;
    const nextAll = this.data.list.slice();
    nextAll[this.data.selectedIndex] = nextItem;
    this.setData({ list: nextAll, currentItem: nextItem });
  },

  onImageError(e) {
    const imgIndex = e.detail?.imgIndex ?? e.currentTarget.dataset.imgindex;
    const currentItem = this.data.list[this.data.selectedIndex];
    const nextItem = { ...currentItem };
    const listKey = currentItem.imgList ? 'imgList' : 'detailList';
    const newList = nextItem[listKey].slice();
    newList[imgIndex] = { ...newList[imgIndex], isImgLoaded: true, hasImgError: true };
    nextItem[listKey] = newList;
    const nextAll = this.data.list.slice();
    nextAll[this.data.selectedIndex] = nextItem;
    this.setData({ list: nextAll, currentItem: nextItem });
  },

  // 点击左侧导航项
  onMenuClick(e) {
    const index = e.detail?.index ?? e.currentTarget.dataset.index;
    this.setData({
      selectedIndex: index,
      currentItem: this.data.list[index]
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