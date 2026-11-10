<template>
  <div class="user-supplement">
    <cm-navbar :title="'用户资料 · 云盘 · 歌单编辑'" :hasLoadMore="false"></cm-navbar>

    <div class="user-supplement--loginbar" v-if="!hasLogin">
      当前未登录：<code>user_account</code> / <code>user_audio</code> / <code>user_dj</code> /
      <code>user_comment_history</code> 读取型接口已降级；全部写操作不可用
    </div>
    <div class="user-supplement--toast" v-if="toast" @click="clearToast">{{ toast }}（点击关闭）</div>

    <div class="user-supplement--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['user-supplement--tab', activeTab === tab.code ? 'active' : '']"
        @click="activeTab = tab.code"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- ==================== 6.1 用户补充 ==================== -->
    <div v-if="activeTab === 'c6_1'" class="user-supplement--panel">
      <p class="user-supplement--panel-tip">
        4 个需登录只读接口按接口分区；<code>user_replacephone</code> 为写操作（未登录不发请求 + 二次确认）。
      </p>

      <div class="user-supplement--grid">
        <section v-for="block in readBlocks" :key="block.code" class="user-supplement--block">
          <h3 class="user-supplement--block-title">
            <code class="user-supplement--module">{{ block.module }}</code> {{ block.name }}
          </h3>
          <p class="user-supplement--degrade" v-if="!hasLogin">登录后可用（已降级，不发请求）</p>
          <div class="user-supplement--block-actions">
            <button class="user-supplement--btn" @click="loadRead(block.code)">加载{{ block.name }}</button>
            <span class="user-supplement--count">{{ readLists[block.code].length }} 条</span>
          </div>
          <div class="user-supplement--list" v-if="readLists[block.code].length">
            <div v-for="(item, idx) in readLists[block.code]" :key="block.code + '_' + idx" class="user-supplement--item">
              <span class="user-supplement--item-title">{{ item.title }}</span>
              <span class="user-supplement--item-sub">{{ item.subtitle }}</span>
              <span class="user-supplement--item-id" v-if="item.id">#{{ item.id }}</span>
            </div>
          </div>
          <p class="user-supplement--empty" v-else>暂无数据或接口返回为空</p>
        </section>

        <section class="user-supplement--block user-supplement--block--wide">
          <h3 class="user-supplement--block-title">
            <code class="user-supplement--module">user_replacephone</code> 换绑手机（写操作）
          </h3>
          <div class="user-supplement--form">
            <label>新手机号 phone<input v-model="phone" placeholder="新手机号" /></label>
            <label>验证码 captcha<input v-model="captcha" placeholder="新手机验证码" /></label>
            <label>旧验证码 oldcaptcha<input v-model="oldcaptcha" placeholder="原手机验证码（可选）" /></label>
            <label>区号 countrycode<input v-model="countrycode" placeholder="如 86" /></label>
            <button class="user-supplement--btn user-supplement--btn--write" @click="doReplacePhone">换绑手机</button>
          </div>
        </section>
      </div>

      <div class="user-supplement--result" v-if="writeResult">{{ writeResult }}</div>
    </div>

    <!-- ==================== 6.2 云盘 ==================== -->
    <div v-if="activeTab === 'c6_2'" class="user-supplement--panel">
      <p class="user-supplement--panel-tip">
        云盘列表（<code>/user/cloud</code>，上游 id 来源）点选后 songId 自动填入
        <code>user_cloud_detail</code> 与 <code>user_cloud_del</code>；也可手填。
      </p>

      <div class="user-supplement--grid">
        <section class="user-supplement--block user-supplement--block--wide">
          <h3 class="user-supplement--block-title">
            上游列表来源 · 我的云盘 <code class="user-supplement--module">/user/cloud</code>（songId 来源）
          </h3>
          <p class="user-supplement--degrade" v-if="!hasLogin">登录后可用（已降级，不发请求）</p>
          <div class="user-supplement--block-actions">
            <button class="user-supplement--btn" @click="loadCloudList">加载我的云盘</button>
            <span class="user-supplement--count">{{ cloudList.length }} 个文件</span>
          </div>
          <div class="user-supplement--list" v-if="cloudList.length">
            <div
              v-for="(item, idx) in cloudList"
              :key="'cloud_' + idx"
              class="user-supplement--item"
              @click="onCloudClick(item)"
            >
              <span class="user-supplement--item-title">{{ item.title }}</span>
              <span class="user-supplement--item-sub">{{ item.subtitle }}</span>
              <span class="user-supplement--item-id" v-if="item.id">songId {{ item.id }}</span>
            </div>
          </div>
          <p class="user-supplement--empty" v-else>云盘暂无文件（可在下方输入框手填 songId）</p>
        </section>

        <section class="user-supplement--block">
          <h3 class="user-supplement--block-title">
            <code class="user-supplement--module">user_cloud_detail</code> 云盘歌曲详情（songId ← 云盘点选或手填）
          </h3>
          <div class="user-supplement--form">
            <label>songId<input v-model="cloudSongId" placeholder="点选上方云盘文件自动填入，或手填" /></label>
            <button class="user-supplement--btn" @click="loadCloudDetail">查看云盘详情</button>
          </div>
          <div class="user-supplement--list" v-if="cloudDetailList.length">
            <div v-for="(item, idx) in cloudDetailList" :key="'cd_' + idx" class="user-supplement--item">
              <span class="user-supplement--item-title">{{ item.title }}</span>
              <span class="user-supplement--item-sub">{{ item.subtitle }}</span>
            </div>
          </div>
          <p class="user-supplement--empty" v-else>暂无云盘详情</p>
        </section>

        <section class="user-supplement--block">
          <h3 class="user-supplement--block-title">
            <code class="user-supplement--module">user_cloud_del</code> 删除云盘歌曲（写操作）
          </h3>
          <div class="user-supplement--form">
            <label>songId<input v-model="cloudSongId" placeholder="与详情共享 songId" /></label>
            <button class="user-supplement--btn user-supplement--btn--write" @click="doDelCloud">删除云盘歌曲</button>
          </div>
        </section>
      </div>

      <div class="user-supplement--result" v-if="writeResult">{{ writeResult }}</div>
    </div>

    <!-- ==================== 6.3 歌单编辑 ==================== -->
    <div v-if="activeTab === 'c6_3'" class="user-supplement--panel">
      <p class="user-supplement--panel-tip">
        我的歌单列表（<code>/user/playlist</code>，上游 id 来源）点选后 id 自动填入下方 9 个
        <code>playlist_*</code> 接口；也可在共享输入框手填。8 个写操作均未登录降级 + 二次确认 + 不自动调用。
      </p>

      <div class="user-supplement--grid">
        <section class="user-supplement--block user-supplement--block--wide">
          <h3 class="user-supplement--block-title">
            上游列表来源 · 我的歌单 <code class="user-supplement--module">/user/playlist</code>（id 来源）
          </h3>
          <p class="user-supplement--degrade" v-if="!hasLogin">登录后可用（已降级，不发请求）</p>
          <div class="user-supplement--block-actions">
            <label class="user-supplement--inline-label">
              uid<input v-model="uid" placeholder="当前登录 uid，或手填" />
            </label>
            <button class="user-supplement--btn" @click="loadMyPlaylists">加载我的歌单</button>
            <span class="user-supplement--count">{{ myPlaylists.length }} 个歌单</span>
          </div>
          <div class="user-supplement--list" v-if="myPlaylists.length">
            <div
              v-for="(item, idx) in myPlaylists"
              :key="'pl_' + idx"
              class="user-supplement--item"
              @click="onPlaylistClick(item)"
            >
              <span class="user-supplement--item-title">{{ item.title }}</span>
              <span class="user-supplement--item-sub">{{ item.subtitle }}</span>
              <span class="user-supplement--item-id" v-if="item.id">id {{ item.id }}</span>
            </div>
          </div>
          <p class="user-supplement--empty" v-else>暂无歌单（可在下方输入框手填歌单 id）</p>
        </section>

        <section class="user-supplement--block user-supplement--block--wide">
          <h3 class="user-supplement--block-title">共享参数 · 歌单 id（← 上方歌单点选，或手填）</h3>
          <div class="user-supplement--form">
            <label>歌单 id<input v-model="playlistId" placeholder="点选我的歌单自动填入，或手填" /></label>
          </div>
        </section>

        <section class="user-supplement--block">
          <h3 class="user-supplement--block-title"><code class="user-supplement--module">playlist_update</code> 更新歌单（写）</h3>
          <div class="user-supplement--form">
            <label>名称 name<input v-model="playlistName" placeholder="歌单名" /></label>
            <label>描述 desc<input v-model="playlistDesc" placeholder="歌单描述" /></label>
            <label>标签 tags<input v-model="playlistTags" placeholder="逗号分隔" /></label>
            <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdatePlaylist">更新歌单</button>
          </div>
        </section>

        <section class="user-supplement--block">
          <h3 class="user-supplement--block-title"><code class="user-supplement--module">playlist_tracks</code> 歌单歌曲增删（写）</h3>
          <div class="user-supplement--form">
            <label>操作 op<input v-model="tracksOp" placeholder="add / del" /></label>
            <label>歌曲 ids<input v-model="tracksIds" placeholder="歌曲 id，逗号分隔" /></label>
            <button class="user-supplement--btn user-supplement--btn--write" @click="doPlaylistTracks">操作歌单歌曲</button>
          </div>
        </section>

        <section class="user-supplement--block">
          <h3 class="user-supplement--block-title"><code class="user-supplement--module">playlist_update_playcount</code> 更新播放量（写）</h3>
          <div class="user-supplement--form">
            <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdatePlaycount">更新播放量</button>
          </div>
        </section>

        <section class="user-supplement--block">
          <h3 class="user-supplement--block-title"><code class="user-supplement--module">playlist_video_recent</code> 最近视频歌单（只读）</h3>
          <div class="user-supplement--block-actions">
            <button class="user-supplement--btn" @click="loadVideoRecent">加载最近视频歌单</button>
            <span class="user-supplement--count">{{ videoRecentList.length }} 条</span>
          </div>
          <div class="user-supplement--list" v-if="videoRecentList.length">
            <div v-for="(item, idx) in videoRecentList" :key="'vr_' + idx" class="user-supplement--item">
              <span class="user-supplement--item-title">{{ item.title }}</span>
              <span class="user-supplement--item-sub">{{ item.subtitle }}</span>
            </div>
          </div>
          <p class="user-supplement--empty" v-else>暂无最近视频歌单</p>
        </section>

        <section class="user-supplement--block">
          <h3 class="user-supplement--block-title"><code class="user-supplement--module">playlist_cover_update</code> 上传封面（写 / 上传）</h3>
          <div class="user-supplement--form">
            <label>封面图片<input type="file" accept="image/*" @change="onCoverChange" /></label>
            <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdateCover">上传并更新封面</button>
          </div>
        </section>

        <section class="user-supplement--block">
          <h3 class="user-supplement--block-title"><code class="user-supplement--module">playlist_desc_update</code> 更新描述（写）</h3>
          <div class="user-supplement--form">
            <label>描述 desc<input v-model="playlistDesc" placeholder="与更新歌单共享描述" /></label>
            <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdateDesc">更新描述</button>
          </div>
        </section>

        <section class="user-supplement--block">
          <h3 class="user-supplement--block-title"><code class="user-supplement--module">playlist_tags_update</code> 更新标签（写）</h3>
          <div class="user-supplement--form">
            <label>标签 tags<input v-model="playlistTags" placeholder="与更新歌单共享标签" /></label>
            <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdateTags">更新标签</button>
          </div>
        </section>

        <section class="user-supplement--block">
          <h3 class="user-supplement--block-title"><code class="user-supplement--module">playlist_order_update</code> 调整歌单顺序（写）</h3>
          <div class="user-supplement--form">
            <label>顺序 ids<input v-model="orderIds" placeholder="歌单 id，逗号分隔" /></label>
            <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdateOrder">调整顺序</button>
          </div>
        </section>

        <section class="user-supplement--block">
          <h3 class="user-supplement--block-title"><code class="user-supplement--module">playlist_privacy</code> 设置歌单隐私（写）</h3>
          <div class="user-supplement--form">
            <label>隐私 privacy<input v-model="privacyVal" placeholder="0 普通 / 10 隐私" /></label>
            <button class="user-supplement--btn user-supplement--btn--write" @click="doUpdatePrivacy">设置隐私</button>
          </div>
        </section>
      </div>

      <div class="user-supplement--result" v-if="writeResult">{{ writeResult }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import { FGetCookie } from '@/core/token';
import { hasLogin as checkLogin } from '@/services/content-enhance.service';
import userSupplementService from './user-supplement.service';

interface CardItem {
  id: number;
  title: string;
  cover: string;
  subtitle: string;
  raw: any;
}

/** 与 api-inventory-plain.md「P1 用户与歌单补充」6.1~6.3 一一对应 */
const tabs = [
  { code: 'c6_1', name: '6.1 用户补充（5）' },
  { code: 'c6_2', name: '6.2 云盘（2）' },
  { code: 'c6_3', name: '6.3 歌单编辑（9）' },
];

/** 6.1 四个需登录只读区块 */
const readBlocks = [
  { code: 'account', module: 'user_account', name: '账户信息' },
  { code: 'audio', module: 'user_audio', name: '音频足迹' },
  { code: 'dj', module: 'user_dj', name: '电台足迹' },
  { code: 'commentHistory', module: 'user_comment_history', name: '评论历史' },
];

const resolveUid = (): number => {
  try {
    const raw = FGetCookie('cloud-userInfo');
    return raw ? (JSON.parse(raw)?.profile?.userId ?? 0) : 0;
  } catch (error) {
    return 0;
  }
};

const hasLogin = ref<boolean>(checkLogin());
const activeTab = ref<string>('c6_1');
const toast = ref<string>('');
const writeResult = ref<string>('');
const uid = ref<string>(String(resolveUid() || ''));

const readLists = reactive<Record<string, CardItem[]>>({
  account: [],
  audio: [],
  dj: [],
  commentHistory: [],
});

const phone = ref<string>('');
const captcha = ref<string>('');
const oldcaptcha = ref<string>('');
const countrycode = ref<string>('86');

const cloudList = ref<CardItem[]>([]);
const cloudSongId = ref<string>('');
const cloudDetailList = ref<CardItem[]>([]);

const myPlaylists = ref<CardItem[]>([]);
const playlistId = ref<string>('');
const playlistName = ref<string>('');
const playlistDesc = ref<string>('');
const playlistTags = ref<string>('');
const tracksOp = ref<string>('add');
const tracksIds = ref<string>('');
const orderIds = ref<string>('');
const privacyVal = ref<string>('0');
const coverFile = ref<File | null>(null);
const videoRecentList = ref<CardItem[]>([]);

const clearToast = () => {
  toast.value = '';
};

/** 兼容 res.data / res.result / res.list / res.playlist / res.xxx / res.data.list 等多种结构 */
const extractList = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const candidates = [
    res.data, res.result, res.list, res.playlist, res.playlists, res.songs,
    res.records, res.events, res.comments, res.videos, res.albums,
    res.data?.list, res.result?.list, res.data?.data, res.data?.records,
    res.data?.playlist, res.data?.songs,
  ];
  for (const item of candidates) {
    if (Array.isArray(item)) return item;
  }
  for (const key of Object.keys(res)) {
    if (Array.isArray(res[key])) return res[key];
  }
  return [];
};

