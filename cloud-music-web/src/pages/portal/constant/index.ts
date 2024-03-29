import { ICodeName } from '@/services/common-api/common-api';

// 推荐歌单
export const recommendPlayListNavs: ICodeName<string>[] = [
  {
    code: '华语',
    name: '华语',
  },
  {
    code: '古风',
    name: '古风',
  },
  {
    code: '怀旧',
    name: '怀旧',
  },
  {
    code: '影视原声',
    name: '影视原声',
  },
  {
    code: '流行',
    name: '流行',
  },
  {
    code: '经典',
    name: '经典',
  },
];

// 新碟区域
export const areaList: ICodeName<string>[] = [
  {
    code: 'ALL',
    name: '全部',
  },
  {
    code: 'ZH',
    name: '华语',
  },
  {
    code: 'EA',
    name: '欧美',
  },
  {
    code: 'KR',
    name: '韩国',
  },
  {
    code: 'JP',
    name: '日本',
  },
];
