import { getRequest } from '@/services/request';
import { ref } from 'vue';
import { PL_IPlayVO } from './play-list.api';

enum EPath {
  查询歌曲地址 = '/song/url',
}

class PlayListService {
  //#region
  private _musicList = ref<PL_IPlayVO[]>([]); // 播放的音乐数组

  public get musicList(): PL_IPlayVO[] {
    return this._musicList.value;
  }
  //#endregion
  constructor() {
    if (window.localStorage.getItem('cloud-music-list')) {
      this._musicList.value = JSON.parse(window.localStorage.getItem('cloud-music-list') as string);
    }
  }

  async addMusic(value: PL_IPlayVO) {
    if (
      this?._musicList.value?.length &&
      this?._musicList.value?.findIndex((item) => {
        return item.id === value?.id;
      }) !== -1
    ) {
      return;
    }
    const url = (await this.queryMusicUrl(value?.id + '')) as string;
    this._musicList.value.push({
      ...value,
      url,
    });

    window.localStorage.setItem('cloud-music-list', JSON.stringify(this._musicList.value));
  }

  removeMusic(id: number) {
    this._musicList.value = this._musicList.value?.filter((item) => {
      return item?.id === id;
    });

    window.localStorage.setItem('cloud-music-list', JSON.stringify(this._musicList.value));
  }

  queryMusicUrl(id: string) {
    return new Promise(async (resolve) => {
      try {
        const res = await getRequest(EPath.查询歌曲地址, {
          id,
        });
        if (res?.data?.length) {
          resolve(res?.data?.[0]?.url);
        } else {
          resolve('');
        }
      } catch (error) {
        resolve('');
      }
    });
  }
}

export default new PlayListService();
