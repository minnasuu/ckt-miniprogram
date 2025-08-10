Component({
  properties: {
    text: {
      type: String,
      value: ''
    },
    checked: {
      type: Boolean,
      value: false
    },
    class: {
      type: String,
      value: ''
    }
  },

  methods: {
    handleChange() {
      this.triggerEvent('change');
    }
  }
})