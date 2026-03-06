Page({
  data: {
    filterTabs: [
      { label: '全部', value: 'all' },
      { label: '待处理', value: 'paid' },
      { label: '制作中', value: 'cooking' },
      { label: '配送中', value: 'delivering' },
      { label: '已完成', value: 'completed' }
    ],
    currentFilter: 'all',
    orderList: [],
    showDetail: false,
    currentOrder: {}
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  // 加载订单列表
  loadOrders() {
    const db = wx.cloud.database()
    let query = db.collection('orders')

    // 筛选条件
    if (this.data.currentFilter !== 'all') {
      query = query.where({ status: this.data.currentFilter })
    }

    query
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({ orderList: res.data })
      })
      .catch(err => {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        console.error(err)
      })
  },

  // 切换筛选
  switchFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ currentFilter: filter }, () => {
      this.loadOrders()
    })
  },

  // 显示订单详情
  showOrderDetail(e) {
    const order = e.currentTarget.dataset.order
    this.setData({
      showDetail: true,
      currentOrder: order
    })
  },

  // 隐藏详情
  hideDetail() {
    this.setData({ showDetail: false })
  },

  // 更新订单状态
  updateStatus(e) {
    const status = e.currentTarget.dataset.status
    const orderId = this.data.currentOrder._id

    wx.showModal({
      title: '确认操作',
      content: this.getStatusConfirmText(status),
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'order/update',
            data: {
              orderId,
              status
            }
          }).then(() => {
            wx.showToast({ title: '操作成功', icon: 'success' })
            this.hideDetail()
            this.loadOrders()
          }).catch(err => {
            wx.showToast({ title: '操作失败', icon: 'none' })
            console.error(err)
          })
        }
      }
    })
  },

  // 取消订单
  cancelOrder() {
    const orderId = this.data.currentOrder._id

    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'order/update',
            data: {
              orderId,
              status: 'cancelled'
            }
          }).then(() => {
            wx.showToast({ title: '已取消', icon: 'success' })
            this.hideDetail()
            this.loadOrders()
          }).catch(err => {
            wx.showToast({ title: '取消失败', icon: 'none' })
            console.error(err)
          })
        }
      }
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

  // 获取确认操作文本
  getStatusConfirmText(status) {
    const textMap = {
      cooking: '确定开始制作吗？',
      delivering: '确定开始配送吗？',
      completed: '确定完成订单为？'
    }
    return textMap[status] || '确定执行此操作吗？'
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
