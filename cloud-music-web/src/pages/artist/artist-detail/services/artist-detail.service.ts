/*
 * @Descrption: 歌手详情服务
 * @Author: wanzp
 * @Date: 2022-07-06 21:40:47
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-09-27 20:40:20
 */
import { FGetQueryParam } from '@/core/token';
import artistDetailService from './ad.service';

import { ArtistVO, AlbumVO, MvVO, DescRes } from './artist-detail-api';
import { Common_IMusic } from '@/services/common-api/common-api';
import { ref } from 'vue';
import contentEnhanceService, { hasLogin } from '@/services/content-enhance.service';
import {
  ArtistFollowCountRes,
  ContentSongItem,
  ContentVideoItem,
} from '@/services/content-enhance.api';

const navs = [
  {
    code: '0',
    name: '单曲',
  },
  {
    code: '1',
    name: '专辑',
  },
  {
    code: '2',
    name: 'MV',
  },
  {
    code: '3',
    name: '简介',
  },
  {
    code: '4',
    name: '视频',
  },
];

class ArtistDetail {
  //#region
  private _id = 0;
  private _artistVO?: ArtistVO;
  private _loading = ref<boolean>(false);
  private _is_error = ref<boolean>(false);
  private _songs = ref<Common_IMusic[]>([]);
  private _selectedCode = ref<string>(navs[0].code);
  private _albumList = ref<AlbumVO[]>([]);
  private _mvList = ref<MvVO[]>([]);
  private _itemLoading = ref<boolean>(false);
  private _desc = ref<DescRes>({
    briefDesc: '',
    code: 0,
    count: 0,
    introduction: [],
    topicData: [],
  });
  private _followCount = ref<ArtistFollowCountRes>({});
  private _fans = ref<{ userId?: number; nickname?: string; avatarUrl?: string }[]>([]);
  private _topSongs = ref<ContentSongItem[]>([]);
  private _allSongs = ref<ContentSongItem[]>([]);
  private _songSource = ref<'top' | 'all'>('top');
  private _songOrder = ref<'hot' | 'time'>('hot');
  private _videos = ref<ContentVideoItem[]>([]);
  private _subLoading = ref<boolean>(false);
  private _actionTip = ref<string>('');
  public readonly navs = navs;
  public readonly pageSize = 20;
  //#endregion
  //#region
  public get id(): number {
    return this._id;
  }
  public get artistVO(): ArtistVO {
    return this._artistVO as ArtistVO;
  }
  public get songs(): Common_IMusic[] {
    return this._songs.value;
  }
  public get loading(): boolean {
    return this._loading.value;
  }
  public get is_error(): boolean {
    return this._is_error.value;
  }
  public get selectedCode(): string {
    return this._selectedCode.value;
  }
  public set selectedCode(value: string) {
    this._selectedCode.value = value;
  }
  public get albumList(): AlbumVO[] {
    return this._albumList.value;
  }
  public get mvList(): MvVO[] {
    return this._mvList.value;
  }
  public get itemLoading(): boolean {
    return this._itemLoading.value;
  }
  public get desc(): DescRes {
    return this._desc.value;
  }
  public get followCount(): ArtistFollowCountRes {
    return this._followCount.value;
  }
  public get fans(): { userId?: number; nickname?: string; avatarUrl?: string }[] {
    return this._fans.value;
  }
  public get topSongs(): ContentSongItem[] {
    return this._topSongs.value;
  }
  public get allSongs(): ContentSongItem[] {
    return this._allSongs.value;
  }
  public get songSource(): 'top' | 'all' {
    return this._songSource.value;
  }
  public get songOrder(): 'hot' | 'time' {
    return this._songOrder.value;
  }
  public get videos(): ContentVideoItem[] {
    return this._videos.value;
  }
  public get subLoading(): boolean {
    return this._subLoading.value;
  }
  public get actionTip(): string {
    return this._actionTip.value;
  }
  //#endregion
  //#region
  async init() {
    this._id = Number(FGetQueryParam('id'));
    this._loading.value = true;
    this._is_error.value = false;
    try {
      const res = await artistDetailService.getArtistDetail({
        id: this._id,
      });
      if (res) {
        this._artistVO = res;
        this._songs.value = res?.hotSongs?.map((item) => {
          return {
            dt: item?.dt,
            url: '',
            name: item?.name,
            alName: item?.al?.name ?? '',
            artist: item?.ar?.[0]?.name,
            picUrl: item?.al?.picUrl,
            id: item?.id,
          };
        });
      }
    } catch (error) {
      this._is_error.value = true;
    } finally {
      this._loading.value = false;
    }
    // 歌手增强：粉丝数、粉丝列表、热门 50 首（参数 id ← /artist_detail?id=，上游为歌手列表）
    this.queryFollowCount();
    this.queryFans();
    this.queryTopSongs();
  }
  //#endregion
  //#region
  handleNavChange = () => {
    switch (this._selectedCode.value) {
      case '1':
        this.queryArtistAlbum();
        break;
      case '2':
        this.queryArtistMV();
        break;
      case '3':
        this.queryArtistDesc();
        break;
      case '4':
        this.queryVideos();
        break;
    }
  };
  //#endregion
  //#region
  async queryArtistAlbum() {
    if (this._albumList.value?.length) {
      return;
    }
    this._is_error.value = false;
    this._itemLoading.value = true;
    try {
      const res = await artistDetailService.getArtistAlbumList({
        id: this._id,
      });
      if (res?.hotAlbums?.length) {
        this._albumList.value = res?.hotAlbums;
      } else {
        this._albumList.value = [];
      }
    } catch (error) {
      this._albumList.value = [];
      this._is_error.value = true;
    } finally {
      setTimeout(() => {
        this._itemLoading.value = false;
      }, 300);
    }
  }
  //#endregion
  //#region
  async queryArtistMV() {
    if (this._mvList.value?.length) {
      return;
    }
    this._is_error.value = false;
    this._itemLoading.value = true;
    try {
      const res = await artistDetailService.getArtistMVList({
        id: this._id,
      });
      console.log(res);
      if (res?.mvs?.length) {
        this._mvList.value = res?.mvs;
      } else {
        this._mvList.value = [];
      }
    } catch (error) {
      this._mvList.value = [];
      this._is_error.value = true;
    } finally {
      setTimeout(() => {
        this._itemLoading.value = false;
      }, 300);
    }
  }
  //#endregion
  //#region
  async queryArtistDesc() {
    if (this._desc.value?.briefDesc) {
      return;
    }
    this._is_error.value = false;
    this._itemLoading.value = true;
    try {
      const res = await artistDetailService.getArtistDesc({
        id: this._id,
      });
      if (res?.code === 200) {
        this._desc.value = res;
      } else {
        this._desc.value = {
          briefDesc: '',
          code: 0,
          count: 0,
          introduction: [],
          topicData: [],
        };
      }
    } catch (error) {
      this._is_error.value = true;
      this._desc.value = {
        briefDesc: '',
        code: 0,
        count: 0,
        introduction: [],
        topicData: [],
      };
    } finally {
      this._itemLoading.value = false;
    }
  }
  //#endregion
  //#region P1 歌手增强（1.3 / 1.4）
  /** 粉丝数与关注状态：artist_follow_count */
  async queryFollowCount() {
    if (!this._id) return;
    try {
      const res = await contentEnhanceService.getArtistFollowCount({ id: this._id });
      if (res?.code === 200) this._followCount.value = res;
    } catch (error) {
      this._followCount.value = {};
    }
  }

