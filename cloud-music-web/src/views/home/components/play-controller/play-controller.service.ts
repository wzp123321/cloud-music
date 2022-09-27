/*
 * @Description: 音乐播放服务
 * @Author: zpwan
 * @Date: 2022-07-16 14:55:54
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-09-27 20:38:58
 */
import { ref, nextTick } from 'vue';
import { IMusic } from '@/services/common-api/common-api';

import musicService from './pc.service';

import message from '@/utils/message';

enum PLAY_TYPE {
  LOOP = '循环播放',
  SINGLE = '单曲循环',
  RANDOM = '随机播放',
}

const playTypes = {
  [PLAY_TYPE.LOOP]: 'icon-xunhuanbofang',
  [PLAY_TYPE.SINGLE]: 'icon-24gl-repeatOnce2',
  [PLAY_TYPE.RANDOM]: 'icon-24gl-shuffle',
};

interface Lyric {
  time: number;
  lyc: string;
}

class Player {
  //#region
  public readonly playTypes = playTypes;
  private _musicVO = ref<IMusic>({
    name: '',
    artist: '',
    url: '',
    alName: '',
    dt: 0,
    picUrl: '',
    id: 0,
  });
  private _musicList = ref<IMusic[]>([]); // 播放的音乐数组
  private _is_playing = ref<boolean>(false);
  private _typeIndex = ref<number>(0); // 当前播放类型索引
  private _index = ref<number>(0); // 当前播放索引
  private _is_mute = ref<boolean>(false); // 是否静音
  private _play_timestamp = ref<number>(0); // 当前播放进度
  private _lrcList = ref<Lyric[]>([]); // 歌词
  private _lrcPanel = ref<string[]>([]); // 歌词面板
  private _volume = ref<number>(50);

  private _progress = ref<number>(0);
  private _dragging = ref<boolean>(false);
  public readonly musicRef = ref<any>(null);
  //#endregion

  //#region
  public get musicVO(): IMusic {
    return this._musicVO.value;
  }
  public get musicList(): IMusic[] {
    return this._musicList.value;
  }
  public get is_playing(): boolean {
    return this._is_playing.value;
  }
  public get typeIndex(): number {
    return this._typeIndex.value;
  }
  public get index(): number {
    return this._index.value;
  }
  public get is_mute(): boolean {
    return this._is_mute.value;
  }
  public get play_timestamp(): number {
    return this._play_timestamp.value;
  }
  public get progress(): number {
    return this._progress.value;
  }
  public set progress(value: number) {
    this._progress.value = value;
  }
  public get dragging(): boolean {
    return this._dragging.value;
  }
  public get lrcList(): Lyric[] {
    return this._lrcList.value;
  }
  // 每次只能由三个
  public get lrcPanel(): string[] {
    return this._lrcPanel.value;
  }
  public get volume(): number {
    return this._volume.value;
  }
  public set volume(value: number) {
    this._volume.value = value;
  }

  //#endregion
  constructor() {
    if (window.localStorage.getItem('cloud-music-list')) {
      this._musicList.value = JSON.parse(window.localStorage.getItem('cloud-music-list') as string);
      this._index.value = JSON.parse(window.localStorage.getItem('cloud-play-index') as string);
      this._musicVO.value = this._musicList.value[this._index.value];
    }
  }
  //#region
  async play(songs: IMusic[], index: number) {
    this._musicList.value = [];
    this._play_timestamp.value = 0;
    if (!songs || songs?.length === 0) {
      return;
    }
    const ids = songs.map((item) => {
      return item?.id;
    });
    const res = await musicService.getSongUrlByIds({ id: ids?.join(',') });
    const list = res?.data.sort((a: IMusic, b: IMusic) => {
      return ids.indexOf(a.id) - ids.indexOf(b.id);
    });
    songs.forEach((item, i) => {
      this._musicList.value.push({
        artist: item?.artist,
        dt: item?.dt,
        url: list[i].url,
        alName: item?.alName ?? '',
        name: item.name,
        picUrl: item?.picUrl,
        id: list[i].id,
      });
    });
    this._musicVO.value = this._musicList.value[index];
    this._index.value = index;
    nextTick(() => {
      this.handlePlay();
    });
    this._is_playing.value = true;
    this.handleStorage();
  }
  //#endregion
  //#region
  handleStorage() {
    window.localStorage.setItem('cloud-music-list', JSON.stringify(this._musicList.value));
    window.localStorage.setItem('cloud-play-index', this._index.value + '');
  }
  //#endregion
  //#region
  handleTimeupdate(e: Event) {
    this._play_timestamp.value = this.musicRef.value.currentTime * 1000;

    this._progress.value = Number(Math.round((100 * this._play_timestamp.value) / this._musicVO.value.dt));
    if (this._lrcList.value?.length === 0) {
      this._lrcPanel.value = [];
      return;
    }
    if (this._lrcPanel.value?.length === 0) {
      this._lrcPanel.value.push(this._lrcList.value?.[0].lyc);
      this._lrcPanel.value.push(this._lrcList.value?.[1].lyc);
    } else {
      // 比当前数组最后一条大
      if (this._play_timestamp.value > this._lrcList.value[this._lrcPanel.value.length].time) {
        this._lrcPanel.value.push(this._lrcList.value[this._lrcPanel.value.length].lyc);
      }
    }
  }
  //#endregion
  //#region
  getShowLyc() {
    return this._lrcPanel.value?.length ? this._lrcPanel.value[this._lrcPanel.value?.length - 1] : '';
  }
  //#endregion
  //#region
  formatDuration(timeStamp: number) {
    const min = Math.floor(timeStamp / (60 * 1000));
    const sec = Math.floor((timeStamp - min * 60 * 1000) / 1000);
    const over = timeStamp - min * 60 * 1000 - sec * 1000;

    return `${min > 9 ? min.toFixed(0) : '0' + min.toFixed(0)}:${
      sec > 9 ? sec.toFixed(0) : 0 + sec.toFixed(0)
    }.${over}`;
  }
  //#endregion
  //#region
  handlePlayEnd(switchType: string = 'next') {
    if (this._musicList.value?.length === 0) {
      return;
    }
    const type = Object.keys(playTypes)[this._typeIndex.value % Object.keys(playTypes).length];
    switch (type) {
      case PLAY_TYPE.LOOP:
        this.switchMusic(switchType);
        break;
      case PLAY_TYPE.SINGLE:
        this._play_timestamp.value = 0;
        nextTick(() => {
          this.handlePlay();
        });

        this._is_playing.value = true;
        this.handleStorage();
        break;
      case PLAY_TYPE.RANDOM:
        this._index.value = Math.round(Number((Math.random() * this._musicList.value.length).toFixed(0)));
        this._musicVO.value = this._musicList.value[this._index.value];
        nextTick(() => {
          this.handlePlay();
        });
        this._is_playing.value = true;
        this.handleStorage();
        break;
    }
  }
  //#endregion
  //#region
  handleProgressChange = () => {
    this._dragging.value = false;
    this.musicRef.value.currentTime = this._play_timestamp.value / 1000;
  };
  //#endregion
  //#region
  handleProgressSliderMouseDown = (e: MouseEvent) => {
    if (this._musicList.value?.length === 0) {
      return;
    }
    this._dragging.value = true;
    this._is_playing.value = false;
    this.musicRef.value.pause();
  };
  //#endregion
  //#region
  handleProgressSliderMouseUp = (e: MouseEvent) => {
    if (this._musicList.value?.length === 0) {
      return;
    }
    this._dragging.value = false;
    this._is_playing.value = true;
    this._play_timestamp.value = this._musicVO.value.dt * (this._progress.value / 100);
    this.musicRef.value.play();
  };
  //#endregion
  //#region
  handleVolumeChange = () => {
    this._dragging.value = false;
    this.musicRef.value.volume = this._volume.value / 100;
  };
  //#endregion

