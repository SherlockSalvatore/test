Page({
  data: {
    name: '',
    phone: '',
    detail: ''
  },

  onLoad() {
    const saved = wx.getStorageSync('default_address')
    if (saved) {
      this.setData({
        name: saved.name || '',
        phone: saved.phone || '',
        detail: saved.detail || ''
      })
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onDetailInput(e) { this.setData({ detail: e.detail.value }) },

  saveAddress() {
    const { name, phone, detail } = this.data
    if (!name || !phone || !detail) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    const address = { name, phone, detail }
    wx.setStorageSync('default_address', address)
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })

    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  }
})
