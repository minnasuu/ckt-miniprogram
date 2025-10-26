// app.js
const LoginUtils = require('./utils/loginUtils');

App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: "cloud1-8gzjqovx9c2ec2e9", // 云开发环境 ID
        traceUser: true,
      });
    }

    // 清除所有旧版本登录数据，强制所有用户重新登录
    LoginUtils.clearAllOldLoginData();

    // 初始化全局数据
    this.globalData = {
      userInfo: null,
      fontsLoaded: false // 字体加载状态
    };

    // 加载自定义字体
    this.loadCustomFont();
  },

  /**
   * 加载自定义字体 Momozhuanji
   */
  loadCustomFont() {
    const that = this;
    
    // 先下载云文件到本地临时路径
    wx.cloud.downloadFile({
      fileID: 'cloud://cloud1-8gzjqovx9c2ec2e9.636c-cloud1-8gzjqovx9c2ec2e9-1307913003/Momozhuanji.ttf',
      success: (res) => {
        if (res.statusCode === 200) {
          const tempFilePath = res.tempFilePath;
          console.log('字体文件下载成功，本地路径:', tempFilePath);
          
          // 使用本地临时路径加载字体
          wx.loadFontFace({
            family: 'Momozhuanji',
            source: `url("${tempFilePath}")`,
            global: true,
            success: (loadRes) => {
              console.log('✅ 全局字体 Momozhuanji 加载成功', loadRes);
              that.globalData.fontsLoaded = true;
            },
            fail: (loadErr) => {
              console.error('❌ 全局字体 Momozhuanji 加载失败', loadErr);
              that.globalData.fontsLoaded = false;
            }
          });
        } else {
          console.error('字体文件下载失败，状态码:', res.statusCode);
          that.globalData.fontsLoaded = false;
        }
      },
      fail: (err) => {
        console.error('❌ 下载云文件失败', err);
        that.globalData.fontsLoaded = false;
      }
    });
  }
});