const extractObj = (res: any): Record<string, any> => {
  if (!res) return {};
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  if (res.result && typeof res.result === 'object' && !Array.isArray(res.result)) return res.result;
  return res;
};

const toCard = (raw: any): CardItem => {
  const r = raw || {};
  const id = Number(r.id ?? r.songId ?? r.playlistId ?? r.uid ?? r.userId ?? r.commentId ?? 0) || 0;
  const title = String(r.title ?? r.name ?? r.songName ?? r.nickname ?? r.content ?? r.msg ?? '未命名');
  const cover = String(r.cover ?? r.coverUrl ?? r.picUrl ?? r.avatarUrl ?? r.coverImgUrl ?? r.imgUrl ?? '');
  const subtitle = String(
    r.subtitle ?? r.artist ?? r.album ?? r.desc ?? r.description ?? r.creator?.nickname ?? r.user?.nickname ?? '',
  );
  return { id, title, cover, subtitle, raw: r };
};

/** 列表型归一；详情型对象包成一条卡片，保证有内容可展示 */
const toList = (res: any): CardItem[] => {
  const list = extractList(res);
  if (list.length) return list.map(toCard);
  const obj = extractObj(res);
  if (obj && Object.keys(obj).length) {
    return [toCard({ ...obj, title: obj.title ?? obj.name ?? obj.content ?? `响应 code=${obj.code ?? '—'}` })];
  }
  return [];
};

