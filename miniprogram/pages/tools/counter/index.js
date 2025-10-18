// pages/tools/counter/index.js
Page({
  data: {
    count: 0,
    history: [], // 记录操作历史
    statistics: {
      totalOperations: 0,
      totalTime: 0,
      averageInterval: 0,
      sessionStartTime: null
    },
    operationFrequency: '0',
    totalTimeDisplay: '0s',
    averageIntervalDisplay: '0s',
  },

  onLoad() {
    // 初始化会话开始时间
    this.setData({
      'statistics.sessionStartTime': new Date().getTime()
    });
    
    // 从本地存储加载计数数据
    this.loadCounterData();
  },

  onUnload() {
    // 页面卸载时保存数据
    this.saveCounterData();
  },

  onHide() {
    // 页面隐藏时保存数据
    this.saveCounterData();
  },

  // 加载计数器数据
  loadCounterData() {
    try {
      const countData = wx.getStorageSync('counter_data');
      if (countData) {
        this.setData({
          count: countData.count || 0,
          history: countData.history || [],
          statistics: countData.statistics || this.data.statistics
        });
        // 重新计算统计数据
        this.calculateStatistics();
      }
    } catch (error) {
      console.error('加载计数器数据失败:', error);
    }
  },

  // 保存计数器数据
  saveCounterData() {
    try {
      const data = {
        count: this.data.count,
        history: this.data.history,
        statistics: this.data.statistics
      };
      wx.setStorageSync('counter_data', data);
    } catch (error) {
      console.error('保存计数器数据失败:', error);
    }
  },

  // 增加计数
  increment() {
    const newCount = this.data.count + 1;
    this.updateCount(newCount, '加1');
  },

  // 减少计数
  decrement() {
    const newCount = this.data.count - 1;
    this.updateCount(newCount, '减1');
  },

  // 重置计数
  reset() {
    wx.showModal({
      title: '确认重置',
      content: '确定要将计数器重置为0吗？',
      confirmColor: '#003472',
      success: (res) => {
        if (res.confirm) {
          this.updateCount(0, '重置');
        }
      }
    });
  },

  // 更新计数并记录历史
  updateCount(newCount, operation) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    const timestampMs = now.getTime();
    
    const historyItem = {
      operation: operation,
      from: this.data.count,
      to: newCount,
      time: timestamp,
      timestamp: timestampMs
    };

    this.setData({
      count: newCount,
      history: [historyItem, ...this.data.history.slice(0, 9)] // 保留最近10条记录
    });

    // 更新统计数据
    this.updateStatistics(operation, timestampMs);

    // 触觉反馈
    wx.vibrateShort();
  },

  // 设置自定义数值
  setCustomValue() {
    wx.showModal({
      title: '设置数值',
      editable: true,
      placeholderText: '请输入数值',
      confirmColor: '#003472',
      success: (res) => {
        if (res.confirm && res.content) {
          const value = parseInt(res.content);
          if (!isNaN(value)) {
            this.updateCount(value, '设置');
          } else {
            wx.showToast({
              title: '请输入有效数字',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 清空历史记录
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空操作历史和统计数据吗？',
      confirmColor: '#003472',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            history: [],
            statistics: {
              totalOperations: 0,
              totalTime: 0,
              averageInterval: 0,
              sessionStartTime: new Date().getTime()
            },
            operationFrequency: '0',
            mostFrequentOperation: '加1',
            totalTimeDisplay: '0s',
            averageIntervalDisplay: '0s',
            incrementCount: 0,
            decrementCount: 0,
            resetCount: 0
          });
          wx.showToast({
            title: '数据已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 长按重置
  onLongPressReset() {
    this.reset();
  },

  // 更新统计数据
  updateStatistics(operation, timestamp) {
    const stats = this.data.statistics;
    
    // 更新操作计数
    stats.totalOperations += 1;
    
    // 计算总耗时（从会话开始到现在）
    if (stats.sessionStartTime) {
      stats.totalTime = timestamp - stats.sessionStartTime;
    }
    
    // 计算平均操作间隔
    if (stats.totalOperations > 1 && stats.totalTime > 0) {
      stats.averageInterval = Math.round(stats.totalTime / stats.totalOperations);
    }
    
    // 计算操作频率和最常用操作
    const operationFrequency = this.calculateOperationFrequency(stats);
    const totalTimeDisplay = this.formatTimeDisplay(stats.totalTime);
    const averageIntervalDisplay = this.formatTimeDisplay(stats.averageInterval);
    
    
    this.setData({
      statistics: stats,
      operationFrequency: operationFrequency,
      totalTimeDisplay: totalTimeDisplay,
      averageIntervalDisplay: averageIntervalDisplay,
    });
  },

  // 计算统计数据
  calculateStatistics() {
    const history = this.data.history;
    if (history.length === 0) return;
    
    const stats = {
      totalOperations: history.length,
      totalTime: 0,
      averageInterval: 0,
      sessionStartTime: this.data.statistics.sessionStartTime
    };
    
    
    // 计算总耗时
    if (history.length > 1) {
      const firstTime = history[history.length - 1].timestamp || 0;
      const lastTime = history[0].timestamp || 0;
      stats.totalTime = lastTime - firstTime;
      
      // 计算平均间隔
      if (stats.totalTime > 0) {
        stats.averageInterval = Math.round(stats.totalTime / (history.length - 1));
      }
    }
    
    // 计算操作频率和最常用操作
    const operationFrequency = this.calculateOperationFrequency(stats);
    const totalTimeDisplay = this.formatTimeDisplay(stats.totalTime);
    const averageIntervalDisplay = this.formatTimeDisplay(stats.averageInterval);
    
    
    this.setData({
      statistics: stats,
      operationFrequency: operationFrequency,
      totalTimeDisplay: totalTimeDisplay,
      averageIntervalDisplay: averageIntervalDisplay,
    });
  },

  // 格式化时间显示
  formatTime(milliseconds) {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${Math.round(milliseconds / 1000)}秒`;
    } else if (milliseconds < 3600000) {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.round((milliseconds % 60000) / 1000);
      return `${minutes}分${seconds}秒`;
    } else {
      const hours = Math.floor(milliseconds / 3600000);
      const minutes = Math.floor((milliseconds % 3600000) / 60000);
      return `${hours}小时${minutes}分钟`;
    }
  },

  // 格式化时间显示（简化版，用于统计显示）
  formatTimeDisplay(milliseconds) {
    if (milliseconds <= 0) {
      return '0s';
    } else if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    }
  },


  // 计算操作频率
  calculateOperationFrequency(stats) {
    if (stats.totalOperations > 0 && stats.totalTime > 0) {
      const frequency = stats.totalOperations / (stats.totalTime / 60000);
      return frequency.toFixed(1);
    }
    return '0';
  },

});
