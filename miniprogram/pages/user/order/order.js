Page({
  data: {
    order: {},
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.loadOrderDetail(options.id)
    }
  },

    // 加载订单详情
  loadOrderDetail(orderId) {
    const db = wx.cloud.database()
    const app = getApp()
    const openid = app.globalData.userInfo?.openid || ''

    db.collection('orders')
      .doc(orderId)
      .get()
      .then(res => {
        const order = res.data
        // 验证是否是当前用户的订单
        if (order.userId !== openid) {
          wx.showToast({
            title: '无权查看此订单',
            icon: 'none'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
          return
        }
        this.setData({ order, loading: false })
      })
      .catch(err => {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        console.error(err)
        this.setData({ loading: false })
      })
  },

  // 取消订单
  cancelOrder() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'order/update',
            data: {
              orderId: this.data.order._id,
              status: 'cancelled'
            }
          }).then(() => {
            wx.showToast({ title: '已取消', icon: 'success' })
            setTimeout(() => {
              this.loadOrderDetail(this.data.order._id)
            }, 1000)
          }).catch(err => {
            wx.showToast({ title: '取消失败', icon: 'none' })
            console.error(err)
          })
        }
      }
    })
  },

  // 支付订单
  payOrder() {
    wx.cloud.callFunction({
      name: 'order/payment',
      data: { orderId: this.data.order._id }
    }).then(res => {
      const { timeStamp, nonceStr, pkg, signType, paySign } = res.result

      wx.requestPayment({
        timeStamp,
        nonceStr,
        package: pkg,
        signType,
        paySign,
        success: () => {
          wx.showToast({ title: '支付成功', icon: 'success' })
          setTimeout(() => {
            this.loadOrderDetail(this.data.order._id)
          }, 1000)
        },
        fail: (err) => {
          if (err.errMsg.includes('cancel')) {
            wx.showToast({ title: '已取消支付', icon: 'none' })
          } else {
            wx.showToast({ title: '支付失败', icon: 'none' })
          }
        }
      })
    }).catch(err => {
      wx.showToast({
        title: '获取支付参数失败',
        icon: 'none'
      })
      console.error(err)
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

  // 获取状态图标
  getStatusIcon(status) {
    const iconMap = {
      pending: '⏰',
      paid: '✅',
      cooking: '🍳',
      delivering: '🛵',
      completed: '✨',
      cancelled: '❌'
    }
    return iconMap[status] || '📋'
  },

  // 获取状态样式类
  getStatusClass(status) {
    return status
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  }
})