const pickSongId = (raw: any): number => {
  const r = raw || {};
  return Number(r.songId ?? r.id ?? r.songid ?? 0) || 0;
};

const pickPlaylistId = (raw: any): number => {
  const r = raw || {};
  return Number(r.id ?? r.playlistId ?? 0) || 0;
};

/** 需登录只读：未登录降级提示，不请求 */
const requireLogin = (): boolean => {
  if (!hasLogin.value) {
    toast.value = '该接口需要登录后才能查看（已降级，不发请求）';
    return false;
  }
  return true;
};

/** 写操作：未登录降级不发请求 + 二次确认 */
const writeGuard = (confirmText: string): boolean => {
  if (!hasLogin.value) {
    toast.value = '请先登录后再执行该写操作（已降级，不发请求）';
    return false;
  }
  if (!window.confirm(confirmText)) {
    toast.value = '已取消操作';
    return false;
  }
  return true;
};

const runWrite = async (label: string, fn: () => Promise<any>) => {
  if (!writeGuard(`确定执行「${label}」吗？该操作会向服务端提交数据。`)) return;
  try {
    const res = await fn();
    const obj = extractObj(res);
    writeResult.value = `${label} 已提交｜code=${obj.code ?? res?.code ?? '—'}｜${obj.message ?? res?.message ?? '无附加信息'}`;
  } catch (error) {
    writeResult.value = `${label} 请求失败，已按空值处理`;
  }
};

