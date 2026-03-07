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
    const cart = app.globalData.cart || {}

    const db = wx.cloud.database()
    const menuIds = Object.keys(cart)

    if (menuIds.length === 0) {
      this.setData({ cartItems: [] })
      return
    }

    db.collection('menu').where({
      _id: db.command.in(menuIds)
    }).get().then(res => {
      const cartItems = res.data.map(item => ({
        menuId: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: cart[item._id] || 0
      }))

      this.calculateTotal(cartItems)
    })
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
    const cart = { ...app.globalData.cart }
    cart[id] = (cart[id] || 0) + 1

    const cartItems = this.data.cartItems.map(item => {
      if (item.menuId === id) {
        return { ...item, quantity: item.quantity + 1 }
      }
      return item
    })

    app.globalData.cart = cart
    this.calculateTotal(cartItems)
  },

  decrease(e) {
    const id = e.currentTarget.dataset.id
    const app = getApp()
    const cart = { ...app.globalData.cart }

    if (cart[id] > 0) {
      cart[id] = cart[id] - 1
      if (cart[id] === 0) {
        delete cart[id]
      }
    }

    let cartItems = this.data.cartItems
    if (cart[id]) {
      cartItems = cartItems.map(item => {
        if (item.menuId === id) {
          return { ...item, quantity: item.quantity - 1 }
        }
        return item
      })
    } else {
      cartItems = cartItems.filter(item => item.menuId !== id)
    }

    app.globalData.cart = cart
    this.calculateTotal(cartItems)

    if (cartItems.length === 0) {
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
      const { timeStamp, nonceStr, pkg, signType, paySign } = res.result

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
              url: '/pages/user/order/order?id=' + orderId
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
        title: '获取支付参数失败',
        icon: 'none'
      })
      console.error(err)
    })
  }
})
