import { MATERIAL_CROCHET_SYMBOL_DATA,  MATERIAL_CROCHET_TEXT_SYMBOL_DATA,  MATERIAL_KNIT_SYMBOL_DATA, MATERIAL_KNIT_TEXT_SYMBOL_DATA } from "../../data";

// pages/tutorial/crochet/crochet-symbol-table/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title:"",
    titleData:  ['英文','符号','全称','含义'],
    data: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.updateData(options.id);
  },

  updateData(id){
    console.log(id);
    switch (id) {
      case "material_symbol":
        this.setData({
          title: "钩针图示符号表",
          data: MATERIAL_CROCHET_SYMBOL_DATA
        })
        break;
        case "knit_symbol":
        this.setData({
          title: "棒针图示符号表",
          data: MATERIAL_KNIT_SYMBOL_DATA
        })
      break;
      default:
        this.setData({
          title: "钩针图示符号表",
          data: MATERIAL_CROCHET_SYMBOL_DATA
        })
        break;
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