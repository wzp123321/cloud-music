<template>
  <!-- 6.3 歌单编辑：我的歌单取 id → 9 个 playlist_* 接口 -->
  <div class="user-supplement--panel">
    <p class="user-supplement--panel-tip">
      我的歌单列表（<code>/user/playlist</code>，上游 id 来源）点选后 id 自动填入下方 9 个
      <code>playlist_*</code> 接口；也可在共享输入框手填。8 个写操作均未登录降级 + 二次确认 +
      不自动调用。
    </p>

    <div class="user-supplement--grid grid-cols-2">
      <section class="user-supplement--block user-supplement--block--wide">
        <h3 class="user-supplement--block-title">
          上游列表来源 · 我的歌单
          <code class="user-supplement--module">/user/playlist</code>（id 来源）
        </h3>
        <p v-if="!hasLogin" class="user-supplement--degrade">登录后可用（已降级，不发请求）</p>
        <div class="user-supplement--block-actions">
          <label class="user-supplement--inline-label">
            uid<input v-model="uidModel" placeholder="当前登录 uid，或手填" />
          </label>
          <button class="user-supplement--btn" @click="loadMyPlaylists">加载我的歌单</button>
          <span class="user-supplement--count">{{ myPlaylists.length }} 个歌单</span>
        </div>
        <div v-if="myPlaylists.length" class="user-supplement--list">
          <div
            v-for="(item, idx) in myPlaylists"
            :key="'pl_' + idx"
            class="user-supplement--item"
            @click="onPlaylistClick(item)"
          >
            <span class="user-supplement--item-title">{{ item.title }}</span>
            <span class="user-supplement--item-sub">{{ item.subtitle }}</span>
            <span v-if="item.id" class="user-supplement--item-id">id {{ item.id }}</span>
          </div>
        </div>
        <p v-else class="user-supplement--empty">暂无歌单（可在下方输入框手填歌单 id）</p>
      </section>

      <section class="user-supplement--block user-supplement--block--wide">
        <h3 class="user-supplement--block-title">共享参数 · 歌单 id（← 上方歌单点选，或手填）</h3>
        <div class="user-supplement--form">
          <label
            >歌单 id<input v-model="playlistId" placeholder="点选我的歌单自动填入，或手填"
          /></label>
        </div>
      </section>

      <section class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">playlist_update</code> 更新歌单（写）
        </h3>
        <div class="user-supplement--form">
          <label>名称 name<input v-model="playlistName" placeholder="歌单名" /></label>
          <label>描述 desc<input v-model="playlistDesc" placeholder="歌单描述" /></label>
          <label>标签 tags<input v-model="playlistTags" placeholder="逗号分隔" /></label>
          <button
            class="user-supplement--btn user-supplement--btn--write"
            @click="doUpdatePlaylist"
          >
            更新歌单
          </button>
        </div>
      </section>

      <section class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">playlist_tracks</code> 歌单歌曲增删（写）
        </h3>
        <div class="user-supplement--form">
          <label>操作 op<input v-model="tracksOp" placeholder="add / del" /></label>
          <label>歌曲 ids<input v-model="tracksIds" placeholder="歌曲 id，逗号分隔" /></label>
          <button
            class="user-supplement--btn user-supplement--btn--write"
            @click="doPlaylistTracks"
          >
            操作歌单歌曲
          </button>
        </div>
      </section>

      <section class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">playlist_update_playcount</code> 更新播放量（写）
        </h3>
        <div class="user-supplement--form">
          <button
            class="user-supplement--btn user-supplement--btn--write"
            @click="doUpdatePlaycount"
          >
            更新播放量
          </button>
        </div>
      </section>

      <section class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">playlist_video_recent</code> 最近视频歌单（只读）
        </h3>
        <div class="user-supplement--block-actions">
          <button class="user-supplement--btn" @click="loadVideoRecent">加载最近视频歌单</button>
          <span class="user-supplement--count">{{ videoRecentList.length }} 条</span>
        </div>
        <div v-if="videoRecentList.length" class="user-supplement--list">
          <div
            v-for="(item, idx) in videoRecentList"
            :key="'vr_' + idx"
            class="user-supplement--item"
          >
            <span class="user-supplement--item-title">{{ item.title }}</span>
            <span class="user-supplement--item-sub">{{ item.subtitle }}</span>
          </div>
        </div>
        <p v-else class="user-supplement--empty">暂无最近视频歌单</p>
      </section>

      <section class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">playlist_cover_update</code> 上传封面（写 / 上传）
        </h3>
        <div class="user-supplement--form">
          <label>封面图片<input type="file" accept="image/*" @change="onCoverChange" /></label>
          <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdateCover">
            上传并更新封面
          </button>
        </div>
      </section>

      <section class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">playlist_desc_update</code> 更新描述（写）
        </h3>
        <div class="user-supplement--form">
          <label>描述 desc<input v-model="playlistDesc" placeholder="与更新歌单共享描述" /></label>
          <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdateDesc">
            更新描述
          </button>
        </div>
      </section>

      <section class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">playlist_tags_update</code> 更新标签（写）
        </h3>
        <div class="user-supplement--form">
          <label>标签 tags<input v-model="playlistTags" placeholder="与更新歌单共享标签" /></label>
          <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdateTags">
            更新标签
          </button>
        </div>
      </section>

      <section class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">playlist_order_update</code> 调整歌单顺序（写）
        </h3>
        <div class="user-supplement--form">
          <label>顺序 ids<input v-model="orderIds" placeholder="歌单 id，逗号分隔" /></label>
          <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdateOrder">
            调整顺序
          </button>
        </div>
      </section>

      <section class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">playlist_privacy</code> 设置歌单隐私（写）
        </h3>
        <div class="user-supplement--form">
          <label>隐私 privacy<input v-model="privacyVal" placeholder="0 普通 / 10 隐私" /></label>
          <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdatePrivacy">
            设置隐私
          </button>
        </div>
      </section>
    </div>

    <div v-if="writeResult" class="user-supplement--result">{{ writeResult }}</div>
  </div>
</template>

<script setup lang="ts">
import { useSupplementPlaylistPanel } from './hooks/useSupplementPlaylistPanel';

const props = defineProps<{
  /** 登录态：未登录时列表降级、写操作不发请求 */
  hasLogin: boolean;
  /** 当前登录 uid，父级可回填 */
  uid: string;
}>();

const emit = defineEmits<{
  (e: 'toast', message: string): void;
  (e: 'update:uid', value: string): void;
}>();

const {
  uidModel,
  myPlaylists,
  playlistId,
  playlistName,
  playlistDesc,
  playlistTags,
  tracksOp,
  tracksIds,
  orderIds,
  privacyVal,
  videoRecentList,
  writeResult,
  loadMyPlaylists,
  onPlaylistClick,
  doUpdatePlaylist,
  doPlaylistTracks,
  doUpdatePlaycount,
  loadVideoRecent,
  onCoverChange,
  doUpdateCover,
  doUpdateDesc,
  doUpdateTags,
  doUpdateOrder,
  doUpdatePrivacy,
} = useSupplementPlaylistPanel({
  hasLogin: () => props.hasLogin,
  getUid: () => props.uid,
  setUid: (value) => emit('update:uid', value),
  setToast: (message) => emit('toast', message),
});
</script>
