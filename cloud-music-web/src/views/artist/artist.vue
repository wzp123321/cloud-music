<template>
  <div id="artist" class="artist">
    <cm-navbar :title="'歌手'" :has-load-more="false"></cm-navbar>

    <div class="artist--filters">
      <span class="artist--filter-label">分类</span>
      <button
        v-for="type in typeOptions"
        :key="type.value"
        :class="['artist--filter', activeType === type.value ? 'active' : '']"
        @click="switchType(type.value)"
      >
        {{ type.name }}
      </button>
      <span class="artist--filter-label">地区</span>
      <button
        v-for="area in areaOptions"
        :key="area.value"
        :class="['artist--filter', activeArea === area.value ? 'active' : '']"
        @click="switchArea(area.value)"
      >
        {{ area.name }}
      </button>
    </div>

    <section class="artist--section">
      <h3 class="artist--heading">歌手列表</h3>
      <div v-if="loading" class="artist--status">加载中…</div>
      <cm-error v-else-if="!artistList.length" :title="'暂无歌手数据'"></cm-error>
      <div v-else class="artist--grid grid-cols-6">
        <div
          v-for="item in artistList"
          :key="'artist_' + item.id"
          class="artist--card"
          @click="linkToArtist(item.id)"
        >
          <cm-skeleton
            width="100%"
            :height="''"
            :image-url="item.img1v1Url || item.picUrl || ''"
            :border-radius="'50%'"
          ></cm-skeleton>
          <p class="artist--name" :title="item.name">{{ item.name }}</p>
          <p class="artist--sub">单曲 {{ item.musicSize ?? 0 }} · 专辑 {{ item.albumSize ?? 0 }}</p>
        </div>
      </div>
    </section>

    <!-- 关注歌手列表：artist_sublist（需登录，未登录降级提示） -->
    <section class="artist--section">
      <h3 class="artist--heading">我关注的歌手</h3>
      <p v-if="!hasLogin" class="artist--tip">登录后查看关注的歌手</p>
      <cm-error v-else-if="!followedArtists.length" :title="'暂无关注歌手'"></cm-error>
      <div v-else class="artist--chips">
        <span v-for="item in followedArtists" :key="'follow_' + item.id" @click="linkToArtist(item.id)">
          {{ item.name }}
        </span>
      </div>
    </section>

    <!-- 关注歌手新歌：artist_new_song（需登录，未登录降级提示） -->
    <section class="artist--section">
      <h3 class="artist--heading">关注歌手 · 新歌</h3>
      <p v-if="!hasLogin" class="artist--tip">登录后查看关注歌手的新歌</p>
      <cm-error v-else-if="!newSongs.length" :title="'暂无新歌'"></cm-error>
      <ul v-else class="artist--list">
        <li v-for="(song, index) in newSongs" :key="'ns_' + index" @click="linkToSong(song.id)">
          <span class="artist--list-index">{{ index + 1 }}</span>
          <span class="artist--list-name">{{ song.name }}</span>
          <span class="artist--list-sub">{{ formatArtists(song) }}</span>
        </li>
      </ul>
    </section>

    <!-- 关注歌手新 MV：artist_new_mv（需登录，未登录降级提示） -->
    <section class="artist--section">
      <h3 class="artist--heading">关注歌手 · 新 MV</h3>
      <p v-if="!hasLogin" class="artist--tip">登录后查看关注歌手的新 MV</p>
      <cm-error v-else-if="!newMvs.length" :title="'暂无新 MV'"></cm-error>
      <ul v-else class="artist--list">
        <li v-for="(mv, index) in newMvs" :key="'nm_' + index" @click="linkToMv(mv.id || mv.mvid)">
          <span class="artist--list-index">{{ index + 1 }}</span>
          <span class="artist--list-name">{{ mv.name }}</span>
          <span class="artist--list-sub">{{ mv.artistName || '' }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import contentEnhanceService, { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';
import { ContentArtistItem, ContentSongItem, ContentMvItem } from '@/apis/content-enhance/index.api';

const router = useRouter();

const typeOptions = [
  { name: '男歌手', value: '1' },
  { name: '女歌手', value: '2' },
  { name: '乐队', value: '3' },
];

const areaOptions = [
  { name: '全部', value: -1 },
  { name: '华语', value: 7 },
  { name: '欧美', value: 96 },
  { name: '日本', value: 8 },
  { name: '韩国', value: 16 },
  { name: '其他', value: 0 },
];

const activeType = ref<string>('1');
const activeArea = ref<number>(-1);
const loading = ref<boolean>(false);
const hasLogin = checkLogin();
const artistList = ref<ContentArtistItem[]>([]);
const followedArtists = ref<ContentArtistItem[]>([]);
const newSongs = ref<ContentSongItem[]>([]);
const newMvs = ref<ContentMvItem[]>([]);

/** 歌手分类列表，参数由页面筛选条提供 */
const loadArtists = async () => {
  loading.value = true;
  try {
    const res = await contentEnhanceService.getArtistList({
      type: activeType.value,
      area: activeArea.value,
      limit: 30,
    });
    artistList.value = res?.artists || [];
  } catch {
    artistList.value = [];
  } finally {
    loading.value = false;
  }
};

/** 需登录的三块内容：未登录不发起请求，只做降级展示 */
const loadLoginOnlySections = async () => {
  if (!hasLogin) return;
  const [sublist, songs, mvs] = await Promise.all([
    contentEnhanceService.getArtistSublist({ limit: 25 }).catch(() => null),
    contentEnhanceService.getArtistNewSong({ limit: 10 }).catch(() => null),
    contentEnhanceService.getArtistNewMv({ limit: 10 }).catch(() => null),
  ]);
  followedArtists.value = (sublist?.data as ContentArtistItem[]) || [];
  const songData: any = songs?.data;
  newSongs.value = (Array.isArray(songData) ? songData : songData?.list || []) as ContentSongItem[];
  const mvData: any = mvs?.data;
  newMvs.value = (Array.isArray(mvData) ? mvData : mvData?.list || []) as ContentMvItem[];
};

const switchType = (value: string) => {
  if (activeType.value === value) return;
  activeType.value = value;
  loadArtists();
};

const switchArea = (value: number) => {
  if (activeArea.value === value) return;
  activeArea.value = value;
  loadArtists();
};

const formatArtists = (song: ContentSongItem): string =>
  (song.ar || song.artists || []).map((artist) => artist.name || '').join(' / ');

/** 列表 → 详情参数来源：artists[].id 传入 /artist_detail?id= */
const linkToArtist = (id?: number) => {
  if (!id) return;
  router.push({ path: '/artist_detail', query: { id: String(id) } });
};
const linkToSong = (id?: number) => {
  if (!id) return;
  router.push({ path: '/music_detail', query: { id: String(id) } });
};
const linkToMv = (id?: number) => {
  if (!id) return;
  router.push({ path: '/mvplay', query: { mvid: String(id) } });
};

onMounted(() => {
  loadArtists();
  loadLoginOnlySections();
});
</script>

<style scoped lang="less">
.artist {
  width: 1200px;
  margin: 0 auto;
  padding: 24px 0 48px;

  &--filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
    padding: 14px 18px;
    background: var(--color-default, #fff);
    border-radius: 8px;
  }

  &--filter-label {
    font-size: 13px;
    color: #999;
    margin-right: 4px;
  }

  &--filter {
    padding: 4px 12px;
    border: none;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.04);
    color: #666;
    font-size: 13px;
    cursor: pointer;

    &.active {
      color: #fff;
      background: var(--color-primary, #c20c0c);
    }
  }

  &--section {
    margin-top: 24px;
    padding: 16px 20px;
    background: var(--color-default, #fff);
    border-radius: 8px;
  }

  &--heading {
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }

  &--status,
  &--tip {
    margin-top: 16px;
    font-size: 13px;
    color: #999;
  }

  &--grid {
    display: grid;
    gap: 24px;
    margin-top: 20px;
  }

  &--card {
    cursor: pointer;
    text-align: center;

    // 歌手头像为正方形，跟随列宽缩放
    :deep(.cm-skeleton) {
      height: auto;
      aspect-ratio: 1;
    }

    &:hover .artist--name {
      color: var(--color-primary, #c20c0c);
    }
  }

  &--name {
    margin-top: 10px;
    font-size: 14px;
    color: #333;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--sub {
    margin-top: 4px;
    font-size: 12px;
    color: #999;
  }

  &--chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;

    span {
      padding: 5px 14px;
      border-radius: 14px;
      background: rgba(0, 0, 0, 0.04);
      color: #666;
      font-size: 13px;
      cursor: pointer;
    }
  }

  &--list {
    margin-top: 12px;

    li {
      display: flex;
      align-items: center;
      height: 42px;
      padding: 0 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      font-size: 14px;
      cursor: pointer;

      &:hover {
        background: rgba(0, 0, 0, 0.03);
      }
    }
  }

  &--list-index {
    width: 40px;
    color: #999;
  }

  &--list-name {
    flex: 2;
    color: #333;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--list-sub {
    flex: 1;
    color: #999;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
</style>
