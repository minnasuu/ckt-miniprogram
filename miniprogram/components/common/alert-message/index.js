Component({
  properties: {
    message: {
      type: String,
      value: ''
    },
    show: {
      type: Boolean,
      value: false
    },
    type: {
      type: String,
      value: 'info' // 可选值：info, success, warning, error
    }
  }
})