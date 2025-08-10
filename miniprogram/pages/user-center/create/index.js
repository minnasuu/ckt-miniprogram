Page({
  data: {
    list: []
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    const db = wx.cloud.database();
    try {
      const res = await db.collection('colorCards').get();
      const images = res.data;
      const resData = [];

      for (let i = 0; i < images.length; i++) {
        const tempUrl = await wx.cloud.getTempFileURL({
          fileList: [images[i].fileID]
        });
        resData.push(Object.assign(images[i], {
          image: tempUrl.fileList[0].tempFileURL
        }));
      }
      
      this.setData({
        list: resData
      });
    } catch (error) {
      console.error('获取图片数据失败:', error);
    }
  },
  onItemDeleteTap(e) {
    const { id } = e.detail;
    const db = wx.cloud.database();
    try {
      db.collection('colorCards').doc(id).remove({
        success: res => {
          console.log('删除成功:', res);
          this.loadData();
        },
        fail: err => {
          console.error('删除失败:', err);
        }
      });
    }catch (error) {
      console.error('删除数据失败:', error);
    }
  }
}); 