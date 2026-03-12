const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_TYPE_CAUTION })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 1. 更新数量 (增/删/加一/减一)，确保 menuId 唯一
  if (event.action === 'updateQuantity') {
    const { menuId, delta, itemData } = event
    
    // 查找该用户购物车中是否已有该商品
    const cartRes = await db.collection('carts').where({
      _openid: openid,
      menuId: menuId
    }).get()

    if (cartRes.data.length > 0) {
      const existingItem = cartRes.data[0]
      const newQuantity = existingItem.quantity + delta
      
      if (newQuantity <= 0) {
        // 数量减为0，物理删除（或合并重复项后的清理）
        await db.collection('carts').doc(existingItem._id).remove()
        // 如果有重复项，顺便把同 menuId 的其他项也清了（防御性）
        if (cartRes.data.length > 1) {
           await db.collection('carts').where({ _openid: openid, menuId: menuId }).remove()
        }
      } else {
        // 更新数量，并确保只有一个记录存在
        await db.collection('carts').doc(existingItem._id).update({
          data: { quantity: newQuantity }
        })
        // 额外清理：如果发现有重复的记录（旧数据残留），一并清理
        if (cartRes.data.length > 1) {
          const idsToRemove = cartRes.data.slice(1).map(it => it._id)
          await db.collection('carts').where({ _id: _.in(idsToRemove) }).remove()
        }
      }
    } else if (delta > 0) {
      // 新增商品
      await db.collection('carts').add({
        data: {
          ...itemData,
          _openid: openid,
          menuId: menuId,
          quantity: delta,
          checked: true,
          createTime: db.serverDate()
        }
      })
    }
    return { success: true }
  }

  // 2. 全选/取消全选
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

  // 3. 清理已结算项
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
