const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // Extract order details from the client request
  const { items, address, totalAmount, deliveryFee } = event

  // Generate a unique order number based on timestamp and random string
  const outTradeNo = 'ORD' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  try {
    // Insert order into the database
    const res = await db.collection('orders').add({
      data: {
        _openid: openid,     // The creator's WeChat OpenID
        outTradeNo,          // Order identifier
        items,               // Array of cart items {menuId, name, price, quantity, image}
        address,             // Delivery address {name, phone, detail}
        totalAmount,         // Total price including delivery
        deliveryFee,         // Delivery fee
        status: 'pending',   // Initial status: 'pending' (awaiting payment)
        createTime: db.serverDate() // Server timestamp
      }
    })

    return {
      success: true,
      orderId: res._id,
      outTradeNo
    }
  } catch (err) {
    console.error('Failed to create order', err)
    return {
      success: false,
      error: err.message || err
    }
  }
}
