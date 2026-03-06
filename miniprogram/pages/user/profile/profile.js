Page({
  data: {
    userInfo: {}
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const app = getApp()
    const userInfo = app.globalData.userInfo || {}
    this.setData({ userInfo })
  },

  // 跳转到订单列表
  goToOrders(e) {
    const status = e.currentTarget.dataset.status
    wx.switchTab({
      url: '/pages/user/orders/orders'
    })
  },

  // 管理员入口
  showAdminEntry() {
    wx.showModal({
      title: '管理员入口',
      content: '请输入管理员密码',
      editable: true,
      placeholderText: '请输入密码',
      success: (res) => {
        if (res.confirm) {
          if (res.content === 'admin123') {
            wx.navigateTo({
              url: '/pages/admin/orders/orders'
            })
          } else {
            wx.showToast({
              title: '密码错误',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '个人外卖小程序 v1.0.0\n\n用心做好每一道菜',
      showCancel: false
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          const app = getApp()
          app.globalData.userType = null
          app.globalData.userInfo = null
          app.globalData.cart = {}

          wx.reLaunch({
 redirectUrl: '/pages/login/login'
          })
        }
      }
    })
  }
})