  //#region
  switchPlayType() {
    this._typeIndex.value++;
  }
  //#endregion
  //#region
  switchPlayStatus() {
    if (this._musicList.value?.length === 0) {
      return;
    }
    this._is_playing.value = !this._is_playing.value;
    if (this._is_playing.value) {
      this.handlePlay(false);
    } else {
      this.musicRef.value.pause();
    }
  }
  //#endregion
  //#region
  switchMusic(type: string) {
    this._is_playing.value = false;
    this._play_timestamp.value = 0;
    switch (type) {
      case 'preview':
        this._index.value -= 1;
        this._index.value = this._index.value === -1 ? this._musicList.value.length - 1 : this._index.value;
        this._musicVO.value = this._musicList.value[this._index.value];
        nextTick(() => {
          this.handlePlay();
        });
        this.handleStorage();
        break;
      case 'next':
        this._index.value += 1;
        this._index.value = this._index.value === this._musicList.value.length ? 0 : this._index.value;
        this._musicVO.value = this._musicList.value[this._index.value];
        nextTick(() => {
          this.handlePlay();
        });
        this.handleStorage();
        break;
    }
  }
  //#endregion
  //#region
  handlePlay(resetFlag: boolean = true) {
    if (!this._musicVO.value.url) {
      this.handlePlayEnd();
      return;
    }
    if (resetFlag) {
      this.musicRef.value.currentTime = 0;
    }
    document.title = this._musicVO.value.name ?? '网抑云Music';
    this.musicRef.value.play();
    this._is_playing.value = true;
    this.getSongLyric();
  }
  //#endregion
  //#region
  async getSongLyric() {
    try {
      const res = await musicService.getLyricById({ id: this._musicVO.value.id });
      const lrcs = res?.lrc?.lyric?.split(/\n/);

      if (lrcs?.length) {
        lrcs?.forEach((item: string) => {
          const l = item.split(']');

          const timeStr = l?.[0]?.replace('[', '');
          const t = timeStr?.split(':');
          const s = t?.[1]?.split('.');
          const time =
            Number(t?.[0]?.startsWith('0') ? t?.[0]?.replace('0', '') : t?.[0]) * (60 * 1000) +
            Number(s?.[0]?.startsWith('0') ? s?.[0]?.replace('0', '') : s?.[0]) * 1000 +
            Number(s?.[1] ?? '');
          const lyc = l[1] as string;
          this._lrcList.value.push({
            time,
            lyc,
          });
        });
      }
    } catch (error) {
      this._lrcList.value = [];
    }
  }
  //#endregion
  //#region
  renderLyric(time: number) {}
  //#endregion
  //#region
  switchIsMute() {
    this._is_mute.value = !this._is_mute.value;
  }
  //#endregion
  //#region
  async downloadMusic() {
    try {
      const res = await musicService.getSongDownloadUrl({ id: this._musicVO.value.id });
      if (res?.data?.url) {
        const a = document.createElement('a');
        a.href = res?.data?.url;
        a.click();
      } else {
        message.error('当前歌曲不可下载！');
      }
    } catch (error) {
      message.error('服务异常！');
    }
  }
  //#endregion
}

export default new Player();
