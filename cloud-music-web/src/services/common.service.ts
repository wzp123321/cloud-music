import { postRequest } from './request';

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
   * @returns
   */
  public async getMvDetailById(mvid: number) {
    const res = await postRequest(EPath.查询MV详情, { mvid });
    return res?.data;
  }
  /**
   * 根据id查询mv详情
   * @param id
   * @returns
   */
  public async getMvUrlById(id: number) {
    const res = await postRequest(EPath.查询mv播放地址, { id });
    return res?.data;
  }
  /**
   * 查询mv评论
   * @param id
   * @returns
   */
  public async getMvCommentList(id: number) {
    const res = await postRequest(EPath.获取MV评论, { id });
    return res;
  }

  /**
   * 查询歌单评论
   * @param id
   * @returns
   */
  public async getPlayListCommentList(id: number) {
    const res = await postRequest(EPath.获取歌单评论, { id });
    return res;
  }

  /**
   * 根据id获取歌曲详情
   * @param ids
   * @returns
   */
  public async getMusicDetailByIds(ids: string) {
    const res = await postRequest(EPath.获取歌曲详情可批量, { ids });
    return res;
  }
}

export default CommonService;
