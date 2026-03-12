Page({
  data: {
    categories: ['全部', '美食套餐', '手工面点', '鲜榨果蔬', '健康零食'],
    currentCategory: '全部',
    menuList: [],
    cart: [], // 存储云端购物车数组 [{menuId, quantity, checked, ...}]
    cartTotal: 0,
    cartAmount: 0,
    orderedItemCounts: {} // 追踪回购次数
  },

  onLoad() {
    this.loadMenu()
  },

  onShow() {
    this.loadCart()
    this.loadUserOrderedItems()
  },

  // 从云端加载购物车
  async loadCart() {
    const db = wx.cloud.database()
    try {
      const res = await db.collection('carts').get()
      this.calculateTotal(res.data)
    } catch (err) {
      console.error('加载购物车失败', err)
    }
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
        const counts = {}
        res.data.forEach(order => {
          order.items.forEach(item => {
            const id = item.menuId
            counts[id] = (counts[id] || 0) + item.quantity
          })
        })
        this.setData({ orderedItemCounts: counts })
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

  // 增加数量 (同步云端)
  async increaseQuantity(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    
    const db = wx.cloud.database()
    const cartItem = this.data.cart.find(c => c.menuId === item._id)

    try {
      if (cartItem) {
        await db.collection('carts').doc(cartItem._id).update({
          data: { quantity: db.command.inc(1) }
        })
      } else {
        await db.collection('carts').add({
          data: {
            menuId: item._id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: 1,
            checked: true // 默认选中
          }
        })
      }
      this.loadCart()
    } catch (err) {
      console.error('更新购物车失败', err)
    }
  },

  // 减少数量 (同步云端)
  async decreaseQuantity(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    
    const db = wx.cloud.database()
    const cartItem = this.data.cart.find(c => c.menuId === item._id)

    if (!cartItem) return

    try {
      if (cartItem.quantity > 1) {
        await db.collection('carts').doc(cartItem._id).update({
          data: { quantity: db.command.inc(-1) }
        })
      } else {
        await db.collection('carts').doc(cartItem._id).remove()
      }
      this.loadCart()
    } catch (err) {
      console.error('更新购物车失败', err)
    }
  },

  calculateTotal(cartArray) {
    let total = 0
    let amount = 0
    cartArray.forEach(item => {
      total += item.quantity
      amount += item.price * item.quantity
    })

    this.setData({
      cart: cartArray,
      cartTotal: total,
      cartAmount: amount.toFixed(2)
    })
  },

  goToCart() {
    wx.switchTab({
      url: '/pages/user/cart/cart'
    })
  }
})
