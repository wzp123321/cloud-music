<template>
  <div v-loading="loading" class="playlist-browse">
    <div class="pb-header">
      <h3>歌单分类</h3>
      <el-button type="primary" @click="openCreate">新建歌单</el-button>
    </div>

    <!-- 热门分类 + 精品标签 快捷筛选 -->
    <div class="pb-filter">
      <span class="pb-filter-label">分类：</span>
      <ul class="pb-chips">
        <li :class="['pb-chip', selectedCat === '全部' ? 'active' : '']" @click="onSelectCat('全部')">
          全部
        </li>
        <li
          v-for="item in hotTags"
          :key="'hot_' + item.name"
          :class="['pb-chip', selectedCat === item.name ? 'active' : '']"
          @click="onSelectCat(item.name)"
        >
          {{ item.name }}
        </li>
      </ul>
    </div>

    <div v-if="hqTags.length" class="pb-filter">
      <span class="pb-filter-label">精品：</span>
      <ul class="pb-chips">
        <li
          v-for="item in hqTags"
          :key="'hq_' + item.name"
          :class="['pb-chip', selectedCat === item.name ? 'active' : '']"
          @click="onSelectCat(item.name)"
        >
          {{ item.name }}
        </li>
      </ul>
    </div>

    <!-- 全部分类（catlist） -->
    <div v-if="catGroups.length" class="pb-all">
      <div class="pb-all-head" @click="showAll = !showAll">
        <span>全部分类</span>
        <cm-icon :name="showAll ? 'icon-xiangshang' : 'icon-xiangxia'"></cm-icon>
      </div>
      <div v-show="showAll" class="pb-all-body">
        <div v-for="(group, gIdx) in catGroups" :key="'catg_' + gIdx" class="pb-cat-group">
          <span class="pb-cat-group-name">{{ group.categoryName }}</span>
          <ul class="pb-cat-sub">
            <li
              v-for="(sub, sIdx) in group.subs"
              :key="'sub_' + gIdx + '_' + sIdx"
              :class="['pb-cat-item', selectedCat === sub.name ? 'active' : '']"
              @click="onSelectCat(sub.name)"
            >
              {{ sub.name }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 精品歌单列表 -->
    <div class="pb-list-head">
      <h4>{{ selectedCat }} · 精品歌单</h4>
    </div>
    <cm-loading v-if="listLoading"></cm-loading>
    <div v-else class="pb-grid">
      <cm-playlist-card
        v-for="item in playlists"
        :id="item.id"
        :key="'pl_' + item.id"
        :title="item.name"
        :cover-image-url="item.coverImgUrl"
        :play-count="item.playCount"
        :creator="item.creator?.nickname"
        :tag="selectedCat === '全部' ? '' : selectedCat"
      ></cm-playlist-card>
      <cm-error v-if="!playlists.length && !listLoading"></cm-error>
    </div>

    <playlist-form-dialog v-model="createVisible" mode="create" @success="onCreated" />
  </div>
</template>

<script lang="ts" setup>
import PlaylistFormDialog from './components/playlist-form-dialog.vue';
import { usePlaylistView } from './hooks/usePlaylistView';

const {
  loading,
  listLoading,
  selectedCat,
  showAll,
  hotTags,
  hqTags,
  catGroups,
  playlists,
  createVisible,
  onSelectCat,
  openCreate,
  onCreated,
} = usePlaylistView();
</script>

<style scoped lang="less">
.playlist-browse {
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding-top: 40px;
  padding-left: 24px;
  padding-right: 24px;

  .pb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      font-size: 28px;
      font-weight: 600;
    }
  }

  .pb-filter {
    display: flex;
    align-items: flex-start;
    margin-top: 24px;

    &-label {
      width: 56px;
      flex-shrink: 0;
      font-size: 14px;
      color: #666;
      line-height: 28px;
    }
  }

  .pb-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .pb-chip {
      padding: 4px 14px;
      border-radius: 16px;
      background-color: rgba(0, 0, 0, 0.05);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      &.active {
        background-color: var(--color-primary, #c20c0c);
        color: #fff;
      }
    }
  }

  .pb-all {
    margin-top: 24px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    padding: 12px 16px;

    &-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      font-size: 15px;
      font-weight: 600;
    }

    &-body {
      margin-top: 12px;
    }
  }

  .pb-cat-group {
    display: flex;
    align-items: flex-start;
    padding: 8px 0;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.06);

    &:last-child {
      border-bottom: none;
    }

    .pb-cat-group-name {
      width: 72px;
      flex-shrink: 0;
      font-size: 14px;
      color: #999;
      line-height: 28px;
    }
  }

  .pb-cat-sub {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;

    .pb-cat-item {
      font-size: 14px;
      color: #333;
      cursor: pointer;
      line-height: 28px;

      &:hover {
        color: var(--color-primary, #c20c0c);
      }

      &.active {
        color: var(--color-primary, #c20c0c);
        font-weight: 600;
      }
    }
  }

  .pb-list-head {
    margin-top: 32px;

    h4 {
      font-size: 20px;
      font-weight: 600;
    }
  }

  .pb-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 24px 24px;
    margin-top: 24px;

    // 卡片改为填满列宽，避免 5×262px 超出 1200px 容器导致横向溢出/裁切
    :deep(.cm-playlist-card) {
      width: 100%;
    }
  }
}
</style>