/** 6.1 四个只读接口真实调用点（需登录降级） */
const loadRead = async (code: string) => {
  if (!requireLogin()) return;
  try {
    let res: any = null;
    switch (code) {
      case 'account':
        res = await userSupplementService.getUserAccount();
        break;
      case 'audio':
        res = await userSupplementService.getUserAudio({ limit: 30 });
        break;
      case 'dj':
        res = await userSupplementService.getUserDj({ limit: 30 });
        break;
      case 'commentHistory':
        res = await userSupplementService.getUserCommentHistory({ limit: 30, uid: uid.value });
        break;
      default:
        res = null;
    }
    readLists[code] = toList(res);
    toast.value = `${code} 已加载 ${readLists[code].length} 条`;
  } catch (error) {
    readLists[code] = [];
    toast.value = '接口请求失败，已返回空值';
  }
};

/** 6.1 user_replacephone 写操作调用点 */
const doReplacePhone = () =>
  runWrite('user_replacephone 换绑手机', () =>
    userSupplementService.replacePhone({
      phone: phone.value,
      captcha: captcha.value,
      oldcaptcha: oldcaptcha.value,
      countrycode: countrycode.value,
    }));

/** 上游列表来源：/user/cloud（songId 来源，不计入 16 个接口） */
const loadCloudList = async () => {
  if (!requireLogin()) return;
  try {
    const res = await userSupplementService.getCloudList({ limit: 30 });
    cloudList.value = toList(res);
    toast.value = `云盘已加载 ${cloudList.value.length} 个文件`;
  } catch (error) {
    cloudList.value = [];
    toast.value = '接口请求失败，已返回空值';
  }
};

