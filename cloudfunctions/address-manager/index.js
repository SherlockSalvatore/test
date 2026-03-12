const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_TYPE_CAUTION })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (event.action === 'clearDefault') {
    // 将该用户所有其他地址的 isDefault 设为 false
    try {
      await db.collection('addresses').where({
        _openid: openid,
        isDefault: true
      }).update({
        data: { isDefault: false }
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: err }
    }
  }
}
