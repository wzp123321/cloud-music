<template>
  <div id="artist" class="artist">
    <cm-navbar :title="'歌手'" :has-load-more="false"></cm-navbar>

    <div class="artist--filters">
      <span class="artist--filter-label">分类</span>
      <cm-button
        v-for="type in typeOptions"
        :key="type.value"
        :class="['artist--filter', activeType === type.value ? 'active' : '']"
        @click="switchType(type.value)"
      >
        {{ type.name }}
      </cm-button>
      <span class="artist--filter-label">地区</span>
      <cm-button
        v-for="area in areaOptions"
        :key="area.value"
        :class="['artist--filter', activeArea === area.value ? 'active' : '']"
        @click="switchArea(area.value)"
      >
        {{ area.name }}
      </cm-button>
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
import { useArtistView } from './hooks/useArtistView';

const {
  typeOptions,
  areaOptions,
  activeType,
  activeArea,
  loading,
  hasLogin,
  artistList,
  followedArtists,
  newSongs,
  newMvs,
  switchType,
  switchArea,
  formatArtists,
  linkToArtist,
  linkToSong,
  linkToMv,
} = useArtistView();
</script>

<style scoped lang="less">
.artist {
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 24px 24px 48px;

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
