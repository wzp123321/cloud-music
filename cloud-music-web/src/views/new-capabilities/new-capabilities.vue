<template>
  <div class="new-capabilities">
    <cm-navbar :title="'新接口能力'" :has-load-more="false"></cm-navbar>

    <header class="new-capabilities--header">
      <p class="new-capabilities--intro">
        本页把 server 新增对齐的 38 个接口接成可直接使用的业务能力，按场景组织。
        每条能力都有固定语义的输入与结果摘要，写操作需二次确认；登录凭证由请求层自动注入。
      </p>
      <div class="new-capabilities--stats">
        <span><b>{{ sections.length }}</b> 个场景</span>
        <span><b>{{ actionCount }}</b> 个接口能力</span>
        <span><b>{{ writeCount }}</b> 个写操作</span>
      </div>
    </header>

    <section v-for="section in sections" :key="section.title" class="new-capabilities--section">
      <div class="new-capabilities--section-head">
        <h3>{{ section.title }}</h3>
        <p>{{ section.desc }}</p>
      </div>

      <div class="new-capabilities--grid">
        <article v-for="action in section.actions" :key="action.key" class="new-capabilities--card">
          <div class="new-capabilities--card-head">
            <h5>{{ action.name }}</h5>
            <code>{{ action.api }}</code>
          </div>
          <p class="new-capabilities--desc">{{ action.desc }}</p>

          <div v-if="action.fields?.length" class="new-capabilities--fields">
            <label v-for="field in action.fields" :key="field.name" class="new-capabilities--field">
              <span>{{ field.label }}<i v-if="field.required">必填</i></span>
              <input
                v-model="values[action.key][field.name]"
                type="text"
                :placeholder="field.placeholder || '可选'"
              />
            </label>
          </div>

          <div class="new-capabilities--card-actions">
            <button
              :disabled="results[action.key]?.loading"
              @click="run(action)"
            >
              {{ results[action.key]?.loading ? '请求中…' : action.write ? '确认执行' : '查询' }}
            </button>
            <span v-if="action.write" class="new-capabilities--warn">写操作 · 二次确认</span>
          </div>

          <div v-if="results[action.key]" class="new-capabilities--result" :class="{ 'is-error': results[action.key].error }">
            <ul v-if="results[action.key].summary.length" class="new-capabilities--summary">
              <li v-for="(line, idx) in results[action.key].summary" :key="idx">{{ line }}</li>
            </ul>
            <p v-else-if="!results[action.key].loading">{{ results[action.key].text }}</p>
            <button class="new-capabilities--raw-toggle" @click="toggleRaw(action.key)">
              {{ showRaw[action.key] ? '收起原始返回' : '查看原始返回' }}
            </button>
            <pre v-if="showRaw[action.key]">{{ results[action.key].text }}</pre>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

import {
  highValueService,
  type HV_Result,
} from '@/apis/server-coverage/high-value.service';

