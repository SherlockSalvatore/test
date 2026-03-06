Page({
  data: {
    todayStats: {
      orderCount: 0,
      totalAmount: 0,
      pending: 0,
      completed: 0
    },
    topItems: [],
    statusCount: {}
  },

  onLoad() {
    this.loadStats()
  },

  onShow() {
    this.loadStats()
  },

  // 加载统计数据
  loadStats() {
    const db = wx.cloud.database()
    const _ = db.command

    // 获取今天开始的时间
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 查询今日订单
    db.collection('orders')
      .where({
        createTime: _.gte(today)
      })
      .get()
      .then(res => {
        this.calculateStats(res.data)
      })
      .catch(err => {
        console.error('加载统计失败', err)
      })

    // 查询所有订单计算热销菜品
    db.collection('orders')
      .where({
        status: _.nin(['pending', 'cancelled'])
      })
      .get()
      .then(res => {
        this.calculateTopItems(res.data)
        this.calculateStatusCount(res.data)
      })
  },

  // 计算今日统计
  calculateStats(orders) {
    let orderCount = 0
    let totalAmount = 0
    let pending = 0
    let completed = 0

    orders.forEach(order => {
      orderCount++
      if (order.status !== 'cancelled') {
        totalAmount += order.totalAmount
      }
      if (order.status === 'pending') {
        pending++
      }
      if (order.status === 'completed') {
        completed++
      }
    })

    this.setData({
      todayStats: {
        orderCount,
        totalAmount: totalAmount.toFixed(2),
        pending,
        completed
      }
    })
  },

  // 计算热销菜品
  calculateTopItems(orders) {
    const itemCounts = {}

    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (!itemCounts[item.name]) {
            itemCounts[item.name] = { name: item.name, count: 0 }
          }
          itemCounts[item.name].count += item.quantity
        })
      }
    })

    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    this.setData({ topItems })
  },

  // 计算订单状态分布
  calculateStatusCount(orders) {
    const statusCount = {
      paid: 0,
      cooking: 0,
      delivering: 0,
      completed: 0,
      cancelled: 0
    }

    orders.forEach(order => {
      if (statusCount[order.status] !== undefined) {
        statusCount[order.status]++
      }
    })

    this.setData({ statusCount })
  }
})
