const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { items, address, totalAmount, deliveryFee } = event
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  // 获取用户信息
  const userInfo = await db.collection('users').doc(OPENID).get()
  const userName = userInfo.data?.nickName || '匿名用户'
  const phone = userInfo.data?.phone || ''

  try {
    // 创建订单
    const orderData = {
      userId: OPENID,
      userName,
      phone,
      address: address.detail,
      items,
      totalAmount,
      deliveryFee,
      status: 'pending',
      paymentStatus: 'unpaid',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    const result = await db.collection('orders').add({
      data: orderData
    })

    return {
      code: 0,
      message: '订单创建成功',
      orderId: result._id
    }
  } catch (err) {
    console.error(err)
    return {
      code: -1,
      message: '订单创建失败',
      error: err.message
    }
  }
}
