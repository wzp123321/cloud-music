import {
  LoadPlayListParams,
  BannerRes,
  PlayListRes,
  HotSingerRes,
  NewDVDParams,
  HomepageBlockPageRes,
  DragonBallRes,
  PersonalizedRes,
  PersonalizedNewSongRes,
  PersonalizedDjRes,
  PersonalizedMvRes,
  PersonalizedPrivateRes,
  RecommendResourceRes,
  RecommendSongsRes,
  RecommendDislikeRes,
  ToplistRes,
  TopListRes,
  TopPlaylistHighqualityRes,
  TopSongRes,
  TopMvRes,
} from './portal-api';
import { postRequest, getRequest } from '@/apis/request';

const portalService = {
  /**
   * 查询首页banner
   * @param params
   */
  async getBannerList(params: { type: number } = { type: 0 }): Promise<BannerRes> {
    const url = '/banner';
    const res: BannerRes = await postRequest(url, params);
    return res;
  },
  /**
   * 查询不同类型歌单
   * @param params
   * @returns
   */
  async getPlayListByType(params: LoadPlayListParams): Promise<PlayListRes> {
    const url = '/top/playlist';
    const res: PlayListRes = await getRequest(url, params);
    return res;
  },
  /**
   * 查询热门歌手
   * @param params
   * @returns
   */
  async getHotSingerList(params: { limit: number }): Promise<HotSingerRes> {
    const url = '/top/artists';
    const res: HotSingerRes = await postRequest(url, params);
    return res;
  },
  /**
   * 查询新碟列表
   * @param params
   * @returns
   */
  getNewDVDList: async (params: NewDVDParams) => {
    const url = '/top/album';
    const res = await postRequest(url, params);
    return res;
  },
  /**
   * 查询排行榜详情
   * @param params
   * @returns
   */
  getRankDetailById: async (params: { id: number }) => {
    const url = '/playlist/detail';
    const res = await postRequest(url, params);
    return res;
  },

  //#region 首页区块瀑布流 / 金刚区
  /**
   * 首页区块瀑布流
   * @param params refresh 是否刷新、cursor 翻页游标
   */
  async getHomepageBlockPage(params: { refresh?: boolean; cursor?: string } = {}): Promise<HomepageBlockPageRes> {
    const url = '/homepage/block/page';
    const res: HomepageBlockPageRes = await postRequest(url, {
      refresh: params.refresh || false,
      cursor: params.cursor || '',
    });
    return res;
  },
  /**
   * 首页金刚区入口（需登录/游客登录，否则返回空）
   */
  async getHomepageDragonBall(): Promise<DragonBallRes> {
    const url = '/homepage/dragon/ball';
    const res: DragonBallRes = await postRequest(url, {});
    return res;
  },
  //#endregion

  //#region 个性化推荐
  /**
   * 推荐歌单
   * @param params limit 数量
   */
  async getPersonalized(params: { limit?: number } = {}): Promise<PersonalizedRes> {
    const url = '/personalized';
    const res: PersonalizedRes = await postRequest(url, { limit: params.limit || 30 });
    return res;
  },
  /**
   * 推荐新歌
   * @param params limit 数量、areaId 地区
   */
  async getPersonalizedNewSong(params: { limit?: number; areaId?: number } = {}): Promise<PersonalizedNewSongRes> {
    const url = '/personalized/newsong';
    const res: PersonalizedNewSongRes = await postRequest(url, {
      limit: params.limit || 10,
      areaId: params.areaId || 0,
    });
    return res;
  },
  /**
   * 推荐电台（播客）
   */
  async getPersonalizedDjProgram(): Promise<PersonalizedDjRes> {
    const url = '/personalized/djprogram';
    const res: PersonalizedDjRes = await postRequest(url, {});
    return res;
  },
  /**
   * 推荐 MV
   */
  async getPersonalizedMv(): Promise<PersonalizedMvRes> {
    const url = '/personalized/mv';
    const res: PersonalizedMvRes = await postRequest(url, {});
    return res;
  },
  /**
   * 独家放送
   */
  async getPersonalizedPrivatecontent(): Promise<PersonalizedPrivateRes> {
    const url = '/personalized/privatecontent';
    const res: PersonalizedPrivateRes = await postRequest(url, {});
    return res;
  },
  //#endregion

  //#region 每日推荐
  /**
   * 每日推荐歌单
   */
  async getRecommendResource(): Promise<RecommendResourceRes> {
    const url = '/recommend/resource';
    const res: RecommendResourceRes = await postRequest(url, {});
    return res;
  },
  /**
   * 每日推荐歌曲
   */
  async getRecommendSongs(): Promise<RecommendSongsRes> {
    const url = '/recommend/songs';
    const res: RecommendSongsRes = await postRequest(url, {});
    return res;
  },
  /**
   * 每日推荐歌曲-不感兴趣
   * @param params id 歌曲 id
   */
  async dislikeRecommendSong(params: { id: number }): Promise<RecommendDislikeRes> {
    const url = '/recommend/songs/dislike';
    const res: RecommendDislikeRes = await postRequest(url, { id: params.id });
    return res;
  },
  //#endregion

  //#region 排行榜
  /**
   * 所有榜单列表
   */
  async getToplist(): Promise<ToplistRes> {
    const url = '/toplist';
    const res: ToplistRes = await postRequest(url, {});
    return res;
  },
  /**
   * 单个榜单详情（按 id）
   * 【上游已失效】/top/list 实测 404。本方法原被榜单页主流程自动调用
   * （usePortal.queryToplist 成功后自动触发 queryRankDetail → getTopList；首页首屏并不调用），
   * 为避免自动请求 404 与错误提示刷屏，这里显式失效降级为
   * 空结果、不再发出请求；方法保留供手动核验上游状态，需核验时恢复下方被注释的请求行即可。
   * @param _params id 榜单 id（降级后暂不使用，保留仅为维持调用签名）
   */
  async getTopList(_params: { id: number }): Promise<TopListRes> {
    // 上游异常，降级为空结果（TopListRes 字段均为可选；榜单页 rankTrackList 回落为 []，
    // rank.vue 已有「暂无榜单歌曲」空态占位，不会白屏）
    // const url = '/top/list';
    // const res: TopListRes = await postRequest(url, { id: _params.id });
    // return res;
    return {};
  },
  /**
   * 精品歌单
   * @param params cat 分类、limit 数量、before 翻页时间戳
   */
  async getTopPlaylistHighquality(params: { cat?: string; limit?: number; before?: number } = {}): Promise<TopPlaylistHighqualityRes> {
    const url = '/top/playlist/highquality';
    const res: TopPlaylistHighqualityRes = await postRequest(url, {
      cat: params.cat || '全部',
      limit: params.limit || 30,
      before: params.before || 0,
    });
    return res;
  },
  /**
   * 新歌速递
   * @param params type 地区(0全部/7华语/96欧美/8日本/16韩国)
   */
  async getTopSong(params: { type?: number } = {}): Promise<TopSongRes> {
    const url = '/top/song';
    const res: TopSongRes = await postRequest(url, { type: params.type || 0 });
    return res;
  },
  /**
   * MV 排行榜
   * @param params area 地区、limit 数量、offset 偏移
   */
  async getTopMv(params: { area?: string; limit?: number; offset?: number } = {}): Promise<TopMvRes> {
    const url = '/top/mv';
    const res: TopMvRes = await postRequest(url, {
      area: params.area || '',
      limit: params.limit || 30,
      offset: params.offset || 0,
    });
    return res;
  },
  //#endregion
};

export default portalService;
