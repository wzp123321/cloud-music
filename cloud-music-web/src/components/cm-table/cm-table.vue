<template>
  <cm-state :loading="loading" :error="error" :empty="!loading && !error && !dataSource.length" :empty-text="emptyText">
    <table style="width: 100%">
      <thead>
        <tr>
          <th style="width: 8%">序号</th>
          <th style="width: 32%">歌曲</th>
          <th style="width: 30%">专辑</th>
          <th style="width: 30%">时长</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in dataSource.slice((page - 1) * pageSize, page * pageSize)" :key="'song_' + index">
          <td style="width: 8%" class="sort">
            <span>{{ (page - 1) * pageSize + index + 1 }}</span>
          </td>
          <td style="width: 32%" class="song-cell">
            <!-- td 不能设 display:flex，否则表格列宽塌陷、歌名被压成 0 宽 -->
            <div class="song-cell-inner">
              <cm-image class="song-cover" :src="item?.picUrl" alt="" />
              <span class="mname" :title="item.name" @click="linkToDetailPage(item.id)">{{ item.name }}</span>
              <span class="quality-badge">无损</span>
              <span class="mv-badge">mv</span>
            </div>
          </td>
          <td ellipsis style="width: 30%">{{ item.alName ?? '--' }}</td>
          <td ellipsis style="width: 30%">
            <span class="duration-text">{{ formatDuration(item.dt) }}</span>
            <div class="op-btn flex-row-start-center">
              <cm-icon name="icon-24gf-play" title="播放" @click="onPlay(item, $event)"></cm-icon>
              <cm-icon name="icon-tianjia" title="添加到歌单" @click="handleAddPlayItem(item)"></cm-icon>
              <cm-icon name="icon-jushoucang" title="收藏" @click="handleLike(item)"></cm-icon>
              <cm-icon name="icon-xiazai" title="下载" @click="handleDownload(item)"></cm-icon>
              <cm-icon name="icon-xiangqing" title="详情" @click="linkToDetailPage(item.id)"></cm-icon>
              <cm-icon v-if="showRemove" name="icon-shanchu" title="从歌单移除" @click="handleRemove(item)"></cm-icon>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="total > pageSize" class="flex-row-center-center">
      <el-pagination v-model:current-page="page" layout="prev, pager, next" :total="total" :page-size="pageSize" />
    </div>
  </cm-state>
</template>

<script setup lang="ts">
// 表格
import { PropType, ref, computed } from 'vue';
import { useRouter } from 'vue-router';

import { formatDuration } from '@/core/utils';
import { usePlayerStore } from '@/store/player';
import { usePlaylistStore } from '@/store/playlist';

import { Common_IMusic } from '../../apis/common/index.api';
import { PL_PlayVO } from '../../apis/play-list/index.api';
import { ElPagination } from 'element-plus';
import message from '@/utils/message';
import { sessionManager } from '@/core/session';
import playInteractionService from '@/apis/play-interaction/play-interaction.service';
import musicService from '@/apis/play-controller/pc.service';
import { downloadFileByUrl } from '@/apis/file-download-upload/util';
import CmState from '@/components/cm-state/cm-state.vue';
import { flyToPlayer } from '@/components/cm-fly-ball/fly-to-player';
defineOptions({ name: 'CmTable' });
const props = defineProps({
  dataSource: {
    type: Array as PropType<Common_IMusic[]>,
    default: () => [],
  },
  // 是否展示“从歌单移除”操作（歌单详情页使用）
  showRemove: {
    type: Boolean,
    default: false,
  },
  // 三态：由上层页面控制，缺省时按有数据渲染，不改变原有调用方行为
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: [Boolean, String] as PropType<boolean | string>,
    default: false,
  },
  emptyText: {
    type: String,
    default: '暂无歌曲',
  },
});
const emit = defineEmits(['remove']);
const page = ref<number>(1);
const router = useRouter();
const player = usePlayerStore();
const playList = usePlaylistStore();

const pageSize = 20;

const total = computed(() => {
  return props.dataSource?.length;
});

