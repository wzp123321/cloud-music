// 歌曲链接 - 302 跳转版
// 优先取客户端下载链接，取不到再回退到播放链接，最终以 302 重定向到音频地址
// level 取值同 /song/url/v1

const songDownloadUrlV1 = require('./song_download_url_v1.js')
const songUrlV1 = require('./song_url_v1.js')

const redirect = (response, url) => ({
  status: 302,
  body: '',
  cookie: response.cookie || [],
  redirectUrl: url,
})

module.exports = async (query, request) => {
  const response = await songDownloadUrlV1(query, request)
  const url = response?.body?.data?.url || response?.body?.data?.[0]?.url
  if (url) return redirect(response, url)

  const fallback = await songUrlV1(query, request)
  const fallbackUrl = fallback?.body?.data?.[0]?.url
  return fallbackUrl ? redirect(fallback, fallbackUrl) : fallback
}
