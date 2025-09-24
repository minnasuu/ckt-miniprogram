// pages/tutorial/adbout-wave/crochet-base/index.js
import { CROCHET_BASE_CHARACTER_DATA } from '../../data';
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
    this.getData(options.index);
  },

  getData(index){
    // this.setData({ isLoading: true });
    // wx.request({
    //   url: 'https://suminhan.cn/ckt/api/crochetCourseData.json',
    //   success: (res) => {
    //     const newIndex = index || 0;
    //     this.setData({
    //       title: res.data.data[newIndex].cap
    //     })
    //     const newData = res.data.data[newIndex].contentMenuList.map(item => {
    //       return {
    //         ...item,
    //         imgList: item.imgList.map(detail => {
    //           return {
    //             ...detail,
    //             img_src: detail.img_src ? detail.img_src.replace('./', 'https://suminhan.cn/ckt/') : '',
    //             isImgLoaded: false,
    //             hasImgError: false
    //           }
    //         })
    //       }
    //     })
    //     this.setData({
    //       list: newData,
    //       currentItem: newData[newIndex]
    //     })
    //   },
    //   fail: () => { },
    //   complete: () => {
    //     this.setData({ isLoading: false });
    //   }
    // })
    switch (index) {
      case "0":
        this.setData({
          list: CROCHET_BASE_CHARACTER_DATA,
          currentItem: CROCHET_BASE_CHARACTER_DATA[0]
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