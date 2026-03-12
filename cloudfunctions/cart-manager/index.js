const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_TYPE_CAUTION })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (event.action === 'checkAll') {
    try {
      await db.collection('carts').where({
        _openid: openid
      }).update({
        data: { checked: event.checked }
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: err }
    }
  }

  if (event.action === 'clearChecked') {
    try {
      await db.collection('carts').where({
        _openid: openid,
        checked: true
      }).remove()
      return { success: true }
    } catch (err) {
      return { success: false, error: err }
    }
  }
}
