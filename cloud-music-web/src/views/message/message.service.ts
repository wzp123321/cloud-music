import { getRequest } from '@/apis/request';

/**
 * P1 4.x 消息私信与分享（social-message）接口封装。
 *
 * URL 规则：module 文件名下划线转斜杠，完整清单见 api-inventory-plain.md「P1 消息私信与分享」。
 * 本批接口一律走 getRequest（与 content-enhance.service.ts 一致，写操作同样用 GET），
 * 仅 playlist_cover_update 一类的上传接口才用 postFormRequest。
 *
 * 参数来源（design.md 编码硬约束）：
 * - msg_private_history 的 uid ← msg_private / msg_recentcontact 返回的用户，或页面输入
 * - send_* / share_resource 的 user_ids、id ← 联系人点选或页面输入
 * - hug_comment 的 cid ← msg_comments 返回的评论 commentId，或页面输入
 */

type Params = Record<string, any>;

const messageService = {
  //#region 4.1 消息中心（需登录只读）
  /** 评论 */
  getMsgComments: (params: Params = {}): Promise<any> => getRequest('/msg/comments', params),
  /** @我 / 转发 */
  getMsgForwards: (params: Params = {}): Promise<any> => getRequest('/msg/forwards', params),
  /** 通知 */
  getMsgNotices: (params: Params = {}): Promise<any> => getRequest('/msg/notices', params),
  /** 私信 */
  getMsgPrivate: (params: Params = {}): Promise<any> => getRequest('/msg/private', params),
  /** 私信历史：uid ← 私信 / 最近联系人 */
  getMsgPrivateHistory: (params: Params = {}): Promise<any> => getRequest('/msg/private/history', params),
  /** 最近联系人 */
  getMsgRecentcontact: (params: Params = {}): Promise<any> => getRequest('/msg/recentcontact', params),
  //#endregion

  //#region 4.2 分享与私信发送（写操作）
  /** 发送文本私信 */
  sendText: (params: Params): Promise<any> => getRequest('/send/text', params),
  /** 发送歌曲 */
  sendSong: (params: Params): Promise<any> => getRequest('/send/song', params),
  /** 发送歌单 */
  sendPlaylist: (params: Params): Promise<any> => getRequest('/send/playlist', params),
  /** 发送专辑 */
  sendAlbum: (params: Params): Promise<any> => getRequest('/send/album', params),
  /** 分享资源 */
  shareResource: (params: Params): Promise<any> => getRequest('/share/resource', params),
  //#endregion

  //#region 4.3 评论补充（写操作）
  /** 通用发评论 */
  comment: (params: Params): Promise<any> => getRequest('/comment', params),
  /** 评论抱抱 */
  hugComment: (params: Params): Promise<any> => getRequest('/hug/comment', params),
  //#endregion
};

export default messageService;
