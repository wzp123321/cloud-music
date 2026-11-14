const createOption = require('../util/option.js')
module.exports = async (query, request) => {
  const data = {
    key: query.key,
    type: 3,
  }
  try {
    const result = await request(
      `/api/login/qrcode/client/login`,
      data,
      createOption(query),
    )
    return {
      status: 200,
      body: {
        ...result.body,
        cookie: result.cookie.join(';'),
      },
      cookie: result.cookie,
    }
  } catch (error) {
    // request 异常（key 失效/过期/网络抖动）：返回明确业务失败态而非冒泡成 HTTP 404。
    // 否则 server.js 顶层 catch 会以 body 为空返回 404，前端轮询静默忽略 → 登录卡死无提示。
    return {
      status: 200,
      body: { code: 800, message: '二维码不存在或已过期' },
      cookie: [],
    }
  }
}
