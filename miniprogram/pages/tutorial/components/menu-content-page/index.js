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
    }
  }
});

