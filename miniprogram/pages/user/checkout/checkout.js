const { getTempUrl } = require('../../utils/cloudImage')
const db = wx.cloud.database()
const DELIVERY_FEE = 5 // 默认配送费

Page({
  data: {
    selectedItems: [],
    address: null,
    subtotal: 0,
    deliveryFee: DELIVERY_FEE,
    totalPrice: 0
  },

  onLoad() {
    this.loadCheckoutData()
    this.loadDefaultAddress()
  },

  // 获取勾选的商品
  async loadCheckoutData() {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await db.collection('carts').where({
        checked: true
      }).get()
      
      let subtotal = 0
      let items = res.data.map(item => {
        subtotal += item.price * item.quantity
        return {
          ...item,
          image: typeof item.image === 'string' ? item.image.trim() : item.image
        }
      })

      // 批量获取临时 HTTPS 链接
      const fileList = items.map(it => it.image).filter(img => img && img.startsWith('cloud://'))
      if (fileList.length > 0) {
        const urls = await getTempUrl(fileList)
        const urlMap = {}
        fileList.forEach((fid, idx) => { urlMap[fid] = urls[idx] })
        items = items.map(it => ({
          ...it,
          image: urlMap[it.image] || it.image
        }))
      }

      this.setData({
        selectedItems: items,
        subtotal: subtotal.toFixed(2),
        totalPrice: (subtotal + DELIVERY_FEE).toFixed(2)
      })
    } catch (err) {
      console.error('加载结算数据失败', err)
    } finally {
      wx.hideLoading()
    }
  },

  // 加载默认地址
  async loadDefaultAddress() {
    try {
      const res = await db.collection('addresses').where({
        isDefault: true
      }).limit(1).get()

      if (res.data.length > 0) {
        this.setData({ address: res.data[0] })
      }
    } catch (err) {
      console.error('获取默认地址失败', err)
    }
  },

  // 去选择地址
  goToSelectAddress() {
    wx.navigateTo({
      url: '/pages/user/address/address?mode=select',
      events: {
        // 监听来自地址页的选择回调
        acceptAddress: (addr) => {
          this.setData({ address: addr })
        }
      }
    })
  },

  // 提交订单
  async submitOrder() {
    const { selectedItems, address, totalPrice, deliveryFee } = this.data

    if (!address) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }

    wx.showLoading({ title: '创建订单中' })
    try {
      // 1. 调用云函数创建订单
      const res = await wx.cloud.callFunction({
        name: 'order-create',
        data: {
          items: selectedItems,
          address,
          totalAmount: parseFloat(totalPrice),
          deliveryFee
        }
      })

      const { orderId } = res.result
      
      // 2. 核心改进：只要订单创建成功，立即清理购物车中选中的商品项
      await this.clearPaidCartItems()
      
      // 3. 进入支付流程
      this.handlePayment(orderId)
      
    } catch (err) {
      console.error('提交订单失败', err)
      wx.showToast({ title: '提交失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 模拟/微信支付
  async handlePayment(orderId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'order-payment',
        data: { orderId }
      })

      // 模拟支付成功
      if (res.result && res.result.mockPayment) {
        wx.showToast({ title: '支付成功', icon: 'success' })
        
        // 支付成功后清理购物车中已购买的项
        await this.clearPaidCartItems()

        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/user/orders/orders?status=paid'
          })
        }, 1500)
      } else {
        // 真实支付逻辑 (略，参考原 cart.js)
      }
    } catch (err) {
       wx.showToast({ title: '支付失败', icon: 'none' })
    }
  },

  // 清理购物车
  async clearPaidCartItems() {
    try {
      await wx.cloud.callFunction({
        name: 'cart-manager',
        data: { action: 'clearChecked' }
      })
    } catch (err) {
      console.error('清理购物车失败', err)
    }
  }
})
