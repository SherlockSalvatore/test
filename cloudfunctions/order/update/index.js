const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { orderId, status } = event
  const wxContext = cloud.getWXContext()

  try {
    const updateData = {
      status,
      updateTime: db.serverDate()
    }

    // 如果状态变为paid，更新支付状态
    if (status === 'paid') {
      updateData.paymentStatus = 'paid'
    }

    const result = await db.collection('orders').doc(orderId).update({
      data: updateData
    })

    return {
      code: 0,
      message: '订单状态更新成功'
    }
  } catch (err) {
    console.error(err)
    return {
      code: -1,
      message: '订单状态更新失败',
      error: err.message
    }
  }
}
