<template>
  <div class="capabilities">
    <cm-navbar :title="'能力中心'" :has-load-more="false"></cm-navbar>
    <p class="capabilities--intro">
      前端已接入的全部能力入口。P0 为首页/歌单/用户/搜索/评论，P1 为体验增强，P2 为增值长尾；需登录或写操作的功能在页面内做了降级与二次确认。
    </p>

    <section v-for="group in groups" :key="group.title" class="capabilities--section">
      <h3 class="capabilities--heading">{{ group.title }}</h3>
      <div class="capabilities--grid">
        <div v-for="item in group.items" :key="item.path" class="capabilities--card" @click="linkTo(item.path)">
          <h5>{{ item.title }}</h5>
          <p class="capabilities--path">{{ item.path }}</p>
          <p class="capabilities--desc">{{ item.desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';

const router = useRouter();

interface CapabilityItem {
  title: string;
  path: string;
  desc: string;
}

const groups: { title: string; items: CapabilityItem[] }[] = [
  {
    title: 'P0 核心功能',
    items: [
      { title: '首页', path: '/', desc: '推荐流、金刚区、Banner' },
      { title: '每日推荐', path: '/daily_recommend', desc: '每日推荐歌单与歌曲' },
      { title: '排行榜', path: '/rank', desc: '官方榜、精品歌单、新歌速递、MV 榜' },
      { title: '歌单', path: '/playlist', desc: '歌单分类与精品浏览' },
      { title: '我的收藏', path: '/playlist/my', desc: '收藏歌单与歌单管理' },
      { title: '搜索', path: '/search', desc: '热搜、联想、多重匹配' },
      { title: '用户中心', path: '/user', desc: '资料、等级、播放记录、云盘' },
    ],
  },
  {
    title: 'P1 内容详情增强',
    items: [
      { title: '新碟与数字专辑', path: '/album', desc: '新碟、最新专辑、风格馆、销量榜' },
      { title: '歌手', path: '/artists', desc: '歌手分类、关注歌手新歌与新 MV' },
      { title: 'MV', path: '/mv', desc: '全部 MV、网易出品、最新 MV、收藏' },
      { title: '个性化发现', path: '/discovery', desc: '个性化推荐、风格分类、歌单页、mlog 与热题' },
      { title: '歌曲互动与播放记录', path: '/play-interaction', desc: '红心、私人 FM、智能播放、歌曲信息、历史记录' },
      { title: '消息中心', path: '/message', desc: '评论/@我/通知/私信、分享与发评论' },
      { title: '动态与话题', path: '/feed', desc: '动态流、话题页、相关视频与歌单' },
      { title: '用户与歌单补充', path: '/user-supplement', desc: '账号资料、云盘浏览删除、歌单编辑' },
      { title: '路由补齐', path: '/route-completion', desc: '数字专辑详情与歌手详情补充信息' },
    ],
  },
  {
    title: 'P2 增值长尾',
    items: [
      { title: '电台', path: '/dj-radio', desc: '分类、推荐、节目、榜单、订阅与礼物' },
      { title: '视频与播客', path: '/video-podcast', desc: '视频分类、信息流、播放、播客列表与上传' },
      { title: '云贝/会员/音乐人', path: '/yunbei-vip-musician', desc: '云贝中心、会员成长、音乐人数据' },
      { title: 'UGC 与一起听', path: '/ugc-listentogether', desc: 'UGC 内容查看与一起听房间' },
      { title: '粉丝中心与数字专辑', path: '/fanscenter-digitalalbum', desc: '粉丝画像与数字专辑' },
      { title: '云盘', path: '/cloud-disk', desc: '云盘上传匹配' },
      { title: '账号资料', path: '/account-profile', desc: '验证、注册前置、资料与签到' },
      { title: '杂项长尾', path: '/misc-longtail', desc: '版本、年度总结、统计与日历' },
    ],
  },
];

const linkTo = (path: string) => {
  router.push({ path });
};
</script>

<style scoped lang="less">
.capabilities {
  width: 1400px;
  margin: 0 auto;
  padding: 24px 0 48px;

  &--intro {
    margin-top: 16px;
    font-size: 13px;
    line-height: 22px;
    color: #999;
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

  &--grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  &--card {
    padding: 14px 16px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--color-primary, #c20c0c);
      transform: translateY(-2px);
    }

    h5 {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }
  }

  &--path {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-primary, #c20c0c);
  }

  &--desc {
    margin-top: 8px;
    font-size: 12px;
    line-height: 18px;
    color: #999;
  }
}
</style>
