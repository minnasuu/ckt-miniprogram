Component({
  properties: {
    list: {
      type: Array,
      value: []
    }
  },
  data:{
    showMask:false,
    screenWidth: 375,
  },
  lifetimes:{
  attached(){
    const systemInfo = wx.getWindowInfo();
    this.setData({
      screenWidth:systemInfo.windowWidth
    })
  }
  },
  methods: {
    onContianerTap(){
      this.setData({
        showMask:false
      })
    },
    onItemTap(e) {
      const { id } = e.currentTarget.dataset;
    },
    onItemLongTap(e) {
      const { id } = e.currentTarget.dataset;
      this.setData({
        showMask: id
      })
      this.triggerEvent('itemLongTap', { id });
    },
    onDownload(e) {
      const { id } = e.currentTarget.dataset;
      this.triggerEvent('itemDownloadTap', { id });
    },
    onDelete(e) {
      const { id } = e.currentTarget.dataset;
      this.triggerEvent('itemDeleteTap', { id });
    },
    onPublish(e) {
      const { id } = e.currentTarget.dataset;
      this.triggerEvent('itemPublishTap', { id });
    }
  }
}); 