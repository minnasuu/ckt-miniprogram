// pages/management/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: 88,
    data:[
      // {id:'idea-update',title:'灵感日推',desc:'每天10:00更新'} // 临时隐藏AI灵感功能
    ],

    // 灵感日推 - 临时隐藏
    showIdeaUpdateDrawer:false,
    ideaUpdateTitleValue:'',
    ideaUpdateDescValue:'',
    ideaUpdateImages: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const systemInfo = wx.getSystemInfo();
    this.setData({
      statusBarHeight:systemInfo.statusBarHeight
    })
  },
  onCardTap(e){
      const {type} = e.currentTarget.dataset;
     switch (type) {
      case 'idea-update':
        this.updateIdea()
        break;
     
      default:
        break;
     }
  },
  // 发布灵感每日更新
  updateIdea(){
    this.setData({
      showIdeaUpdateDrawer:true
    })
  },
  onIdeaUpdateCancel(){
    this.setData({
      showIdeaUpdateDrawer:false
    })
  },
  // 假设需要先上传图片
async onIdeaUpdateSubmit() {
  wx.showLoading({
    title: '上传中...',
  })
  const {ideaUpdateTitleValue,ideaUpdateDescValue,ideaUpdateImages} = this.data;
  try {
    // 上传所有图片到云存储
    const fileIDs = await Promise.all(
      this.data.ideaUpdateImages.map(tempPath => 
        wx.cloud.uploadFile({
          cloudPath: `idea-images/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
          filePath: tempPath
        })
      )
    ).then(resList => resList.map(res => res.fileID));

    // 上传到数据库
    const db = wx.cloud.database();
    await db.collection('ideaList').add({ name: ideaUpdateTitleValue.trim(), desc: ideaUpdateDescValue.trim(), imgUrls: ideaUpdateImages });

    wx.showToast({ title: '上传成功' });
    wx.hideLoading()
  } catch (err) {
    console.error('上传失败:', err);
    wx.showToast({ title: '上传失败', icon: 'none' });
  }
},
  onIdeaUpdateTitleInput(e){
    const value = e.detail.value;
    this.setData({
      ideaUpdateTitleValue: value
    })
  },
  onIdeaUpdateDescInput(e){
    const value = e.detail.value;
    this.setData({
      ideaUpdateDescValue: value
    })
  },
  onIdeaUpdateImgChange(e){
    const {resData} = e.detail;
    this.setData({
      ideaUpdateImages:[...this.data.ideaUpdateImages,resData]
    })
  }
})