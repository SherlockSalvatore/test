const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { menuId } = event

  try {
    await db.collection('menu').doc(menuId).remove()

    return {
      code: 0,
      message: '菜品删除成功'
    }
  } catch (err) {
    console.error(err)
    return {
      code: -1,
      message: '菜品删除失败',
      error: err.message
    }
  }
}
