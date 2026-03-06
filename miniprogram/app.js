App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库版本使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-env-id', // 请替换为你的云开发环境ID
        traceUser: true
      })
    }

    // 检查登录状态
    this.checkLogin()
  },

  // 检查登录状态
  checkLogin() {
    const userType = wx.getStorageSync('userType')
    this.globalData.userType = userType || null
  },

  globalData: {
    userType: null, // 'user' 或 'admin'
    userInfo: null,
    cart: [] // 购物车数据
  }
})
