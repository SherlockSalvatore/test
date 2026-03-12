const { getTempUrl } = require('../../utils/cloudImage')
const db = wx.cloud.database()

Page({
  data: {
    cartList: [],
    totalPrice: 0,
    checkAll: true,
    selectedCount: 0
  },

  onShow() {
    this.loadCart()
  },

  // 从云端加载购物车
  async loadCart() {
    wx.showLoading({ title: '同步中' })
    try {
      const res = await db.collection('carts').get()
      let list = res.data.map(item => ({
        ...item,
        image: typeof item.image === 'string' ? item.image.trim() : item.image
      }))

      // 批量获取临时 HTTPS 链接
      const fileList = list.map(it => it.image).filter(img => img && img.startsWith('cloud://'))
      if (fileList.length > 0) {
        const urls = await getTempUrl(fileList)
        const urlMap = {}
        fileList.forEach((fid, idx) => { urlMap[fid] = urls[idx] })
        list = list.map(it => ({
          ...it,
          image: urlMap[it.image] || it.image
        }))
      }

      this.setData({ cartList: list })
      this.calculateTotal()
    } catch (err) {
      console.error('加载购物车失败', err)
    } finally {
      wx.hideLoading()
    }
  },

  // 切换选中状态
  async toggleCheck(e) {
    const { id, checked } = e.currentTarget.dataset
    const newStatus = !checked
    
    try {
      await db.collection('carts').doc(id).update({
        data: { checked: newStatus }
      })
      this.loadCart()
    } catch (err) {
      console.error('切换选中失败', err)
    }
  },

  // 全选/反选
  async toggleCheckAll() {
    const newStatus = !this.data.checkAll
    wx.showLoading({ title: '处理中' })
    
    try {
      await wx.cloud.callFunction({
        name: 'cart-manager',
        data: { action: 'checkAll', checked: newStatus }
      })
      this.loadCart()
    } catch (err) {
      console.error('全选操作失败', err)
    } finally {
      wx.hideLoading()
    }
  },

  // 增加数量
  async increase(e) {
    const { id, menuid } = e.currentTarget.dataset
    wx.showLoading({ title: '处理中' })
    try {
      await wx.cloud.callFunction({
        name: 'cart-manager',
        data: {
          action: 'updateQuantity',
          menuId: menuid,
          delta: 1
        }
      })
      this.loadCart()
    } catch (err) {
      console.error('更新失败', err)
    } finally {
      wx.hideLoading()
    }
  },

  // 减少数量
  async decrease(e) {
    const { id, quantity, menuid } = e.currentTarget.dataset
    try {
      if (quantity > 1) {
        wx.showLoading({ title: '处理中' })
        await wx.cloud.callFunction({
          name: 'cart-manager',
          data: {
            action: 'updateQuantity',
            menuId: menuid,
            delta: -1
          }
        })
      } else {
        const res = await wx.showModal({
          title: '提示',
          content: '确定要从购物车移除吗？'
        })
        if (res.confirm) {
          wx.showLoading({ title: '处理中' })
          await db.collection('carts').doc(id).remove()
        } else {
          return
        }
      }
      this.loadCart()
    } catch (err) {
      console.error('更新失败', err)
    } finally {
      wx.hideLoading()
    }
  },

  // 计算选中的总价和数量
  calculateTotal() {
    let total = 0
    let count = 0
    let allChecked = this.data.cartList.length > 0

    this.data.cartList.forEach(item => {
      if (item.checked) {
        total += item.price * item.quantity
        count++
      } else {
        allChecked = false
      }
    })

    this.setData({
      totalPrice: total.toFixed(2),
      selectedCount: count,
      checkAll: allChecked
    })
  },

  // 跳转到确认订单详情页 (结算页)
  goToCheckout() {
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请先勾选商品', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/user/checkout/checkout'
    })
  },

  // 首页挑选
  goToHome() {
    wx.switchTab({ url: '/pages/user/index/index' })
  }
})
