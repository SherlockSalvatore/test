Page({
  data: {
    orderList: []
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  // // 加载订单列表
  loadOrders() {
    const db = wx.cloud.database()
    const _ = db.command
    // Try to get openid from global user info or direct storage
    const openid = wx.getStorageSync('OPENID') || (app.globalData.userInfo && app.globalData.userInfo.openid) || ''

    if (!openid) {
      console.warn('Could not find openid, cannot load orders')
      this.setData({ orderList: [] })
      return
    }

    db.collection('orders')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({ orderList: res.data })
      })
      .catch(err => {
        console.error('加载订单失败', err)
      })
  },

  // 跳转订单详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/user/order/order?id=${id}`
    })
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      pending: '待支付',
      paid: '已支付',
      cooking: '制作中',
      delivering: '配送中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return statusMap[status] || status
  },

  // 获取状态样式类
  getStatusClass(status) {
    return status
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  }
})