/** 上游列表来源：/user/playlist（id 来源，不计入 16 个接口） */
const loadMyPlaylists = async () => {
  if (!requireLogin()) return;
  try {
    const res = await userSupplementService.getMyPlaylists({ uid: uid.value, limit: 30, offset: 0 });
    myPlaylists.value = toList(res);
    toast.value = `我的歌单已加载 ${myPlaylists.value.length} 个`;
  } catch (error) {
    myPlaylists.value = [];
    toast.value = '接口请求失败，已返回空值';
  }
};

/** 列表 → 下游接口参数来源 */
const onCloudClick = (item: CardItem) => {
  const songId = pickSongId(item.raw) || item.id;
  if (!songId) return;
  cloudSongId.value = String(songId);
  toast.value = `已选择云盘文件 songId=${songId}，可用于 user_cloud_detail / user_cloud_del`;
};

const onPlaylistClick = (item: CardItem) => {
  const id = pickPlaylistId(item.raw) || item.id;
  if (!id) return;
  playlistId.value = String(id);
  toast.value = `已选择歌单 id=${id}，可用于下方 9 个 playlist_* 接口`;
};

/** 6.2 user_cloud_detail 调用点（songId ← 云盘点选或输入） */
const loadCloudDetail = async () => {
  try {
    const res = await userSupplementService.getUserCloudDetail({
      songId: cloudSongId.value,
      id: cloudSongId.value,
    });
    cloudDetailList.value = toList(res);
    toast.value = `云盘详情已加载 ${cloudDetailList.value.length} 条`;
  } catch (error) {
    cloudDetailList.value = [];
    toast.value = '接口请求失败，已返回空值';
  }
};

