Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    list: {
      type: Array,
      value: []
    },
    currentItem: {
      type: Object,
      value: null
    },
    selectedIndex: {
      type: Number,
      value: 0
    },
    isLoading: {
      type: Boolean,
      value: false
    }
  },
  data: {
    __lastTapTimeMs: 0,
    __lastTapImgUrl: ''
  },
  methods: {
    onMenuTap(e){
      const index = e.currentTarget.dataset.index;
      this.triggerEvent('menutap', { index });
    },
    onImageLoad(e){
      this.triggerEvent('imageload', { imgIndex: e.currentTarget.dataset.imgindex });
    },
    onImageError(e){
      this.triggerEvent('imageerror', { imgIndex: e.currentTarget.dataset.imgindex });
    },
    onImageTap(e) {
      const tappedImgUrl = e.currentTarget.dataset.imgurl;
      const now = Date.now();
      const last = this.data.__lastTapTimeMs || 0;
      const lastUrl = this.data.__lastTapImgUrl || '';
      const isSameImg = lastUrl === tappedImgUrl;
      const isDouble = isSameImg && (now - last) < 300; // 300ms window

      if (isDouble) {
        const item = this.data.currentItem || {};
        const list = item.imgList || item.detailList || [];
        const urls = list
          .map(d => d && (d.img_src || d.img))
          .filter(u => !!u);
        const current = tappedImgUrl;
        if (urls && urls.length) {
          wx.previewImage({
            current,
            urls
          });
        }
        // reset to avoid triple tap chaining
        this.setData({ __lastTapTimeMs: 0, __lastTapImgUrl: '' });
      } else {
        this.setData({ __lastTapTimeMs: now, __lastTapImgUrl: tappedImgUrl });
      }
    }
  }
});

