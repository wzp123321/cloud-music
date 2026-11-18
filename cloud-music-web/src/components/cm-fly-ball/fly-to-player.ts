import { reactive } from 'vue';

/**
 * 点击列表播放时的「飞入播放器」特效。
 *
 * 实现方式与音符飞散一致：只用一份 offset-path 驱动，起点是鼠标位置、
 * 终点是底部播放器封面，控制点抬到两点上方，形成先抛起再落下的弧线。
 * 不用 rAF 逐帧改 transform —— 抛物线的每一帧都交给合成层。
 */
export interface FlyBall {
  id: number;
  cover: string;
  style: Record<string, string>;
}

/** 供渲染组件订阅的队列 */
export const flyBalls = reactive<FlyBall[]>([]);

/** 与 CSS 动画时长对齐，留 140ms 余量 */
const BALL_LIFETIME = 900;
let sequence = 0;

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 落点：底部播放器封面；详情页等场景取不到时退回左下角 */
const resolveTarget = (): { x: number; y: number; el: Element | null } => {
  const el = document.querySelector('.play-controller .np-cover-wrap, .play-controller .np-cover');
  if (el) {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, el };
  }
  return { x: 56, y: window.innerHeight - 36, el: null };
};

/** 落点做一次脉冲，让"歌已经进了播放器"这件事有反馈 */
const pulseTarget = (el: Element | null) => {
  if (!el) {
    return;
  }
  el.classList.remove('is-catch');
  // 强制读一次布局，保证连续点击时动画能重播
  void (el as HTMLElement).offsetWidth;
  el.classList.add('is-catch');
  window.setTimeout(() => el.classList.remove('is-catch'), 620);
};

/**
 * 从点击位置抛一个封面向播放器。
 * @param origin 鼠标位置（clientX / clientY）
 * @param cover 封面地址，取不到就用纯色音符占位
 */
export const flyToPlayer = (origin: { x: number; y: number }, cover?: string) => {
  if (reducedMotion()) {
    return;
  }
  const target = resolveTarget();
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  // 控制点：横向偏 18% 起步、纵向抬到两点最低点之上，弧线才有"上抛"感
  const controlX = origin.x + dx * 0.18;
  const controlY = Math.min(origin.y, target.y) - Math.abs(dy) * 0.45 - 60;

  const id = ++sequence;
  flyBalls.push({
    id,
    cover: cover ?? '',
    style: {
      offsetPath: `path('M ${origin.x.toFixed(0)} ${origin.y.toFixed(0)} Q ${controlX.toFixed(0)} ${controlY.toFixed(0)} ${target.x.toFixed(0)} ${target.y.toFixed(0)}')`,
    },
  });

  window.setTimeout(() => {
    const index = flyBalls.findIndex((ball) => ball.id === id);
    if (index > -1) {
      flyBalls.splice(index, 1);
    }
    // 最后一颗落地时才脉冲，连点不会闪个不停
    if (!flyBalls.length) {
      pulseTarget(target.el);
    }
  }, BALL_LIFETIME);
};