/** 6.2 user_cloud_del 写操作调用点 */
const doDelCloud = () =>
  runWrite('user_cloud_del 删除云盘歌曲', () =>
    userSupplementService.delUserCloud({ songId: cloudSongId.value, id: cloudSongId.value }));

/** 6.3 九个 playlist_* 接口真实调用点 */
const doUpdatePlaylist = () =>
  runWrite('playlist_update 更新歌单', () =>
    userSupplementService.updatePlaylist({
      id: playlistId.value,
      name: playlistName.value,
      desc: playlistDesc.value,
      tags: playlistTags.value,
    }));

const doPlaylistTracks = () =>
  runWrite('playlist_tracks 歌单歌曲增删', () =>
    userSupplementService.getPlaylistTracks({
      id: playlistId.value,
      pid: playlistId.value,
      op: tracksOp.value,
      tracks: tracksIds.value,
      ids: tracksIds.value,
    }));

const doUpdatePlaycount = () =>
  runWrite('playlist_update_playcount 更新播放量', () =>
    userSupplementService.updatePlaylistPlaycount({ id: playlistId.value }));

/** playlist_video_recent：只读调用点 */
const loadVideoRecent = async () => {
  try {
    const res = await userSupplementService.getPlaylistVideoRecent({ limit: 30 });
    videoRecentList.value = toList(res);
    toast.value = `最近视频歌单已加载 ${videoRecentList.value.length} 条`;
  } catch (error) {
    videoRecentList.value = [];
    toast.value = '接口请求失败，已返回空值';
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
    toast.value = '请先选择封面图片';
    return;
  }
  if (!writeGuard('确定上传并更新歌单封面吗？该操作会向服务端提交文件。')) return;
  try {
    const res = await userSupplementService.updatePlaylistCover(Number(playlistId.value) || 0, file);
    const obj = extractObj(res);
    writeResult.value = `playlist_cover_update 已提交｜code=${obj.code ?? res?.code ?? '—'}｜${obj.message ?? res?.message ?? '无附加信息'}`;
  } catch (error) {
    writeResult.value = 'playlist_cover_update 请求失败，已按空值处理';
  }
};

const doUpdateDesc = () =>
  runWrite('playlist_desc_update 更新描述', () =>
    userSupplementService.updatePlaylistDesc({ id: playlistId.value, desc: playlistDesc.value }));

