const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { orderId } = event

  try {
    // SECURITY CHECK: Ensure the order belongs to this user before marking paid
    const orderRecord = await db.collection('orders').doc(orderId).get()
    if (orderRecord.data._openid !== openid) {
      return { success: false, error: 'Unauthorized: Not your order' }
    }

    // MOCK PAYMENT: Instead of generating real WeChat Pay parameters,
    // we simply update the database status to 'paid' immediately.
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'paid',
        payTime: db.serverDate()
      }
    })

    // Return a mock success response so the frontend knows it's complete
    return {
      success: true,
      mockPayment: true,
      message: 'Payment simulated successfully'
    }

  } catch (err) {
    console.error('Failed mock payment', err)
    return {
      success: false,
      error: err.message || err
    }
  }
}