/** 播放当前行：v-for 已按分页 slice，直接传行对象，避免用局部 index 索引全局数组放错歌 */
const onPlay = (item: Common_IMusic, event?: MouseEvent) => {
  if (item?.id) {
    // 从鼠标位置抛一个封面到播放器，给"这首歌已经切过去了"一个可见的因果关系
    if (event) {
      flyToPlayer({ x: event.clientX, y: event.clientY }, item.picUrl);
    }
    player.play(item);
  }
};

const handleAddPlayItem = (item: Common_IMusic) => {
  const music: PL_PlayVO = {
    artist: item?.artist,
    dt: item?.dt,
    url: '',
    alName: item?.alName ?? '',
    name: item.name,
    picUrl: item?.picUrl,
    id: item.id,
  };
  playList.addMusic(music);

  message.success('添加成功');
};

/** 收藏走 /like 红心接口；写操作先校验登录态 */
const handleLike = async (item: Common_IMusic) => {
  if (!sessionManager.isAlive()) {
    message.info('请先登录后再收藏');
    return;
  }
  try {
    const res = await playInteractionService.setLike({ id: item.id, like: true });
    // 301 由响应拦截器统一吊销会话并提示，这里不重复弹错
    if (res?.code === 301) return;
    if (res?.code === 200) {
      message.success('收藏成功');
    } else {
      message.error(res?.message ?? '收藏失败');
    }
  } catch {
    message.error('收藏失败，请稍后重试');
  }
};

/** 下载走 /song/download/url，拿不到有效地址时给出明确提示 */
const handleDownload = async (item: Common_IMusic) => {
  if (!sessionManager.isAlive()) {
    message.info('请先登录后再下载');
    return;
  }
  try {
    const res = await musicService.getSongDownloadUrl({ id: item.id });
    if (res?.code === 301) return;
    const url = res?.data?.url;
    if (!url) {
      message.error('当前歌曲不可下载');
      return;
    }
    await downloadFileByUrl(url, `${item.name}.mp3`);
    message.success('已开始下载');
  } catch {
    message.error('下载失败，请稍后重试');
  }
};

/** 点歌名/详情 → 先播放该歌曲，再打开播放页（与网易云一致） */
const linkToDetailPage = (id: number) => {
  const item = props.dataSource.find((music) => music.id === id);
  if (item) {
    player.play(item, props.dataSource);
  }
  router.push({
    path: '/music_detail',
    query: { id },
  });
};

const handleRemove = (item: Common_IMusic) => {
  emit('remove', item);
};
</script>

<style lang="less" scoped>
table {
  thead tr th {
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  tbody tr td {
    position: relative;
  }

  tbody tr td {
    vertical-align: middle;
    padding: 8px 0;
  }

  tbody tr td.sort {
    text-align: center;

    span {
      font-weight: 600;
    }
  }

  tbody tr td.song-cell {
    .song-cell-inner {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }

    .song-cover {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .mname {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: pointer;

      &:hover {
        color: var(--color-primary);
      }
    }
  }

  tbody tr td span.quality-badge {
    margin: 0 5px;
    flex-shrink: 0;
    font-size: 15px;
    color: #e6b86d;
    font-size: 12px;
    padding: 1px 2px;
    border: 1px solid #e6b86d;
    border-radius: 4px;
  }
  tbody tr td span.mv-badge {
    margin-left: 5px;
    flex-shrink: 0;
    font-size: 12px;
    padding: 1px 3px;
    border-radius: 5px;
    font-weight: 400;
    color: var(--color-default);
    background-color: var(--color-text-secondary);
  }

  tbody tr td .op-btn {
    cursor: pointer;
    display: none;
    transition: all 233ms;
  }

  tbody tr td .op-btn i.iconfont + i.iconfont {
    font-size: 16px;
    margin-left: 24px;
  }

  tbody tr td .op-btn :deep(.is-liked) {
    color: var(--color-primary, #c20c0c);
  }

  tbody tr:hover td span.duration-text {
    display: none;
    transition: all 233ms;
  }

  tbody tr:hover td .op-btn {
    display: inline-block;
    transition: all 233ms;
  }
}
</style>