  /** 粉丝列表：artist_fans */
  async queryFans() {
    if (!this._id) return;
    try {
      const res = await contentEnhanceService.getArtistFans({ id: this._id, limit: 10 });
      this._fans.value = (res?.data || []).map((item) => item.userProfile || {});
    } catch (error) {
      this._fans.value = [];
    }
  }

  /** 歌手热门 50 首：artist_top_song */
  async queryTopSongs() {
    if (!this._id) return;
    try {
      const res = await contentEnhanceService.getArtistTopSong({ id: this._id });
      this._topSongs.value = res?.songs || [];
    } catch (error) {
      this._topSongs.value = [];
    }
  }

  /** 歌手全部歌曲：artist_songs，order hot/time */
  async queryAllSongs(order: 'hot' | 'time' = 'hot') {
    if (!this._id) return;
    this._songOrder.value = order;
    try {
      const res = await contentEnhanceService.getArtistSongs({ id: this._id, order, limit: 30 });
      this._allSongs.value = res?.songs || [];
    } catch (error) {
      this._allSongs.value = [];
    }
  }

  /** 歌手相关视频：artist_video */
  async queryVideos() {
    if (!this._id) return;
    this._itemLoading.value = true;
    try {
      const res = await contentEnhanceService.getArtistVideo({ id: this._id, size: 10 });
      this._videos.value = res?.data?.records || res?.data?.feeds || [];
    } catch (error) {
      this._videos.value = [];
    } finally {
      this._itemLoading.value = false;
    }
  }

  /** 单曲 tab 数据源切换：热门 50 / 全部歌曲 */
  switchSongSource(source: 'top' | 'all') {
    this._songSource.value = source;
    if (source === 'all' && !this._allSongs.value.length) {
      this.queryAllSongs(this._songOrder.value);
    }
  }

  switchSongOrder(order: 'hot' | 'time') {
    this.queryAllSongs(order);
  }

  /** 关注/取消关注歌手：artist_sub（需登录，成功后刷新粉丝数与状态） */
  async toggleSub() {
    if (!hasLogin()) {
      this._actionTip.value = '登录后可关注歌手';
      return;
    }
    if (!this._id || this._subLoading.value) return;
    const followed = this._followCount.value?.data?.isFollow;
    const t = followed ? 0 : 1;
    this._subLoading.value = true;
    this._actionTip.value = '';
    try {
      const res = await contentEnhanceService.setArtistSub({ id: this._id, t: t as 1 | 0 });
      if (res?.code === 200) {
        this._actionTip.value = t === 1 ? '已关注该歌手' : '已取消关注';
        await this.queryFollowCount();
      } else {
        this._actionTip.value = res?.message || '操作未成功，请重试';
      }
    } catch (error) {
      this._actionTip.value = '关注失败，请检查登录态';
    } finally {
      this._subLoading.value = false;
    }
  }

  formatSongArtists(song: ContentSongItem): string {
    return (song.ar || song.artists || []).map((artist) => artist.name || '').join(' / ');
  }
  //#endregion
}

export default new ArtistDetail();
