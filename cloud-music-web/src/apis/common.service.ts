import { postRequest } from './request';
import type { ApiEnvelope } from './types';
import type { CS_ICommentListRes, CS_IMvDetail, CS_IMvUrl, CS_ISongDetailRes } from './common.models';

enum EPath {
  查询MV详情 = '/mv/detail',
  查询mv播放地址 = '/mv/url',
  获取MV评论 = '/comment/mv',

  获取歌单评论 = '/comment/playlist',

  获取歌曲详情可批量 = 'song/detail',
}

class CommonService {
  /**
   * 根据id查询mv详情
   * @param mvid
   * @returns MV 详情；上游无 data 时返回 undefined
   */
  public async getMvDetailById(mvid: number): Promise<CS_IMvDetail | undefined> {
    const res = await postRequest<ApiEnvelope<CS_IMvDetail>>(EPath.查询MV详情, { mvid });
    return res?.data;
  }
  /**
   * 根据id查询mv播放地址
   * @param id
   * @returns 播放地址信息；上游无 data 时返回 undefined
   */
  public async getMvUrlById(id: number): Promise<CS_IMvUrl | undefined> {
    const res = await postRequest<ApiEnvelope<CS_IMvUrl>>(EPath.查询mv播放地址, { id });
    return res?.data;
  }
  /**
   * 查询mv评论
   * @param id
   * @returns 扁平评论列表（code / comments / hotComments）
   */
  public async getMvCommentList(id: number): Promise<CS_ICommentListRes> {
    return await postRequest<CS_ICommentListRes>(EPath.获取MV评论, { id });
  }

  /**
   * 查询歌单评论
   * @param id
   * @returns 扁平评论列表（code / comments / hotComments）
   */
  public async getPlayListCommentList(id: number): Promise<CS_ICommentListRes> {
    return await postRequest<CS_ICommentListRes>(EPath.获取歌单评论, { id });
  }

  /**
   * 根据id获取歌曲详情
   * @param ids 逗号分隔的歌曲 id
   * @returns 歌曲详情批量结果
   */
  public async getMusicDetailByIds(ids: string): Promise<CS_ISongDetailRes> {
    return await postRequest<CS_ISongDetailRes>(EPath.获取歌曲详情可批量, { ids });
  }
}

export default CommonService;
