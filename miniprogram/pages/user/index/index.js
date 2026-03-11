Page({
  data: {
    categories: ['全部', '美食套餐', '手工面点', '鲜榨果蔬', '健康零食'],
    currentCategory: '全部',
    menuList: [],
    cart: {},
    cartTotal: 0,
    cartAmount: 0,
    orderedItemIds: [] // Track items already purchased
  },

  onLoad() {
    this.setData({ cart: getApp().globalData.cart || {} })
    this.loadMenu()
  },

  onShow() {
    this.updateCartGlobal(getApp().globalData.cart || {})
    this.loadUserOrderedItems()
  },

  // Fetch all items the user has already bought (paid orders)
  loadUserOrderedItems() {
    const db = wx.cloud.database()
    const openid = wx.getStorageSync('OPENID')
    if (!openid) return

    db.collection('orders')
      .where({
        _openid: openid,
        status: db.command.in(['paid', 'cooking', 'delivering', 'completed'])
      })
      .get()
      .then(res => {
        const orderItems = res.data.reduce((acc, order) => {
          return acc.concat(order.items.map(item => item.menuId))
        }, [])
        // Use a Set to remove duplicates
        this.setData({ orderedItemIds: [...new Set(orderItems)] })
      })
      .catch(err => {
        console.error('获取已下单商品失败', err)
      })
  },

  loadMenu() {
    wx.showLoading({ title: '加载中...' })
    const db = wx.cloud.database()
    const collection = db.collection('menu')

    let query = { available: true }
    if (this.data.currentCategory !== '全部') {
      query.category = this.data.currentCategory
    }

    collection.where(query).get().then(res => {
      const cart = this.data.cart || {}
      const menuList = res.data.map(item => {
        return {
          ...item,
          quantity: cart[item._id] ? cart[item._id].quantity : 0
        }
      })
      this.setData({ menuList })
      wx.hideLoading()
    }).catch(err => {
      console.error('获取菜单失败', err)
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ currentCategory: category }, () => {
      this.loadMenu()
    })
  },

  increaseQuantity(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.menuList.find(i => i._id === id)
    if (!item) return;

    const cart = { ...this.data.cart }
    if (cart[id]) {
      cart[id].quantity += 1
    } else {
      cart[id] = { ...item, quantity: 1 }
    }
    this.updateCartGlobal(cart)
  },

  decreaseQuantity(e) {
    const id = e.currentTarget.dataset.id
    const cart = { ...this.data.cart }
    if (cart[id] && cart[id].quantity > 0) {
      cart[id].quantity -= 1
      if (cart[id].quantity === 0) {
        delete cart[id]
      }
      this.updateCartGlobal(cart)
    }
  },

  updateCartGlobal(cart) {
    let total = 0
    let amount = 0

    Object.values(cart).forEach(cartItem => {
      total += cartItem.quantity
      amount += cartItem.price * cartItem.quantity
    })

    const updatedMenuList = this.data.menuList.map(item => {
      return {
        ...item,
        quantity: cart[item._id] ? cart[item._id].quantity : 0
      }
    })

    this.setData({
      cart,
      cartTotal: total,
      cartAmount: amount.toFixed(2),
      menuList: updatedMenuList
    })

    getApp().globalData.cart = cart
  },

  goToCart() {
    wx.switchTab({
      url: '/pages/user/cart/cart'
    })
  }
})
