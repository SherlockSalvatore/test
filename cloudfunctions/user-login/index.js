// 云函数入口文件
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

// 初始化 cloud
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV // API 调用都保持和云函数当前所在环境一致
})

const db = cloud.database()
const _ = db.command

// 生成简单的 Token (32位十六进制字符串)
function generateToken() {
    return crypto.randomBytes(16).toString('hex')
}

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    const openId = wxContext.OPENID

    // 对于简单的 wx.login 重构，其实 openId 是主要标识
    // `event.code` 如果有传，本可以用于 code2Session()，但在云函数环境下
    // 微信直接替我们解析出了 OPENID，因此可以直接信任 wxContext.OPENID

    if (!openId) {
        return {
            success: false,
            errMsg: '无法获取有效的 OpenID'
        }
    }

    try {
        // 1. 查找是否已经存在该用户
        const userRes = await db.collection('users').where({
            openid: openId
        }).get()

        let userRecord = null;
        let isNewUser = true;

        if (userRes.data && userRes.data.length > 0) {
            // 老用户
            userRecord = userRes.data[0]
            isNewUser = false
        }

        // 2. 生成新的会话 Token
        const newToken = generateToken()
        const now = db.serverDate() // 或者 new Date()

        if (isNewUser) {
            // 3a. 创建新用户记录
            const defaultRole = 'user'
            await db.collection('users').add({
                data: {
                    openid: openId,
                    role: defaultRole,
                    token: newToken,
                    createdAt: now,
                    updatedAt: now
                }
            })

            return {
                success: true,
                token: newToken,
                role: defaultRole,
                isNewUser: true
            }
        } else {
            // 3b. 更新老用户记录中的 Token
            await db.collection('users').doc(userRecord._id).update({
                data: {
                    token: newToken,
                    updatedAt: now
                }
            })

            return {
                success: true,
                token: newToken,
                role: userRecord.role || 'user',
                isNewUser: false
            }
        }

    } catch (error) {
        console.error('登录处理异常:', error)
        return {
            success: false,
            errMsg: error.message || '内部服务器错误'
        }
    }
}
