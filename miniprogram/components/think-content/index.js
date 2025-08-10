Component({
  properties: {
    content: {
      type: Object,
      value: null
    },
    thinking: {
      type: Boolean,
      value: true
    },
    messageId: {
      type: Number,
      value: 0
    }
  },
  data: {
    isExpanded: true,
    thinkTime: 0
  },
  observers: {
    'thinking': function(thinking) {
      if (thinking) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    }
  },
  lifetimes: {
    attached() {
      if (this.data.thinking) {
        this.startTimer();
      }
    },
    detached() {
      this.stopTimer();
    }
  },
  methods: {
    toggleExpand() {
      this.setData({
        isExpanded: !this.data.isExpanded
      });
    },
    startTimer() {
      this.startTime = Date.now();
      this.timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.setData({
          thinkTime: elapsed
        });
      }, 1000);
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }
}) 