Component({
  properties: {
    value: {
      type: Number,
      value: 0
    },
    min: {
      type: Number,
      value: 0
    },
    max: {
      type: Number,
      value: 100
    },
    step: {
      type: Number,
      value: 1
    },
    class: {
      type: String,
      value: ''
    },
    disabledInput: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    handleMinus() {
      if (this.data.value <= this.data.min) return;
      const newValue = Math.max(this.data.value - this.data.step, this.data.min);
      this.triggerEvent('change', newValue);
    },

    handlePlus() {
      if (this.data.value >= this.data.max) return;
      const newValue = Math.min(this.data.value + this.data.step, this.data.max);
      this.triggerEvent('change', newValue);
    },

    handleInput(e) {
      if(this.data.disabledInput) return;
      let value = Number(e.detail.value);
      if (isNaN(value)) return;
      this.triggerEvent('change', value);
    },

    handleBlur(e) {
      let value = Number(e.detail.value);
      if (isNaN(value)) value = this.data.min;
      value = Math.max(this.data.min, Math.min(this.data.max, value));
      this.triggerEvent('change', value);
    }
  }
})