Page({
  data: {
    categories: ['全部', '热菜', '凉菜', '主食', '饮品'],
    currentCategory: '全部',
    menuList: [],
    cart: {},
    cartTotal: 0,
    cartAmount: 0
  },

  onLoad() {
    this.loadMenu()
  },

  onShow() {
    this.loadMenu()
  },

  loadMenu() {
    const db = wx.cloud.database()
    const collection = db.collection('menu')

    if (this.data.currentCategory === '全部') {
      collection.where({ available: true }).get().then(res => {
        this.setData({ menuList: res.data })
      })
    } else {
      collection.where({
        category: this.data.currentCategory,
        available: true
      }).get().then(res => {
        this.setData({ menuList: res.data })
      })
    }
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ currentCategory: category }, () => {
      this.loadMenu()
    })
  },

  getQuantity(id) {
    return this.data.cart[id] || 0
  },

  increaseQuantity(e) {
    const id = e.currentTarget.dataset.id
    const cart = { ...this.data.cart }
    cart[id] = (cart[id] || 0) + 1
    this.updateCart(cart)
  },

  decreaseQuantity(e) {
    const id = e.currentTarget.dataset.id
    const cart = { ...this.data.cart }
    if (cart[id] > 0) {
      cart[id]--
      if (cart[id] === 0) {
        delete cart[id]
      }
      this.updateCart(cart)
    }
  },

  updateCart(cart) {
    let total = 0
    let amount = 0

    this.data.menuList.forEach(item => {
      const qty = cart[item._id] || 0
      if (qty > 0) {
        total += qty
        amount += item.price * qty
      }
    })

    this.setData({ cart, cartTotal: total, cartAmount: amount.toFixed(2) })

    const app = getApp()
    app.globalData.cart = cart
  },

  goToCart() {
    wx.navigateTo({
      url: '/pages/user/cart/cart'
    })
  }
})
