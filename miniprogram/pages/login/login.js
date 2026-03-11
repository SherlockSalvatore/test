Page({
  data: {
    isAgreed: false, // Track privacy policy agreement
    showPopup: false // Track popup visibility
  },

  onLoad() {
    this.checkAutoLogin();
  },

  // Check if we should skip the login page
  checkAutoLogin() {
    const token = wx.getStorageSync('token');
    const role = wx.getStorageSync('userRole');
    if (token) {
      if (role === 'admin') {
        wx.redirectTo({ url: '/pages/admin/orders/orders' });
      } else {
        wx.switchTab({ url: '/pages/user/index/index' });
      }
    }
  },

  // 监听复选框变化
  onAgreementChange(e) {
    this.setData({
      isAgreed: e.detail.value.length > 0
    });
  },

  // 打开弹窗
  openLoginPopup() {
    this.setData({
      showPopup: true
    });
  },

  // 关闭弹窗
  closeLoginPopup() {
    this.setData({
      showPopup: false,
      isAgreed: false // normally reset agreement when closing
    });
  },

  // 阻止冒泡
  stopBubble() { },

  // 如果未勾选协议点击按钮，提示用户
  checkAgreement() {
    if (!this.data.isAgreed) {
      wx.showToast({
        title: '请先阅读并勾选同意《用户服务协议》与《隐私政策》',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    return true;
  },

  // 用户在弹窗内点击授权登录
  loginAsUser(e) {
    if (!this.checkAgreement()) {
      return;
    }

    wx.showLoading({
      title: '登录中...',
    });

    // 获取前端 code
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用云函数，把 code 传过去（其实云托管可以直接拿 openid，传 code 是为了更严谨或对接非云开发后端）
          wx.cloud.callFunction({
            name: 'user-login',
            data: {
              code: res.code
            },
            success: (cloudRes) => {
              wx.hideLoading();
              const { token, role, openid } = cloudRes.result;

              if (token) {
                this.saveUserInfo(role, token, openid);
              } else {
                wx.showToast({ title: '登录失败，请重试', icon: 'error' });
              }
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('云函数[user-login]调用失败', err);
              wx.showToast({ title: '网络异常，请稍后再试', icon: 'none' });
            }
          });
        } else {
          wx.hideLoading();
          console.error('登录失败！' + res.errMsg);
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('wx.login 失败', err);
        wx.showToast({ title: '微信登录调用失败', icon: 'none' });
      }
    });
  },

  // 保存用户信息并跳转
  saveUserInfo(role, token, openid) {
    wx.setStorageSync('userRole', role);
    wx.setStorageSync('token', token);
    if (openid) {
      wx.setStorageSync('OPENID', openid);
    }

    const app = getApp();
    if (app && app.globalData) {
      app.globalData.userRole = role;
      app.globalData.token = token;

      // Ensure userInfo exists before patching openid
      if (!app.globalData.userInfo) {
        app.globalData.userInfo = {};
      }
      app.globalData.userInfo.openid = openid;
    }

    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });

    setTimeout(() => {
      // 根据不同的角色跳转到不同页面
      if (role === 'admin') {
        wx.redirectTo({
          url: '/pages/admin/orders/orders'
        });
      } else {
        wx.switchTab({
          url: '/pages/user/index/index' // 假设这里是普通用户的首页 TabBar
        });
      }
    }, 1000);
  },

  // 协议跳转
  goToAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/user-agreement'
    });
  },

  goToPrivacy() {
    wx.navigateTo({
      url: '/pages/agreement/privacy-policy'
    });
  }
});
