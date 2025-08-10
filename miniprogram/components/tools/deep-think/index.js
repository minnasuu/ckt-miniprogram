// components/tools/deep-think/index.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    steps: {
      type: Array,
      value: [{
        title: "理解问题",
        content: "首先，我们需要明确问题的核心..."
      },
      {
        title: "分析关键点",
        content: "问题的关键点在于..."
      },
      {
        title: "提出解决方案",
        content: "基于以上分析，我们可以..."
      }]
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isExpanded: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toggleExpand() {
      const isExpanded = !this.data.isExpanded;
      this.setData({
        isExpanded
      });
    },
  }
})