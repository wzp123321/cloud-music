<template>
  <!-- 6.3 歌单编辑：我的歌单取 id → 9 个 playlist_* 接口 -->
  <div class="user-supplement--panel">
    <p class="user-supplement--panel-tip">
      我的歌单列表（<code>/user/playlist</code>，上游 id 来源）点选后 id 自动填入下方 9 个
      <code>playlist_*</code> 接口；也可在共享输入框手填。8 个写操作均未登录降级 + 二次确认 +
      不自动调用。
    </p>

    <div class="user-supplement--grid">
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
import { computed, onMounted, ref } from 'vue';

import userSupplementService from '../user-supplement.service';
import {
  extractObj,
  pickPlaylistId,
  toList,
  useSupplementGuard,
  useWriteRunner,
  type SupplementCard,
} from '../use-supplement';

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

/** uid 输入框：读写都走父级，保证跨面板一致 */
const uidModel = computed({
  get: () => props.uid,
  set: (value: string) => emit('update:uid', value),
});

const myPlaylists = ref<SupplementCard[]>([]);
const playlistId = ref<string>('');
const playlistName = ref<string>('');
const playlistDesc = ref<string>('');
const playlistTags = ref<string>('');
const tracksOp = ref<string>('add');
const tracksIds = ref<string>('');
const orderIds = ref<string>('');
const privacyVal = ref<string>('0');
const coverFile = ref<File | null>(null);
const videoRecentList = ref<SupplementCard[]>([]);
const writeResult = ref<string>('');

const { requireLogin, writeGuard } = useSupplementGuard({
  hasLogin: () => props.hasLogin,
  setToast: (message) => emit('toast', message),
});
const runWrite = useWriteRunner(writeResult, writeGuard);

/** 上游列表来源：/user/playlist（id 来源，不计入接口清单统计） */
const loadMyPlaylists = async () => {
  if (!requireLogin()) return;
  try {
    const res = await userSupplementService.getMyPlaylists({
      uid: uidModel.value,
      limit: 30,
      offset: 0,
    });
    myPlaylists.value = toList(res);
    emit('toast', `我的歌单已加载 ${myPlaylists.value.length} 个`);
  } catch {
    myPlaylists.value = [];
    emit('toast', '接口请求失败，已返回空值');
  }
};

/** 点选歌单 → 回填 id，供下方 9 个 playlist_* 接口共用 */
const onPlaylistClick = (item: SupplementCard) => {
  const id = pickPlaylistId(item.raw) || item.id;
  if (!id) return;
  playlistId.value = String(id);
  emit('toast', `已选择歌单 id=${id}，可用于下方 9 个 playlist_* 接口`);
};

/** 6.3 九个 playlist_* 接口真实调用点 */
const doUpdatePlaylist = () =>
  runWrite('playlist_update 更新歌单', () =>
    userSupplementService.updatePlaylist({
      id: playlistId.value,
      name: playlistName.value,
      desc: playlistDesc.value,
      tags: playlistTags.value,
    }),
  );

const doPlaylistTracks = () =>
  runWrite('playlist_tracks 歌单歌曲增删', () =>
    userSupplementService.getPlaylistTracks({
      id: playlistId.value,
      pid: playlistId.value,
      op: tracksOp.value,
      tracks: tracksIds.value,
      ids: tracksIds.value,
    }),
  );

const doUpdatePlaycount = () =>
  runWrite('playlist_update_playcount 更新播放量', () =>
    userSupplementService.updatePlaylistPlaycount({ id: playlistId.value }),
  );

/** playlist_video_recent：只读调用点 */
const loadVideoRecent = async () => {
  try {
    const res = await userSupplementService.getPlaylistVideoRecent({ limit: 30 });
    videoRecentList.value = toList(res);
    emit('toast', `最近视频歌单已加载 ${videoRecentList.value.length} 条`);
  } catch {
    videoRecentList.value = [];
    emit('toast', '接口请求失败，已返回空值');
  }
};

/** playlist_cover_update：写操作 + postFormRequest 上传 */
const onCoverChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  coverFile.value = input.files?.[0] ?? null;
};

const doUpdateCover = async () => {
  const file = coverFile.value;
  if (!file) {
    emit('toast', '请先选择封面图片');
    return;
  }
  if (!writeGuard('确定上传并更新歌单封面吗？该操作会向服务端提交文件。')) return;
  try {
    const res = await userSupplementService.updatePlaylistCover(
      Number(playlistId.value) || 0,
      file,
    );
    const obj = extractObj(res);
    writeResult.value = `playlist_cover_update 已提交｜code=${obj.code ?? res?.code ?? '—'}｜${obj.message ?? res?.message ?? '无附加信息'}`;
  } catch {
    writeResult.value = 'playlist_cover_update 请求失败，已按空值处理';
  }
};

const doUpdateDesc = () =>
  runWrite('playlist_desc_update 更新描述', () =>
    userSupplementService.updatePlaylistDesc({ id: playlistId.value, desc: playlistDesc.value }),
  );

const doUpdateTags = () =>
  runWrite('playlist_tags_update 更新标签', () =>
    userSupplementService.updatePlaylistTags({ id: playlistId.value, tags: playlistTags.value }),
  );

const doUpdateOrder = () =>
  runWrite('playlist_order_update 调整顺序', () =>
    userSupplementService.updatePlaylistOrder({ ids: orderIds.value }),
  );

const doUpdatePrivacy = () =>
  runWrite('playlist_privacy 设置隐私', () =>
    userSupplementService.updatePlaylistPrivacy({
      id: playlistId.value,
      privacy: privacyVal.value,
    }),
  );

/** 进面板先拉一次我的歌单，便于直接点选 id */
onMounted(() => {
  loadMyPlaylists();
});
</script>
