const { getTempUrl } = require('../../../utils/cloudImage')

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

    collection.where(query).get().then(async res => {
      const cart = this.data.cart || []
      let menuList = res.data.map(item => {
        return {
          ...item,
          // 预清洗：去除可能存在的空格
          image: typeof item.image === 'string' ? item.image.trim() : item.image,
          quantity: 0 // 初始值，由 calculateTotal 同步
        }
      })

      // 批量转换云端 ID 为 https 链接
      const fileList = menuList.map(it => it.image).filter(img => img && img.startsWith('cloud://'))
      if (fileList.length > 0) {
        const urls = await getTempUrl(fileList)
        // 建立映射
        const urlMap = {}
        fileList.forEach((fid, idx) => { urlMap[fid] = urls[idx] })
        menuList = menuList.map(item => ({
          ...item,
          image: urlMap[item.image] || item.image
        }))
      }

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

  // 增加数量 (改用云函数原子加)
  async increaseQuantity(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    
    wx.showLoading({ title: '处理中', mask: true })
    try {
      await wx.cloud.callFunction({
        name: 'cart-manager',
        data: {
          action: 'updateQuantity',
          menuId: item._id,
          delta: 1,
          itemData: {
            name: item.name,
            price: item.price,
            image: item.image
          }
        }
      })
      this.loadCart()
    } catch (err) {
      console.error('更新购物车失败', err)
    } finally {
      wx.hideLoading()
    }
  },

  // 减少数量 (改用云函数原子减)
  async decreaseQuantity(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    
    wx.showLoading({ title: '处理中', mask: true })
    try {
      await wx.cloud.callFunction({
        name: 'cart-manager',
        data: {
          action: 'updateQuantity',
          menuId: item._id,
          delta: -1
        }
      })
      this.loadCart()
    } catch (err) {
      console.error('更新购物车失败', err)
    } finally {
      wx.hideLoading()
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
