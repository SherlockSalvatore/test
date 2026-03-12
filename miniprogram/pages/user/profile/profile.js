Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: ''
    }
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // Load User Info from globalData or Storage
  loadUserInfo() {
    const app = getApp()

    // Check if we have manually saved avatar/nickname locally
    const savedAvatar = wx.getStorageSync('userAvatar')
    const savedNickname = wx.getStorageSync('userNickname')

    // Merge global user state if any with our local visual preferences
    const userInfo = app.globalData.userInfo || {}
    if (savedAvatar) userInfo.avatarUrl = savedAvatar
    if (savedNickname) userInfo.nickName = savedNickname

    this.setData({ userInfo })
  },

  // Handle Avatar Selection (New WeChat API Support)
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      'userInfo.avatarUrl': avatarUrl
    })
    // Save locally
    wx.setStorageSync('userAvatar', avatarUrl)
    if (getApp().globalData.userInfo) {
      getApp().globalData.userInfo.avatarUrl = avatarUrl
    }
  },

  // Handle Nickname Input
  onNicknameInput(e) {
    const nickName = e.detail.value
    this.saveNickname(nickName)
  },

  onNicknameChange(e) {
    const nickName = e.detail.value
    this.saveNickname(nickName)
  },

  saveNickname(nickName) {
    this.setData({
      'userInfo.nickName': nickName
    })
    wx.setStorageSync('userNickname', nickName)
    if (getApp().globalData.userInfo) {
      getApp().globalData.userInfo.nickName = nickName
    }
  },

  // 跳转地址管理
  goToAddress() {
    wx.navigateTo({
      url: '/pages/user/address/address'
    })
  },

  // 跳转到订单列表
  goToOrders(e) {
    const status = e.currentTarget.dataset.status
    wx.navigateTo({
      url: `/pages/user/orders/orders?status=${status}`
    })
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '璐璐私房菜 v1.0.0\n\n用心做好每道菜',
      showCancel: false
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新授权登录哦，确定吗？',
      confirmColor: '#4ade80',
      success: (res) => {
        if (res.confirm) {
          // 完全清除所有本地状态
          wx.clearStorageSync()

          const app = getApp()
          app.globalData.userType = null
          app.globalData.userInfo = null
          app.globalData.cart = {}

          // 立即重置当前页面数据，防止视觉残留
          this.setData({
            userInfo: {
              avatarUrl: '',
              nickName: ''
            }
          })

          // 退回到登录授权页面
          wx.reLaunch({
            url: '/pages/login/login'
          })

          wx.showToast({
            title: '已安全退出',
            icon: 'success'
          })
        }
      }
    })
  }
})
