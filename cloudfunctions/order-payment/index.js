const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

// 微信支付配置（需要根据实际情况填写）
const PAYMENT_CONFIG = {
  appId: 'your_appid',
  mchId: 'your_mchid',
  apiKey: 'your_api_key',
  notifyUrl: 'https://your-domain.com/payment/callback'
}

exports.main = async (event, context) => {
  const { orderId } = event

  try {
    // 获取订单信息
    const orderRes = await db.collection('orders').doc(orderId).get()
    const order = orderRes.data

    if (!order) {
      return {
        code: -1,
        message: '订单不存在'
      }
    }

    if (order.paymentStatus === 'paid') {
      return {
        code: -1,
        message: '订单已支付'
      }
    }

    // 获取支付参数
    const paymentParams = await getPaymentParams(order)

    return {
      code: 0,
      ...paymentParams
    }
  } catch (err) {
    console.error(err)
    return {
      code: -1,
      message: '获取支付参数失败',
      error: err.message
    }
  }
}

// 获取支付参数
async function getPaymentParams(order) {
  // 这里应该调用微信支付统一下单接口
  // 返回的参数用于前端调用 wx.requestPayment

  const timeStamp = Math.floor(Date.now() / 1000).toString()
  const nonceStr = generateNonceStr()
  const packageStr = `prepay_id=${order.paymentId || 'prepay_id_placeholder'}`
  const signType = 'MD5'
  const paySign = generatePaySign(timeStamp, nonceStr, packageStr, signType, order)

  return {
    timeStamp,
    nonceStr,
    package: packageStr,
    signType,
    paySign
  }
}

// 生成随机字符串
function generateNonceStr(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成支付签名
function generatePaySign(timeStamp, nonceStr, packageStr, signType, order) {
  // 这里应该根据微信支付规则生成签名
  // 实际项目中需要使用微信支付SDK或自己实现签名算法
  return 'sign_placeholder'
}
