Page({
  data: {
    menuList: [],
    categories: ['热菜', '凉菜', '主食', '饮品'],
    showModal: false,
    editingId: null,
    formData: {
      name: '',
      category: '',
      price: '',
      description: '',
      image: '',
      available: true
    }
  },

  onLoad() {
    this.loadMenuList()
  },

  onShow() {
    this.loadMenuList()
  },

  // 加载菜单列表
  loadMenuList() {
    const db = wx.cloud.database()
    db.collection('menu')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({ menuList: res.data })
      })
      .catch(err => {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        console.error(err)
      })
  },

  // 显示添加弹窗
  showAddModal() {
    this.setData({
      showModal: true,
      editingId: null,
      formData: {
        name: '',
        category: '热菜',
        price: '',
        description: '',
        image: '',
        available: true
      }
    })
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({ showModal: false })
  },

  // 编辑菜品
  editItem(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.menuList.find(i => i._id === id)
    if (item) {
      this.setData({
        showModal: true,
        editingId: id,
        formData: {
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          image: item.image,
          available: item.available
        }
      })
    }
  },

  // 删除菜品
  deleteItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个菜品吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'menu/delete',
            data: { menuId: id }
          }).then(() => {
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadMenuList()
          }).catch(err => {
            wx.showToast({ title: '删除失败', icon: 'none' })
            console.error(err)
          })
        }
      }
    })
  },

  // 切换上架状态
  toggleStatus(e) {
    const id = e.currentTarget.dataset.id
    const status = e.currentTarget.dataset.status

    wx.cloud.callFunction({
      name: 'menu/update',
      data: {
        menuId: id,
        data: { available: !status }
      }
    }).then(() => {
      wx.showToast({ title: '操作成功', icon: 'success' })
      this.loadMenuList()
    }).catch(err => {
      wx.showToast({ title: '操作失败', icon: 'none' })
      console.error(err)
    })
  },

  // 表单输入
  onNameInput(e) {
    this.setData({ 'formData.name': e.detail.value })
  },

  onCategoryChange(e) {
    this.setData({ 'formData.category': this.data.categories[e.detail.value] })
  },

  onPriceInput(e) {
    this.setData({ 'formData.price': e.detail.value })
  },

  onDescInput(e) {
    this.setData({ 'formData.description': e.detail.value })
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFilePaths[0]
        this.uploadImage(filePath)
      }
    })
  },

  // 上传图片到云存储
  uploadImage(filePath) {
    wx.showLoading({ title: '上传中...' })

    const cloudPath = `menu/${Date.now()}.jpg`
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        this.setData({ 'formData.image': res.fileID })
        wx.hideLoading()
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
        console.error(err)
      }
    })
  },

  // 保存菜品
  saveItem() {
    const { editingId, formData } = this.data

    // 验证
    if (!formData.name) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }
    if (!formData.price) {
      wx.showToast({ title: '请输入价格', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    const data = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      description: formData.description,
      image: formData.image,
      available: formData.available
    }

    if (editingId) {
      // 更新
      wx.cloud.callFunction({
        name: 'menu/update',
        data: {
          menuId: editingId,
          data
        }
      }).then(() => {
        wx.hideLoading()
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.hideModal()
        this.loadMenuList()
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '保存失败', icon: 'none' })
        console.error(err)
      })
    } else {
      // 新增
      wx.cloud.callFunction({
        name: 'menu/update',
        data: { data }
      }).then(() => {
        wx.hideLoading()
        wx.showToast({ title: '添加成功', icon: 'success' })
        this.hideModal()
        this.loadMenuList()
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '添加失败', icon: 'none' })
        console.error(err)
      })
    }
  }
})
