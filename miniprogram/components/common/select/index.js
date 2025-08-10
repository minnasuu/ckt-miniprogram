Component({
  properties: {
    data: {
      type: Array,
      value: []
    },
    selected: {
      type: String,
      value: '1'
    },
    width: {
      type: String,
      value: '100%'
    },
    border: {
      type: Boolean,
      value: false
    }
  },
  
  data: {
    isOpen: false,
    selectedLabel: '' // 用于存储选中项的标签文本
  },
  
  lifetimes: {
    attached() {
      // 初始化时设置选中项的标签
      this.updateSelectedLabel();
    }
  },
  
  observers: {
    'selected, data': function(selected, data) {
      // 当选中值或数据变化时，更新标签
      this.updateSelectedLabel(selected, data);
    }
  },
  
  methods: {
    updateSelectedLabel(selected, data) {
      // 如果没有传参，使用 properties 中的值
      selected = selected || this.properties.selected;
      data = data || this.properties.data;
      
      if (data && data.length) {
        // 将 selected 转换为相同类型进行比较，或使用非严格相等
        const selectedItem = data.find(item => String(item.value) === String(selected));
        console.log('查找选中项:', selected, selectedItem);
        
        if (selectedItem) {
          this.setData({
            selectedLabel: selectedItem.label
          });
        } else if (data.length > 0) {
          // 如果没找到匹配项但有数据，默认显示第一项
          this.setData({
            selectedLabel: data[0].label
          });
        }
      }
    },
    
    toggleDropdown() {
      this.setData({
        isOpen: !this.data.isOpen
      });
    },
    
    closeDropdown() {
      this.setData({
        isOpen: false
      });
    },
    
    handleSelect(e) {
      const value = e.currentTarget.dataset.value;
      if (value !== undefined) {
        this.triggerEvent('change', { value });
        this.setData({
          isOpen: false
        });
      } else {
        console.error('未正确获取到选项的值');
        this.setData({
          isOpen: false
        });
      }
    }
  }
});