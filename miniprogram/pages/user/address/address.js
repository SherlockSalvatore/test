const db = wx.cloud.database()

Page({
  data: {
    addressList: [],
    showForm: false, // 切换列表页与编辑页
    editingId: null, // 当前正在编辑的地址ID，为null则为新增
    
    // 表单数据
    name: '',
    phone: '',
    detail: '',
    isDefault: false,
    
    isSelectMode: false // 是否为从结算页进入的选择模式
  },

  onLoad(options) {
    if (options.mode === 'select') {
      this.setData({ isSelectMode: true })
    }
    this.loadAddressList()
  },

  // 加载地址列表
  async loadAddressList() {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await db.collection('addresses').orderBy('isDefault', 'desc').get()
      this.setData({ addressList: res.data })
    } catch (err) {
      console.error('加载地址失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 切换到新增表单
  goToAdd() {
    this.setData({
      showForm: true,
      editingId: null,
      name: '',
      phone: '',
      detail: '',
      isDefault: false
    })
  },

  // 进入编辑模式
  goToEdit(e) {
    const id = e.currentTarget.dataset.id
    const addr = this.data.addressList.find(item => item._id === id)
    if (addr) {
      this.setData({
        showForm: true,
        editingId: id,
        name: addr.name,
        phone: addr.phone,
        detail: addr.detail,
        isDefault: addr.isDefault
      })
    }
  },

  // 取消编辑
  cancelEdit() {
    this.setData({ showForm: false })
  },

  // 输入绑定
  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onDetailInput(e) { this.setData({ detail: e.detail.value }) },
  onDefaultChange(e) { this.setData({ isDefault: e.detail.value }) },

  // 保存地址 (新增或修改)
  async saveAddress() {
    const { name, phone, detail, isDefault, editingId } = this.data
    if (!name || !phone || !detail) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中' })
    try {
      // 如果设置为默认地址，先取消其他地址的默认状态
      if (isDefault) {
        await wx.cloud.callFunction({
          name: 'address-manager',
          data: { action: 'clearDefault' }
        })
      }

      const data = { name, phone, detail, isDefault, updateTime: db.serverDate() }

      if (editingId) {
        await db.collection('addresses').doc(editingId).update({ data })
      } else {
        await db.collection('addresses').add({ data })
      }

      wx.showToast({ title: '保存成功' })
      this.setData({ showForm: false })
      this.loadAddressList()
    } catch (err) {
      console.error('保存失败', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 删除地址
  async deleteAddress() {
    const { editingId } = this.data
    if (!editingId) return

    const res = await wx.showModal({
      title: '提示',
      content: '确定要删除该地址吗？',
      confirmColor: '#ef4444'
    })

    if (res.confirm) {
      wx.showLoading({ title: '删除中' })
      try {
        await db.collection('addresses').doc(editingId).remove()
        wx.showToast({ title: '删除成功' })
        this.setData({ showForm: false })
        this.loadAddressList()
      } catch (err) {
        wx.showToast({ title: '删除失败', icon: 'none' })
      } finally {
        wx.hideLoading()
      }
    }
  },

  // 选择地址并返回 (仅选择模式)
  selectAddress(e) {
    if (!this.data.isSelectMode) return
    const id = e.currentTarget.dataset.id
    const addr = this.data.addressList.find(item => item._id === id)
    
    // 使用事件通道回传数据
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('acceptAddress', addr)
    wx.navigateBack()
  }
})
