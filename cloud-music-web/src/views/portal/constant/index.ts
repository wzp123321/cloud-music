import { ICodeName } from '@/apis/common/index.api';

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

// 首页排行榜展示的 5 个官方榜单 id（顺序与首页飙升/新歌/热歌/欧美/韩语五张榜单卡片一一对应）：
// 飙升榜 19723756 / 新歌榜 3779629 / 热歌榜 3778678 / 欧美榜 2809513713 / 韩语榜 745956260
export const HOME_RANK_IDS: readonly number[] = [
  19723756, 3779629, 3778678, 2809513713, 745956260,
];
