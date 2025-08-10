Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    options: {
      type: Array,
      value: []
    },
    currentIndex: {
      type: Number,
      value: 0
    },
    active: {
      type: Boolean,
      value: false
    }
  },
  methods: {
    onSelect(e) {
      const { index } = e.currentTarget.dataset;
      this.triggerEvent('select', { index });
    },
    closeDropdown() {
      this.triggerEvent('close');
    }
  }
}); 