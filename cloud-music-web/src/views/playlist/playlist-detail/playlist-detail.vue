<template>
  <cm-loading v-if="playListDetailService.loading"></cm-loading>
  <div v-if="!playListDetailService.loading" id="playlist-detail" class="playlist-detail">
    <section class="pd-cover">
      <cm-image :src="playListDetail?.coverImgUrl" alt="" />
      <h5>歌单简介</h5>
      <p>{{ playListDetail?.description ?? '' }}</p>
    </section>
    <section class="pd-musiclist">
      <h5>{{ playListDetail?.name }}</h5>
      <div class="pd-musiclist-author">
        <cm-image :src="playListDetail?.creator?.avatarUrl" alt="" />
        <span>{{ playListDetail?.creator?.nickname }}</span>
      </div>
      <div v-if="playListDetail?.tags?.length" class="pd-musiclist-tags mt6 mb24">
        <span v-for="(item, index) in playListDetail?.tags" :key="'tag_' + index"> {{ item }}</span>
      </div>

      <!-- 操作栏：订阅 / 编辑 / 添加歌曲 -->
      <div class="pd-toolbar mb24">
        <el-button
          :type="playListDetailService.subscribed ? 'default' : 'primary'"
          @click="onToggleSubscribe"
        >
          {{ playListDetailService.subscribed ? '已收藏' : '收藏' }}
        </el-button>
        <el-button @click="openEdit">编辑</el-button>
        <el-button @click="setAddVisible(true)">添加歌曲</el-button>
        <span v-if="dynamic" class="pd-stat">
          <cm-icon name="icon-z"></cm-icon> {{ formatStat(dynamic.playCount) }}
          <cm-icon name="icon-jushoucang" class="ml12"></cm-icon> {{ formatStat(dynamic.bookCount ?? dynamic.subscribedCount) }}
          <cm-icon name="icon-pinglun" class="ml12"></cm-icon> {{ formatStat(dynamic.commentCount) }}
        </span>
      </div>

      <!-- 歌曲 -->
      <cm-table
        :data-source="musicList"
        :show-remove="true"
        @remove="onRemove"
      ></cm-table>

      <div v-if="commentRes?.hotComments?.length" class="pd-musiclist-header">
        <h5>热门评论</h5>
        <span>{{ commentRes?.hotComments?.length }}条</span>
      </div>
      <cm-comment
        v-for="(item, index) in commentRes?.hotComments"
        :id="playlistId"
        :key="'comment-' + index"
        :comment-v-o="item"
        type="playlist"
      ></cm-comment>
      <div v-if="commentRes?.comments?.length" class="pd-musiclist-header mt60">
        <h5>最新评论</h5>
        <span>{{ commentRes?.comments?.length }}条</span>
      </div>
      <cm-comment
        v-for="(item, index) in commentRes?.comments"
        :id="playlistId"
        :key="'comment-' + index"
        :comment-v-o="item"
        type="playlist"
      ></cm-comment>

      <!-- 相似推荐：simi_playlist（取歌单内歌曲） -->
      <cm-simi :id="musicList[0]?.id" type="playlist"></cm-simi>
    </section>
  </div>

  <!-- 添加歌曲弹窗 -->
  <el-dialog v-model="addVisible" title="添加歌曲到歌单" width="420px">
    <el-input
      v-model="addSongIds"
      type="textarea"
      :rows="3"
      placeholder="请输入歌曲 ID，多个用逗号分隔"
    />
    <template #footer>
      <el-button @click="setAddVisible(false)">取消</el-button>
      <el-button type="primary" :loading="adding" @click="onAddSong">确定添加</el-button>
    </template>
  </el-dialog>

  <!-- 编辑歌单弹窗 -->
  <playlist-form-dialog
    v-model="editVisible"
    mode="edit"
    :playlist-id="playlistId"
    :name="playListDetail?.name"
    :desc="playListDetail?.description"
    :tags="(playListDetail?.tags || []).join(',')"
    :show-name="true"
    @success="onEdited"
  />
</template>

<script lang="ts" setup>
import PlaylistFormDialog from '../components/playlist-form-dialog.vue';
import { usePlaylistDetailView } from './hooks/usePlaylistDetailView';

const {
  playListDetailService,
  playlistId,
  playListDetail,
  musicList,
  commentRes,
  dynamic,
  addVisible,
  addSongIds,
  adding,
  editVisible,
  setAddVisible,
  onToggleSubscribe,
  onRemove,
  onAddSong,
  openEdit,
  onEdited,
  formatStat,
} = usePlaylistDetailView();
</script>

<style scoped lang="less">
#playlist-detail {
  width: 100%;
  height: 100%;

  padding-top: 40px;

  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 56px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .pd-cover {
    img {
      width: 100%;
    }

    h5 {
      margin-top: 40px;
      margin-bottom: 10px;
      font-size: 22px;
      font-weight: 600;
      height: 30px;
      line-height: 30px;

      color: var(--color-text);
    }

    p {
      width: 100%;
      font-size: 14px;
      color: #666;
      line-height: 21px;
    }
  }

  .pd-musiclist {
    h5 {
      word-break: break-all;
      font-size: 30px;
      font-weight: 600;
      line-height: 42px;
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;

      margin-top: 24px;
    }

    &-author {
      display: flex;
      align-items: center;
      margin-top: 12px;

      img {
        width: 24px;
        height: 24px;

        border-radius: 50%;
      }

      span {
        font-size: 18px;
        height: 25px;
        color: #666;
        line-height: 25px;
        font-weight: 400;

        margin-left: 8px;
      }
    }

    &-tags {
      span {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;

        background-color: rgba(0, 0, 0, 0.08);
      }

      span + span {
        margin-left: 12px;
      }
    }

    &-header {
      display: flex;
      align-items: flex-end;

      h5 {
        font-size: 22px;
        line-height: 30px;
        font-weight: 600;
      }

      span {
        margin-left: 8px;
        font-weight: 300;
        font-size: 14px;
      }
    }
  }

  .pd-toolbar {
    display: flex;
    align-items: center;

    .pd-stat {
      margin-left: 16px;
      font-size: 13px;
      color: #999;

      .iconfont {
        margin-right: 2px;
      }

      .ml12 {
        margin-left: 12px;
      }
    }
  }
}
</style>
