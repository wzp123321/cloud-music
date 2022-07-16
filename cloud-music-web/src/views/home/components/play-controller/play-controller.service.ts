/*
 * @Description: 音乐播放服务
 * @Author: zpwan
 * @Date: 2022-07-16 14:55:54
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-07-16 16:36:23
 */
import { ref } from 'vue';
import { MusicVO } from '@/pages/artist-detail/services/artist-detail-api';

const playTypes = {
  循环播放: 'icon-xunhuanbofang',
  单曲循环: 'icon-24gl-repeatOnce2',
  随机播放: 'icon-24gl-shuffle',
};

class Player {
  //#region
  public readonly playTypes = playTypes;
  private _musicVO = ref<MusicVO>({
    name: '海阔天空',
    id: 347230,
    ar: [],
    alia: [],
    al: {
      id: 34209,
      name: '',
      picUrl: '',
      pic_str: '',
      pic: 109951165796899180,
    },
    dt: 326000,
    djId: 0,
    copyright: 1,
    mark: 8192,
    originCoverType: 1,
    resourceState: true,
    version: 112,
    single: 0,
    rtype: 0,
    mst: 9,
    mv: 376199,
    publishTime: 746812800000,
  });
  private _musicList = ref<MusicVO[]>([]);
  private _is_playing = ref<boolean>(false);
  private _typeIndex = ref<number>(0); // 当前播放类型索引
  private _is_mute = ref<boolean>(false); // 是否静音
  //#endregion

  //#region
  public get musicVO(): MusicVO {
    return this._musicVO.value;
  }
  public get musicList(): MusicVO[] {
    return this._musicList.value;
  }
  public get is_playing(): boolean {
    return this._is_playing.value;
  }
  public get typeIndex(): number {
    return this._typeIndex.value;
  }
  public get is_mute(): boolean {
    return this._is_mute.value;
  }
  //#endregion
  //#region
  switchPlayType() {
    this._typeIndex.value++;
  }
  //#endregion
  //#region
  switchPlayStatus() {
    this._is_playing.value = !this._is_playing.value;
  }
  //#endregion
  //#region
  switchIsMute() {
    this._is_mute.value = !this._is_mute.value;
  }
  //#endregion
}

export default new Player();
