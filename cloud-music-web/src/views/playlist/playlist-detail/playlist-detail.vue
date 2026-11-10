<template>
  <cm-loading v-if="playListDetailService.loading"></cm-loading>
  <div v-if="!playListDetailService.loading" id="playlist-detail" class="playlist-detail">
    <section class="pd-cover">
      <img :src="playListDetail?.coverImgUrl" alt="" />
      <h5>歌单简介</h5>
      <p>{{ playListDetail?.description ?? '' }}</p>
    </section>
    <section class="pd-musiclist">
      <h5>{{ playListDetail?.name }}</h5>
      <div class="pd-musiclist-author">
        <img :src="playListDetail?.creator?.avatarUrl" alt="" />
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
        <el-button @click="addVisible = true">添加歌曲</el-button>
        <span v-if="dynamic" class="pd-stat">
          <i class="iconfont icon-z"></i> {{ formatStat(dynamic.playCount) }}
          <i class="iconfont icon-jushoucang ml12"></i> {{ formatStat(dynamic.bookCount ?? dynamic.subscribedCount) }}
          <i class="iconfont icon-pinglun ml12"></i> {{ formatStat(dynamic.commentCount) }}
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
      <el-button @click="addVisible = false">取消</el-button>
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
import { ref, watch } from 'vue';
import { usePlayListDetail } from './playlist-detail.service';
import { PD_IPlaylistDetail } from './playlist-detail.api';
import { Common_IMusic } from '../../../apis/common/index.api';
import { MP_IMVCommentRes } from '../../mvplay/mvplay.api';
import message from '@/utils/message';
import PlaylistFormDialog from '../components/playlist-form-dialog.vue';

const playListDetailService = usePlayListDetail();

const playlistId = Number(new URLSearchParams(window.location.search).get('id') || '0');

const playListDetail = ref<PD_IPlaylistDetail>({
  backgroundCoverUrl: '',
  bannedTrackIds: '',
  cloudTrackCount: '',
  commentCount: '',
  commentThreadId: '',
  copied: false,
  coverImgId: '',
  coverImgId_str: '',
  coverImgUrl: '',
  createTime: '',
  description: '',
  englishTitle: '',
  gradeStatus: '',
  highQuality: false,
  historySharedUsers: '',
  id: '',
  name: '',
  newImported: '',
  officialPlaylistType: '',
  opRecommend: '',
  ordered: '',
  playCount: '',
  privacy: '',
  remixVideo: '',
  score: '',
  shareCount: '',
  tags: [],
  titleImage: '',
  titleImageUrl: '',
  trackCount: '',
  tracks: [],
});
const musicList = ref<Common_IMusic[]>([]);
const commentRes = ref<MP_IMVCommentRes>({
  comments: [],
  hotComments: [],
});
const dynamic = ref<any>(null);

const addVisible = ref(false);
const addSongIds = ref('');
const adding = ref(false);
const editVisible = ref(false);

// 订阅歌单详情 / 评论 / 歌曲列表 / 动态，immediate 保证首屏同步到当前值
watch(playListDetailService.playListResult$, (v) => (playListDetail.value = v), { immediate: true });
watch(playListDetailService.playListCommentResult$, (v) => (commentRes.value = v), { immediate: true });
watch(
  playListDetailService.playListMusicListResult$,
  (v) => {
    musicList.value = v?.map((item) => {
      return {
        dt: item.dt,
        url: '',
        name: item.name,
        alName: item.alName,
        artist: item.artist,
        picUrl: item.picUrl,
        id: item.id,
      };
    });
  },
  { immediate: true },
);
watch(playListDetailService.dynamic$, (v) => (dynamic.value = v), { immediate: true });

const onToggleSubscribe = async () => {
  try {
    await playListDetailService.subscribe(playListDetailService.subscribed ? 2 : 1);
    message.success(playListDetailService.subscribed ? '收藏成功' : '已取消收藏');
  } catch {
    message.error('操作失败，请确认已登录');
  }
};

const onRemove = async (item: Common_IMusic) => {
  try {
    await playListDetailService.removeTrack(String(item.id));
    message.success('已移除');
  } catch {
    message.error('移除失败，请确认已登录');
  }
};

const onAddSong = async () => {
  const ids = addSongIds.value.trim();
  if (!ids) {
    message.error('请输入歌曲 ID');
    return;
  }
  adding.value = true;
  try {
    await playListDetailService.addTrack(ids);
    message.success('添加成功');
    addVisible.value = false;
    addSongIds.value = '';
  } catch {
    message.error('添加失败，请确认已登录');
  } finally {
    adding.value = false;
  }
};

const openEdit = () => {
  editVisible.value = true;
};

const onEdited = () => {
  playListDetailService.init();
};

const formatStat = (val?: number) => {
  if (val == null) return '0';
  if (val >= 10000) {
    return `${(val / 10000).toFixed(1)}万`;
  }
  return String(val);
};
</script>

<style scoped lang="less">
#playlist-detail {
  width: 100%;
  height: 100%;

  padding-top: 40px;

  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 56px;

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
