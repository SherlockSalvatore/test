const DELIVERY_FEE = 5

Page({
  data: {
    cartItems: [],
    totalAmount: 0,
    address: {
      name: '',
      phone: '',
      detail: ''
    }
  },

  onLoad() {
    this.loadCartData()
  },

  onShow() {
    this.loadCartData()
  },

  loadCartData() {
    const app = getApp()
    const cartMap = app.globalData.cart || {}

    const cartItems = Object.values(cartMap).map(item => ({
      menuId: item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity
    }))

    if (cartItems.length === 0) {
      this.setData({ cartItems: [], totalAmount: "0.00" })
      return
    }

    this.calculateTotal(cartItems)
  },

  calculateTotal(cartItems) {
    let subtotal = 0
    cartItems.forEach(item => {
      subtotal += item.price * item.quantity
    })
    const total = subtotal + DELIVERY_FEE

    this.setData({
      cartItems,
      totalAmount: total.toFixed(2)
    })
  },

  increase(e) {
    const id = e.currentTarget.dataset.id
    const app = getApp()
    const cartMap = { ...app.globalData.cart }

    if (cartMap[id]) {
      cartMap[id].quantity += 1
    }

    app.globalData.cart = cartMap
    this.loadCartData()
  },

  decrease(e) {
    const id = e.currentTarget.dataset.id
    const app = getApp()
    const cartMap = { ...app.globalData.cart }

    if (cartMap[id] && cartMap[id].quantity > 0) {
      cartMap[id].quantity -= 1
      if (cartMap[id].quantity === 0) {
        delete cartMap[id]
      }
    }

    app.globalData.cart = cartMap
    this.loadCartData()

    if (Object.keys(cartMap).length === 0) {
      wx.navigateBack()
    }
  },

  onNameInput(e) {
    this.setData({
      'address.name': e.detail.value
    })
  },

  onPhoneInput(e) {
    this.setData({
      'address.phone': e.detail.value
    })
  },

  onAddressInput(e) {
    this.setData({
      'address.detail': e.detail.value
    })
  },

  goToOrder() {
    wx.navigateBack()
  },

  submitOrder() {
    const { cartItems, address, totalAmount } = this.data

    if (!address.name) {
      wx.showToast({ title: '请输入收货人', icon: 'none' })
      return
    }
    if (!address.phone) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }
    if (!address.detail) {
      wx.showToast({ title: '请输入详细地址', icon: 'none' })
      return
    }

    wx.showLoading({ title: '创建订单中...' })

    wx.cloud.callFunction({
      name: 'order-create',
      data: {
        items: cartItems,
        address,
        totalAmount: parseFloat(totalAmount),
        deliveryFee: DELIVERY_FEE
      }
    }).then(res => {
      wx.hideLoading()
      const { orderId } = res.result
      this.requestPayment(orderId)
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: '创建订单失败',
        icon: 'none'
      })
      console.error(err)
    })
  },

  requestPayment(orderId) {
    wx.cloud.callFunction({
      name: 'order-payment',
      data: { orderId }
    }).then(res => {
      // Handle the simulated payment response
      if (res.result && res.result.mockPayment) {
        wx.showToast({ title: '体验版模拟支付成功', icon: 'success' })
        getApp().globalData.cart = {}

        setTimeout(() => {
          // orders is NO LONGER a tabbar page, use redirectTo
          wx.redirectTo({
            url: '/pages/user/orders/orders?status=paid'
          })
        }, 1500)
        return
      }

      // Existing fallback for real payment payload
      const { timeStamp, nonceStr, pkg, signType, paySign } = res.result || {}

      if (!timeStamp) {
        throw new Error('No mock response and no real pay params returned.')
      }

      wx.requestPayment({
        timeStamp,
        nonceStr,
        package: pkg,
        signType,
        paySign,
        success: () => {
          wx.showToast({ title: '支付成功', icon: 'success' })
          getApp().globalData.cart = {}
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/user/orders/orders?status=paid'
            })
          }, 1500)
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
        title: '获取支付参数失败: ' + (err.message || '未知错误'),
        icon: 'none'
      })
      console.error(err)
    })
  }
})