interface Field {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

interface Action {
  key: string;
  name: string;
  api: string;
  desc: string;
  fields?: Field[];
  write?: boolean;
  run: (v: Record<string, string>) => Promise<HV_Result | null>;
}

interface Section {
  title: string;
  desc: string;
  actions: Action[];
}

const svc = highValueService;
const songField: Field = { name: 'id', label: '歌曲 ID', placeholder: '如 323083', required: true };
const idField: Field = { name: 'id', label: '资源 ID', placeholder: '如 123456', required: true };
const uidField: Field = { name: 'uid', label: '用户 ID', placeholder: '如 18137627056', required: true };
const keywordField: Field = { name: 'keyword', label: '关键词', placeholder: '如 晴天', required: true };

const sections: Section[] = [
  {
    title: '搜索增强',
    desc: '歌词检索、联想、元数据匹配与翻页',
    actions: [
      { key: 'searchLyric', name: '歌词搜索', api: 'GET /search/lyric', desc: '按歌词片段找歌，返回命中歌词', fields: [keywordField, { name: 'limit', label: '条数', placeholder: '默认 30' }], run: (v) => svc.search.lyric(v.keyword, Number(v.limit) || 30) },
      { key: 'searchMatch', name: '歌曲元数据匹配', api: 'GET /search/match', desc: '按标题 / 专辑 / 歌手匹配同一首歌', fields: [{ name: 'title', label: '歌名', required: true }, { name: 'artist', label: '歌手' }, { name: 'album', label: '专辑' }], run: (v) => svc.search.match({ title: v.title, artist: v.artist, album: v.album }) },
      { key: 'suggestPc', name: 'PC 搜索联想', api: 'GET /search/suggest/pc', desc: '输入关键词返回联想词', fields: [keywordField], run: (v) => svc.search.suggestPc(v.keyword) },
      { key: 'suggestMobile', name: '移动端搜索联想', api: 'GET /search/suggest/mobile', desc: '移动端联想词接口', fields: [keywordField], run: (v) => svc.search.suggestMobile(v.keyword) },
      { key: 'songPage', name: '歌曲搜索分页', api: 'GET /search/song/list/page', desc: '按页拉取歌曲搜索结果', fields: [keywordField, { name: 'limit', label: '每页条数', placeholder: '默认 30' }, { name: 'offset', label: '偏移量', placeholder: '默认 0' }], run: (v) => svc.search.songPage(v.keyword, Number(v.limit) || 30, Number(v.offset) || 0) },
    ],
  },
  {
    title: '歌曲互动',
    desc: '红心、状态、下载与歌曲知识',
    actions: [
      { key: 'songLike', name: '加入 / 取消红心', api: 'POST /song/like', desc: '把歌曲加入或移出我喜欢的音乐', fields: [songField, { name: 'like', label: '状态', placeholder: 'true / false，默认 true' }], write: true, run: (v) => svc.song.like(v.id, v.like !== 'false') },
      { key: 'songLikeCheck', name: '批量红心状态', api: 'GET /song/like/check', desc: '查询多首歌是否已红心，逗号分隔', fields: [{ name: 'ids', label: '歌曲 ID 列表', placeholder: '323083,347230', required: true }], run: (v) => svc.song.likeCheck(v.ids) },
      { key: 'songDownload', name: '歌曲下载直链', api: 'GET /song/download/url/v1', desc: '按音质获取下载直链（受版权与登录态限制）', fields: [songField, { name: 'level', label: '音质', placeholder: 'lossless / hires / exhigh' }], run: (v) => svc.song.downloadUrl(v.id, v.level || 'lossless') },
      { key: 'songSimi', name: '相似歌曲', api: 'GET /song/simi/get', desc: '与该歌曲风格相近的推荐', fields: [songField], run: (v) => svc.song.simi(v.id) },
      { key: 'songWiki', name: '歌曲百科', api: 'GET /song/wiki/info', desc: '歌曲背景、创作与相关知识', fields: [songField], run: (v) => svc.song.wiki(v.id) },
      { key: 'songRedCount', name: '红心数量', api: 'GET /song/red/count', desc: '该歌曲被标红心的次数', fields: [songField], run: (v) => svc.song.redCount(v.id) },
    ],
  },
  {
    title: '评论',
    desc: '举报、评论信息与热评墙',
    actions: [
      { key: 'commentReport', name: '举报评论', api: 'POST /comment/report', desc: '按资源 ID + 评论 ID 举报违规评论', fields: [{ name: 'id', label: '资源 ID', required: true }, { name: 'cid', label: '评论 ID', required: true }, { name: 'reason', label: '原因码', placeholder: '默认 0' }], write: true, run: (v) => svc.comment.report(v.id, v.cid, v.reason || '0') },
      { key: 'commentInfo', name: '评论信息列表', api: 'GET /comment/info/list', desc: '按评论 ID 批量取评论详情', fields: [{ name: 'ids', label: '评论 ID 列表' }, { name: 'type', label: '资源类型', placeholder: '0 歌曲 / 1 MV / 2 歌单' }], run: (v) => svc.comment.infoList({ ids: v.ids, type: v.type }) },
      { key: 'commentHotwall', name: '热评墙广场', api: 'GET /comment/hotwall/square/info', desc: '热门评论墙内容', fields: [], run: () => svc.comment.hotwall() },
    ],
  },
  {
    title: '歌单',
    desc: '删除、订阅者、分类与相关推荐',
    actions: [
      { key: 'playlistDelete', name: '删除歌单', api: 'POST /playlist/delete', desc: '删除自己创建的歌单', fields: [idField], write: true, run: (v) => svc.playlist.remove(v.id) },
      { key: 'playlistSubscribers', name: '歌单订阅者', api: 'GET /playlist/subscribers', desc: '查看收藏该歌单的用户', fields: [idField, { name: 'limit', label: '条数', placeholder: '默认 20' }], run: (v) => svc.playlist.subscribers(v.id, Number(v.limit) || 20) },
      { key: 'playlistCategories', name: '歌单分类', api: 'GET /playlist/category/list', desc: '按分类列出歌单', fields: [{ name: 'cat', label: '分类', placeholder: '默认 全部' }], run: (v) => svc.playlist.categories(v.cat || '全部') },
      { key: 'playlistRcmd', name: '歌单相关推荐', api: 'GET /playlist/detail/rcmd/get', desc: '与该歌单相似的其他歌单', fields: [idField], run: (v) => svc.playlist.rcmd(v.id) },
    ],
  },
  {
    title: '用户',
    desc: '新版资料、歌单与关注流',
    actions: [
      { key: 'userDetailNew', name: '新版用户资料', api: 'GET /user/detail/new', desc: '用户资料与等级信息', fields: [uidField], run: (v) => svc.user.detailNew(v.uid) },
      { key: 'userCreated', name: '创建的歌单', api: 'GET /user/playlist/create', desc: '用户自己创建的歌单列表', fields: [uidField], run: (v) => svc.user.created(v.uid) },
      { key: 'userCollected', name: '收藏的歌单', api: 'GET /user/playlist/collect', desc: '用户收藏的歌单列表', fields: [uidField], run: (v) => svc.user.collected(v.uid) },
      { key: 'userFollowMixed', name: '混合关注流', api: 'GET /user/follow/mixed', desc: '关注用户的混合内容流', fields: [{ name: 'size', label: '条数', placeholder: '默认 30' }], run: (v) => svc.user.followMixed(Number(v.size) || 30) },
    ],
  },
  {
    title: '会员中心',
    desc: '签到、明细、历史、任务与成长值',
    actions: [
      { key: 'vipSign', name: 'VIP 签到', api: 'POST /vip/sign', desc: '执行今日签到（写操作）', fields: [], write: true, run: () => svc.vip.sign() },
      { key: 'vipSignInfo', name: '签到总览', api: 'GET /vip/sign/info', desc: '最近签到记录与今日状态', fields: [], run: () => svc.vip.signInfo() },
      { key: 'vipSignDetail', name: '签到明细', api: 'GET /vip/sign/detail', desc: '按时间戳查某日签到明细', fields: [{ name: 'timestamp', label: '时间戳', placeholder: '留空取当前时间' }], run: (v) => svc.vip.signDetail(v.timestamp || String(Date.now())) },
      { key: 'vipSignHistory', name: '签到历史', api: 'GET /vip/sign/history', desc: '历史签到汇总', fields: [], run: () => svc.vip.signHistory() },
      { key: 'vipTasks', name: '会员任务', api: 'GET /vip/tasks/v1', desc: '当前可完成的会员任务', fields: [], run: () => svc.vip.tasks() },
      { key: 'vipGrowth', name: '成长值总览', api: 'GET /vip/growthpoint/getall', desc: '成长值获取记录与总额', fields: [], run: () => svc.vip.growthpoint() },
    ],
  },
  {
    title: '榜单与推荐',
    desc: '榜单广场、榜单明细与个性化推荐',
    actions: [
      { key: 'toplistV2', name: '榜单广场 v2', api: 'GET /toplist/detail/v2', desc: '按分类组织的全部榜单', fields: [], run: () => svc.chart.toplistV2() },
      { key: 'chartDetail', name: '榜单详情', api: 'GET /chart/detail', desc: '按榜单编码与目标查详情', fields: [{ name: 'chartCode', label: '榜单编码', required: true }, { name: 'targetId', label: '目标 ID', required: true }, { name: 'targetType', label: '目标类型', placeholder: '默认 1' }], run: (v) => svc.chart.detail(v.chartCode, v.targetId, v.targetType || '1') },
      { key: 'chartSongDetail', name: '榜单歌曲详情', api: 'GET /chart/song/detail', desc: '榜单内单曲的排名数据', fields: [{ name: 'chartCode', label: '榜单编码', required: true }, { name: 'targetId', label: '目标 ID', required: true }, { name: 'targetType', label: '目标类型', placeholder: '默认 1' }], run: (v) => svc.chart.songDetail(v.chartCode, v.targetId, v.targetType || '1') },
      { key: 'recommendV1', name: '每日推荐 v1', api: 'GET /recommend/songs/v1', desc: '新版每日推荐歌曲', fields: [], run: () => svc.recommend.songsV1() },
      { key: 'recommendCategorySongs', name: '分类推荐歌曲', api: 'GET /recommend/category/songs', desc: '按类目推荐的歌曲集合', fields: [], run: () => svc.recommend.categorySongs() },
      { key: 'recommendCategoryConfigs', name: '推荐分类配置', api: 'GET /recommend/category/configs', desc: '推荐类目与展示配置', fields: [], run: () => svc.recommend.categoryConfigs() },
    ],
  },
  {
    title: '云盘与收听记录',
    desc: '云盘歌词、导入、最近收听与不喜欢列表',
    actions: [
      { key: 'cloudLyric', name: '云盘歌词', api: 'GET /cloud/lyric/get', desc: '按用户与云盘歌曲取歌词', fields: [uidField, { name: 'sid', label: '云盘歌曲 ID', required: true }], run: (v) => svc.misc.cloudLyric(v.uid, v.sid) },
      { key: 'cloudImport', name: '云盘导入', api: 'POST /cloud/import', desc: '按文件 md5 导入云盘（写操作）', fields: [{ name: 'md5', label: '文件 md5', required: true }, { name: 'song', label: '歌曲名' }, { name: 'artist', label: '歌手' }], write: true, run: (v) => svc.misc.cloudImport({ md5: v.md5, song: v.song, artist: v.artist }) },
      { key: 'recentListen', name: '最近收听', api: 'GET /recent/listen/list', desc: '最近播放过的歌曲列表', fields: [], run: () => svc.misc.recentListen() },
      { key: 'dislikeList', name: '不喜欢的歌曲', api: 'GET /dislike/list', desc: '被标记不喜欢的歌曲', fields: [], run: () => svc.misc.dislikeList() },
    ],
  },
];

const actionCount = sections.reduce((sum, section) => sum + section.actions.length, 0);
const writeCount = sections.reduce((sum, section) => sum + section.actions.filter((a) => a.write).length, 0);

interface ActionResult {
  loading: boolean;
  text: string;
  summary: string[];
  error: boolean;
}

const values = reactive<Record<string, Record<string, string>>>({});
const results = reactive<Record<string, ActionResult>>({});
const showRaw = reactive<Record<string, boolean>>({});
for (const section of sections) {
  for (const action of section.actions) values[action.key] = {};
}

/** 从上游多种返回形态里提取可读摘要，避免只展示一大坨 JSON */
const brief = (item: unknown): string => {
  if (item === null || item === undefined) return '';
  if (typeof item !== 'object') return String(item);
  const obj = item as Record<string, any>;
  const name = obj.name ?? obj.title ?? obj.nickname ?? obj.song?.name ?? obj.content ?? obj.lyric ?? obj.desc;
  const sub = obj.artist?.name ?? obj.ar?.[0]?.name ?? obj.creator?.nickname
    ?? obj.updateFrequency ?? obj.subtitle ?? obj.timeStr ?? obj.score ?? obj.id;
  return [name, sub].filter((part) => part !== undefined && part !== null && part !== '')
    .join(' · ').slice(0, 140) || JSON.stringify(item).slice(0, 140);
};

const summarize = (res: HV_Result | null): string[] => {
  if (!res) return [];
  const roots: unknown[] = [res.data, (res as Record<string, unknown>).result, res];
  const keys = ['songs', 'resources', 'list', 'playlists', 'artists', 'subscribers', 'records', 'tracks', 'data', 'categories', 'tasks'];
  for (const root of roots) {
    if (Array.isArray(root)) return root.slice(0, 6).map(brief);
    if (root && typeof root === 'object') {
      const obj = root as Record<string, unknown>;
      for (const key of keys) {
        if (Array.isArray(obj[key])) return (obj[key] as unknown[]).slice(0, 6).map(brief);
      }
      const scalars = Object.entries(obj)
        .filter(([, value]) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
        .slice(0, 6)
        .map(([key, value]) => `${key}: ${String(value).slice(0, 80)}`);
      if (scalars.length) return scalars;
    }
  }
  return [];
};

const toggleRaw = (key: string) => {
  showRaw[key] = !showRaw[key];
};

const run = async (action: Action) => {
  const input = values[action.key] || {};
  const missing = (action.fields || [])
    .filter((field) => field.required && !input[field.name]?.trim())
    .map((field) => field.label);
  if (missing.length) {
    results[action.key] = { loading: false, text: `请先填写：${missing.join('、')}`, summary: [], error: true };
    return;
  }
  if (action.write && !window.confirm(`确认执行【${action.name}】吗？该操作会向服务端提交数据。`)) return;

  results[action.key] = { loading: true, text: '请求中…', summary: [], error: false };
  const res = await action.run(input);
  results[action.key] = {
    loading: false,
    text: res ? JSON.stringify(res, null, 2) : '请求失败或无返回（可能需要登录、受版权限制或触发上游风控）',
    summary: summarize(res),
    error: !res,
  };
};
</script>

<style scoped lang="less">
.new-capabilities {
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 24px 24px 64px;

  &--header {
    margin-top: 20px;
  }

  &--intro {
    font-size: 13px;
    line-height: 22px;
    color: #888;
  }

  &--stats {
    display: flex;
    gap: 20px;
    margin-top: 14px;
    font-size: 12px;
    color: #999;

    b {
      margin-right: 4px;
      font-size: 18px;
      color: var(--color-primary, #c20c0c);
    }
  }

  &--section {
    margin-top: 32px;
  }

  &--section-head {
    margin-bottom: 14px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #2b2b2b;
    }

    p {
      margin: 4px 0 0;
      font-size: 12px;
      color: #aaa;
    }
  }

  &--grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  &--card {
    padding: 16px;
    box-sizing: border-box;
    background: var(--color-default, #fff);
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 10px;
  }

  &--card-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;

    h5 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    code {
      font-size: 11px;
      color: #aaa;
      word-break: break-all;
    }
  }

  &--desc {
    margin: 6px 0 12px;
    font-size: 12px;
    color: #999;
  }

  &--fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 10px;
  }

  &--field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
    color: #888;

    i {
      margin-left: 4px;
      font-style: normal;
      color: var(--color-primary, #c20c0c);
    }

    input {
      box-sizing: border-box;
      width: 100%;
      height: 32px;
      padding: 0 8px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 6px;
      outline: none;
      font-size: 12px;
      color: #333;
      background: #fff;

      &::placeholder {
        color: #ccc;
      }
    }
  }

  &--card-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;

    button {
      padding: 6px 16px;
      border: 0;
      border-radius: 6px;
      background: var(--color-primary, #c20c0c);
      color: #fff;
      font-size: 12px;
      cursor: pointer;

      &:disabled {
        opacity: 0.6;
        cursor: default;
      }
    }
  }

  &--warn {
    font-size: 11px;
    color: var(--color-primary, #c20c0c);
  }

  &--result {
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: 6px;
    background: #f7f7f8;
    font-size: 12px;
    color: #555;

    &.is-error {
      background: rgba(194, 12, 12, 0.05);
      color: var(--color-primary, #c20c0c);
    }

    p {
      margin: 0;
    }
  }

  &--summary {
    margin: 0 0 8px;
    padding-left: 16px;
    line-height: 20px;

    li {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &--raw-toggle {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-primary, #c20c0c);
    font-size: 11px;
    cursor: pointer;
  }

  pre {
    max-height: 240px;
    overflow: auto;
    margin: 8px 0 0;
    font-family: Consolas, Monaco, monospace;
    font-size: 11px;
    line-height: 17px;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

@media (max-width: 900px) {
  .new-capabilities {
    &--grid,
    &--fields {
      grid-template-columns: 1fr;
    }
  }
}
</style>