const doUpdateTags = () =>
  runWrite('playlist_tags_update 更新标签', () =>
    userSupplementService.updatePlaylistTags({ id: playlistId.value, tags: playlistTags.value }));

const doUpdateOrder = () =>
  runWrite('playlist_order_update 调整顺序', () =>
    userSupplementService.updatePlaylistOrder({ ids: orderIds.value }));

const doUpdatePrivacy = () =>
  runWrite('playlist_privacy 设置隐私', () =>
    userSupplementService.updatePlaylistPrivacy({ id: playlistId.value, privacy: privacyVal.value }));

/** 仅加载读取型上游列表（辅助取 id）；写操作绝不在此调用 */
onMounted(() => {
  loadCloudList();
  loadMyPlaylists();
});
</script>

<style scoped lang="less">
.user-supplement {
  width: 1400px;
  margin: 0 auto;
  padding: 24px 0 48px;

  code {
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(194, 12, 12, 0.08);
    color: var(--color-primary, #c20c0c);
    font-size: 12px;
  }

  &--loginbar {
    margin-top: 18px;
    padding: 12px 18px;
    border-radius: 8px;
    background: #fff7e6;
    color: #ad6800;
    font-size: 13px;
    line-height: 1.7;
  }

  &--toast {
    margin-top: 12px;
    padding: 10px 16px;
    border-radius: 6px;
    background: #f0f7ff;
    color: #31708f;
    font-size: 13px;
    cursor: pointer;
  }

  &--tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
  }

  &--tab {
    padding: 8px 18px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 18px;
    background: var(--color-default, #fff);
    color: #666;
    font-size: 14px;
    cursor: pointer;

    &.active {
      border-color: var(--color-primary, #c20c0c);
      color: var(--color-primary, #c20c0c);
      background: rgba(194, 12, 12, 0.06);
    }
  }

  &--panel {
    margin-top: 22px;
  }

  &--panel-tip {
    margin-bottom: 16px;
    color: #999;
    font-size: 13px;
    line-height: 1.7;
  }

  &--grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  &--block {
    padding: 16px 20px;
    border-radius: 8px;
    background: var(--color-default, #fff);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  &--block--wide {
    grid-column: 1 / -1;
  }

  &--block-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }

  &--module {
    margin-right: 6px;
  }

  &--degrade {
    margin-top: 8px;
    color: #d48806;
    font-size: 12px;
  }

  &--block-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin: 12px 0;
  }

  &--inline-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    font-size: 13px;

    input {
      width: 180px;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      outline: none;

      &:focus {
        border-color: var(--color-primary, #c20c0c);
      }
    }
  }

  &--count {
    color: #999;
    font-size: 12px;
  }

  &--btn {
    padding: 7px 16px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 16px;
    background: var(--color-default, #fff);
    color: #444;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      border-color: var(--color-primary, #c20c0c);
      color: var(--color-primary, #c20c0c);
    }
  }

  &--btn--write {
    border-color: var(--color-primary, #c20c0c);
    color: var(--color-primary, #c20c0c);
  }

  &--form {
    margin-top: 12px;

    label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      color: #666;
      font-size: 13px;
      white-space: nowrap;
    }

    input {
      flex: 1;
      min-width: 0;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      outline: none;

      &:focus {
        border-color: var(--color-primary, #c20c0c);
      }
    }

    input[type='file'] {
      padding: 4px 0;
      border: none;
    }
  }

  &--list {
    margin-top: 10px;
    max-height: 240px;
    overflow-y: auto;
  }

  &--item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 6px;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;

    &:hover {
      background: #fafafa;
    }
  }

  &--item-title {
    flex: 1;
    color: #333;
    font-size: 13px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--item-sub,
  &--item-id {
    color: #aaa;
    font-size: 12px;
    white-space: nowrap;
  }

  &--empty {
    margin-top: 10px;
    color: #bbb;
    font-size: 12px;
  }

  &--result {
    margin-top: 20px;
    padding: 12px 18px;
    border-radius: 8px;
    background: #f6ffed;
    color: #389e0d;
    font-size: 13px;
  }
}
</style>
