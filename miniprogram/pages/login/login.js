Page({
  // 用户登录
  loginAsUser() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.saveUserInfo('user', res.userInfo)
      },
      fail: () => {
        wx.showToast({
          title: '需要授权才能使用',
          icon: 'none'
        })
      }
    })
  },

  // 管理员登录
  loginAsAdmin() {
    wx.showModal({
      title: '管理员登录',
      content: '请输入管理员密码',
      editable: true,
      placeholderText: '请输入密码',
      success: (res) => {
        if (res.confirm) {
          const password = res.content
          // 简单密码验证，实际应该使用云函数验证
          if (password === 'admin123') {
    this.saveUserInfo('admin', { nickName: '管理员' })
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

  // 保存用户信息
  saveUserInfo(type, userInfo) {
    wx.setStorageSync('userType', type)
    wx.setStorageSync('userInfo', userInfo)

    const app = getApp()
    app.globalData.userType = type
    app.globalData.userInfo = userInfo

    wx.showToast({
      title: '登录成功',
      icon: 'success'
    })

    setTimeout(() => {
      if (type === 'user') {
        wx.switchTab({
          url: '/pages/user/index/index'
        })
      } else {
        wx.redirectTo({
          url: '/pages/admin/orders/orders'
        })
      }
    }, 1000)
  }
})
