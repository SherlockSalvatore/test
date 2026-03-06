const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { menuId, data } = event
  const wxContext = cloud.getWXContext()

  try {
    if (menuId) {
      // 更新菜品
      const result = await db.collection('menu').doc(menuId).update({
        data: {
          ...data,
          updateTime: db.serverDate()
        }
      })

      return {
        code: 0,
        message: '菜品更新成功'
      }
    } else {
      // 新增菜品
      const result = await db.collection('menu').add({
        data: {
          ...data,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })

      return {
        code: 0,
        message: '菜品添加成功',
        menuId: result._id
      }
    }
  } catch (err) {
    console.error(err)
    return {
      code: -1,
      message: '操作失败',
      error: err.message
    }
  }
}
