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
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    handleChange() {
      if (this.properties.disabled) {
        return;
      }
      this.triggerEvent('change',{
        checked: this.properties.checked
      });
    }
  }
})