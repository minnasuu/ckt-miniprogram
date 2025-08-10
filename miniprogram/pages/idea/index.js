const { envList } = require("../../envList");
const { QuickStartPoints, QuickStartSteps } = require("./constants");

Page({
  // 在 data 中添加测试数据
  data: {
    knowledgePoints: QuickStartPoints,
    steps: QuickStartSteps,
    statusBarHeight: 0,
    showDropdown: false,
    selectData: [
      { value: '1', label: '全部' },
      { value: '2', label: '仅看钩织' },
      { value: '3', label: '仅看棒织' },
    ],
    selected: '1',
    ideaList: [], // 初始为空数组，通过请求获取数据
    isRefreshing: false,
    page: 1,
    hasMore: true,
    isLoading: false,
    showDetail: false,
    currentItem: {},
    currentSwiperIndex: 0,
    isZoomMode: false,
    scaleValue: 1,
    lastTapTime: 0
  },

  copyCode(e) {
    const code = e.target?.dataset?.code || '';
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '已复制',
        })
      },
      fail: (err) => {
        console.error('复制失败-----', err);
      }
    })
  },

  discoverCloud() {
    wx.switchTab({
      url: '/pages/examples/index',
    })
  },

  gotoGoodsListPage() {
    wx.navigateTo({
      url: '/pages/goods-list/index',
    })
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });

    // 加载初始数据
    this.fetchIdeaList();
  },

  // 获取灵感列表数据
  fetchIdeaList(filter = '1', page = 1) {
    this.setData({ isLoading: true });

    wx.showLoading({
      title: '加载中...',
    });

    // 使用微信请求API
    wx.request({
      url: 'https://suminhan.cn/api/ckt-miniprogram/idea.json',
      method: 'GET',
      data: {
        filter: filter,
        page: page,
        limit: 10
      },
      success: (res) => {
        // 从 res.data 中获取 API 返回的数据
        const { data, hasMore } = res.data;

        // 根据筛选条件过滤数据
        let filteredData = [];
        if (filter === '2') {
          filteredData = data.filter(item => item.isCrochet === true);
        } else if (filter === '3') {
          filteredData = data.filter(item => item.isKnit === true);
        } else {
          filteredData = data;
        }

        // 处理数据，确保图片加载状态正确
        const processedData = this.processIdeaList(filteredData);

        if (page === 1) {
          // 第一页，直接替换数据
          this.setData({
            ideaList: processedData,
            hasMore: hasMore
          });
        } else {
          // 加载更多，追加数据
          this.setData({
            ideaList: [...this.data.ideaList, ...processedData],
            hasMore: hasMore
          });
        }
      },
      fail: (err) => {
        console.error('获取灵感列表失败:', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });

        // 如果API请求失败，使用模拟数据（仅用于开发测试）
        if (page === 1) {
          const mockData = [
            { 
              id: 1, 
              name: 'GPT-4O', 
              imgUrls: [
                { value: 'https://suminhan.cn/images/aiImages/ckt-ideas/202504271900-hellokitty.png', mainColors: ['#FF0000', '#00FF00'] },
                { value: 'https://suminhan.cn/images/aiImages/ckt-ideas/202504271903-kuluomi.png', mainColors: ['#0000FF', '#FFFF00'] }
              ], 
              ratio: 1, 
              isCrochet: true, 
              isKnit: false 
            },
            { 
              id: 2, 
              name: 'GPT-4O', 
              imgUrl: { value: 'https://suminhan.cn/images/aiImages/ckt-ideas/202504301241-1.png', mainColors: ['#FF00FF'] }, 
              ratio: 1024 / 1536, 
              isCrochet: false, 
              isKnit: false 
            }
          ];

          // 根据筛选条件过滤模拟数据
          let filteredMockData = [];
          if (filter === '2') {
            filteredMockData = mockData.filter(item => item.isCrochet === true);
          } else if (filter === '3') {
            filteredMockData = mockData.filter(item => item.isKnit === true);
          } else {
            filteredMockData = mockData;
          }

          // 处理模拟数据
          const processedMockData = this.processIdeaList(filteredMockData);

          this.setData({
            ideaList: processedMockData
          });
        }
      },
      complete: () => {
        wx.hideLoading();
        this.setData({ isLoading: false });

        if (this.data.isRefreshing) {
          this.setData({ isRefreshing: false });
        }
      }
    });
  },

  // 处理筛选选择变化
  handleSelectChange(e) {
    const { value } = e.detail;
    this.setData({
      selected: value, 
      page: 1 // 重置页码
    });

    // 根据选择的值加载对应的数据
    this.fetchIdeaList(value, 1);
  },

  // 下拉刷新
  onRefresh() {
    if (this.data.isRefreshing || this.data.isLoading) return;

    this.setData({
      isRefreshing: true,
      page: 1
    });

    this.fetchIdeaList(this.data.selected || '1', 1);
  },

  // 上拉加载更多
  onLoadMore() {
    if (!this.data.hasMore || this.data.isLoading || this.data.isRefreshing) return;

    const nextPage = this.data.page + 1;

    this.setData({
      page: nextPage
    });

    this.fetchIdeaList(this.data.selected || '1', nextPage);
  },

  // 获取更多数据的方法（示例）
  getMoreData(page) {
    // 这里应该是实际的数据获取逻辑
    return [
      // 返回新的数据项
    ];
  },

  // 处理数据，确保多图时只处理前三张图片
  processIdeaList(data) {
    return data.map(item => {
      // 如果有多张图片，确保只处理前三张
      if (item.imgUrls && item.imgUrls.length > 0) {
        item.imgUrls.forEach((_, index) => {
          item[`image${index}Loaded`] = false;
        });
        item.loadedImagesCount = 0;
        item.imagesLoaded = false;
      } else if (item.imgUrl?.value) {
        // 单图情况
        item.imageLoaded = false;
      }
      return item;
    });
  },

  // 单张图片加载完成
  onImageLoad(e) {
    const { index } = e.currentTarget.dataset;
    const key = `ideaList[${index}].imageLoaded`;
    this.setData({
      [key]: true
    });
  },

  // 多张图片加载完成
  onMultiImageLoad(e) {
    const { index, imgIndex, total } = e.currentTarget.dataset;

    // 设置当前图片的加载状态
    const imageKey = `ideaList[${index}].image${imgIndex}Loaded`;
    this.setData({
      [imageKey]: true
    });

    // 获取当前项的已加载图片数量
    const item = this.data.ideaList[index];
    const loadedCount = item.loadedImagesCount || 0;

    // 更新已加载数量
    const newLoadedCount = loadedCount + 1;
    const countKey = `ideaList[${index}].loadedImagesCount`;

    // 如果所有图片都已加载，则设置整体加载完成标志
    if (newLoadedCount >= total) {
      const allLoadedKey = `ideaList[${index}].imagesLoaded`;
      this.setData({
        [countKey]: newLoadedCount,
        [allLoadedKey]: true
      });
    } else {
      this.setData({
        [countKey]: newLoadedCount
      });
    }
  },

  // 显示详情
  showDetail(e) {
    const { item, index } = e.currentTarget.dataset;
    this.setData({
      showDetail: true,
      currentItem: item,
      currentItemIndex: index,
      currentSwiperIndex: 0,
      scaleValue: 1,
      isZoomMode: false
    });
  },

  // 处理详情页swiper切换
  handleDetailSwiperChange(e) {
    const index = e.detail.current;
    const item = this.data.ideaList[index];

    this.setData({
      currentItem: item,
      currentItemIndex: index,
      currentSwiperIndex: 0,
      scaleValue: 1,
      isZoomMode: false
    });
  },

  // 处理详情页触摸开始
  handleDetailTouchStart(e) {
    if (this.data.isZoomMode) return; // 缩放模式下不处理滑动

    this.setData({
      touchStartY: e.touches[0].clientY,
      isSliding: false
    });
  },

  // 处理详情页触摸移动
  handleDetailTouchMove(e) {
    if (this.data.isZoomMode) return; // 缩放模式下不处理滑动

    const currentY = e.touches[0].clientY;
    const diffY = currentY - this.data.touchStartY;

    // 如果滑动距离超过50px，标记为正在滑动
    if (Math.abs(diffY) > 50 && !this.data.isSliding) {
      this.setData({
        isSliding: true
      });
    }
  },

  // 处理详情页触摸结束
  handleDetailTouchEnd(e) {
    if (this.data.isZoomMode || !this.data.isSliding) return; // 缩放模式或未滑动不处理

    const endY = e.changedTouches[0].clientY;
    const diffY = endY - this.data.touchStartY;

    // 向上滑动，显示下一个
    if (diffY < -100 && this.data.currentItemIndex < this.data.ideaList.length - 1) {
      // 添加过渡动画类
      this.setData({
        slidingClass: 'sliding-next'
      });

      // 延迟执行实际切换，让动画有时间显示
      setTimeout(() => {
        this.slideToNext();

        // 切换后移除动画类
        setTimeout(() => {
          this.setData({
            slidingClass: ''
          });
        }, 50);
      }, 250);
    }
    // 向下滑动，显示上一个
    else if (diffY > 100 && this.data.currentItemIndex > 0) {
      // 添加过渡动画类
      this.setData({
        slidingClass: 'sliding-prev'
      });

      // 延迟执行实际切换，让动画有时间显示
      setTimeout(() => {
        this.slideToPrev();

        // 切换后移除动画类
        setTimeout(() => {
          this.setData({
            slidingClass: ''
          });
        }, 50);
      }, 250);
    }

    this.setData({
      isSliding: false
    });
  },

  // 滑动到上一个项目
  slideToPrev() {
    if (this.data.currentItemIndex <= 0) return;

    const prevIndex = this.data.currentItemIndex - 1;
    const prevItem = this.data.ideaList[prevIndex];

    this.setData({
      currentItem: prevItem,
      currentItemIndex: prevIndex,
      currentSwiperIndex: 0,
      canSlidePrev: prevIndex > 0,
      canSlideNext: true,
      scaleValue: 1,
      isZoomMode: false
    });
  },

  // 滑动到下一个项目
  slideToNext() {
    if (this.data.currentItemIndex >= this.data.ideaList.length - 1) return;

    const nextIndex = this.data.currentItemIndex + 1;
    const nextItem = this.data.ideaList[nextIndex];

    this.setData({
      currentItem: nextItem,
      currentItemIndex: nextIndex,
      currentSwiperIndex: 0,
      canSlidePrev: true,
      canSlideNext: nextIndex < this.data.ideaList.length - 1,
      scaleValue: 1,
      isZoomMode: false
    });
  },

  // 隐藏详情
  hideDetail() {
    this.setData({
      showDetail: false
    });
  },

  // 阻止冒泡
  stopPropagation(e) {
    // 阻止事件冒泡
    return false;
  },

  // 轮播图切换
  swiperChange(e) {
    const currentSwiperIndex = e.detail.current;
    this.setData({
      currentSwiperIndex
    });
  },

  // 分享功能
  shareItem() {
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    });
  },

  // 收藏功能
  saveItem() {
    wx.showToast({
      title: '已收藏',
      icon: 'success'
    });
  },

  // 处理图片缩放
  onScale(e) {
    const scale = e.detail.scale;

    // 当缩放值大于1.2时，进入缩放模式
    if (scale > 1.2 && !this.data.isZoomMode) {
      this.setData({
        isZoomMode: true
      });
    }

    // 当缩放值小于1.1时，退出缩放模式
    if (scale < 1.1 && this.data.isZoomMode) {
      this.setData({
        isZoomMode: false,
        scaleValue: 1
      });
    }
  },

  // 图片双击事件处理
  onImageDoubleTap(e) {
    const currentTime = new Date().getTime();
    const lastTapTime = this.data.lastTapTime;

    // 如果两次点击间隔小于300ms，视为双击
    if (currentTime - lastTapTime < 300) {
      // 双击时退出缩放模式
      this.setData({
        isZoomMode: false,
        scaleValue: 1
      });
    }

    // 更新最后点击时间
    this.setData({
      lastTapTime: currentTime
    });

    // 阻止事件冒泡
    return false;
  },

  // 详情图片加载完成
  onDetailImageLoad(e) {
    // 图片加载完成后的处理
    console.log('详情图片加载完成', e.currentTarget.dataset.index);
  },

  // 切换到前一张图片
  prevImage(e) {
    const itemIndex = e.currentTarget.dataset.itemIndex;
    const item = this.data.ideaList[itemIndex];

    if (item.imgUrls && this.data.currentSwiperIndex > 0) {
      this.setData({
        currentSwiperIndex: this.data.currentSwiperIndex - 1
      });
    }
  },

  // 切换到下一张图片
  nextImage(e) {
    const itemIndex = e.currentTarget.dataset.itemIndex;
    const item = this.data.ideaList[itemIndex];

    if (item.imgUrls && this.data.currentSwiperIndex < item.imgUrls.length - 1) {
      this.setData({
        currentSwiperIndex: this.data.currentSwiperIndex + 1
      });
    }
  }
});