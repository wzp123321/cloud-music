# queue-scroll-search-ux 浏览器集成验收报告（最终版）

- 验收人：verifier（只读，未修改任何代码 / OpenSpec 产物）
- 时间：2026-11-20
- 环境：服务端 http://localhost:19830、前端 http://localhost:19572（均 HTTP 200）
- 工具：playwright-core（msedge headless），视口 1440x900
- 口径：KP-03 历史面板先 focus 可见再截图断言；KP-04 等列表行渲染 >0 再断言；Q16/Q17 切 tab 不记历史；Q21 返工口径（A usePlayerStore、B key 去 type、C addHistory 在 handleSearch）
- B 路历经三次返工，最终由 fix-b2 的「有界校正器 keepRestore」修复并通过复验（连续两次 rerun 全 PASS）

## 总览

| 路 | 结论 | 说明 |
|---|---|---|
| A 队列重排 | 通过 | 8 项全通过（含随机自然结束选曲补测） |
| B 滚动恢复 | 通过（返工后复验） | 歌单详情、搜索结果返回恢复差值均为 0；跨导航/换词回顶正常 |
| C 搜索历史 | 通过 | 8 项全通过（含未登录、上限20） |

## A 路：队列重排（spec playback-queue-reorder）— 通过

| 步骤 | 结论 | 关键证据 |
|---|---|---|
| A1 打开队列、确认多首 | PASS | 进入歌单详情点“播放全部”后队列 30 首；shots/a3-queue-before.png |
| A2 播放一首并记名 | PASS | 当前歌“凡人歌（《碧海情天》主题曲）”，playing=true；shots/a4-playing-before-reorder.png |
| A3 拖拽改变顺序 | PASS | 第4行拖到第0行：实际顺序与期望 splice 结果完全一致（晚婚(Live) 置顶）；shots/a5-after-reorder.png |
| A4 当前歌曲未变/播放未中断 | PASS | 前后均为同一首且 is-playing 未丢；shots/a6-after-reorder-player.png |
| A5 下一首按新顺序 | PASS | 重排后索引2（凡人歌）→ 下一首“梦醒时分 (Live)”，符合新顺序；shots/a7-next.png |
| A6 刷新后顺序保持 | PASS | 刷新后队列顺序与重排后逐项一致（localStorage cloud-music-list 持久化生效）；shots/a8-after-reload.png |
| A7 随机模式下重排 | PASS | 切到“随机播放”模式后拖拽仍改序、当前歌不变；shots/a9-random-reorder.png |
| A7b 随机模式手动切歌可用 | PASS | shots/a10-random-next.png |
| A7c 随机自然结束选曲（补充） | PASS | 派发 audio ended 事件 6 次，6 次均非顺序选曲且都在队列内，随机选曲逻辑未被重排破坏；result-a7-random.json |

## B 路：滚动恢复（spec navigation-scroll-restore）— 通过（三次返工后复验）

背景：实际应用滚动容器是 `<div class="home">`（overflow-y:auto），不是 window。初版与二次返工均失败；fix-b2 三次返工引入 `keepRestore` 有界校正器（每 100ms 检查、容器高度足够才写 scrollTop、持续 5s，用户主动 wheel/touch 或新导航立即停止），最终修复。

最终复验（verify-b2-rerun.js，连续两次全 PASS，见 result-b2.json）：

| 步骤 | 结论 | 证据 / 现象 |
|---|---|---|
| B0 真实滚动容器 | PASS | 容器=.home，scrollHeight 3027~3617 / clientHeight 900，window.scrollY=0 |
| B1 歌单详情滚到中部 | PASS | 离开前 scrollTop=1063 / 1358；shots/b2r1-playlist-scrolled.png |
| B2 歌单详情返回恢复(±5) | PASS | 离开前=1063（sessionStorage 权威同源）→ 返回后=1063，**差=0**；返回后 3s 内采样全程稳定；shots/b2r2-playlist-restored.png（视觉确认停在歌曲列表中段，封面已滚出视口） |
| B4b/B4d 搜索结果滚动与记值 | PASS | 关键词“周杰伦”，离开前=451，sessionStorage=451 |
| B4c 搜索结果返回恢复(±5) | PASS | 451 → 451，**差=0**（此前 43px 漂移已被校正器消除）；shots/b2r4-search-scrolled.png、shots/b2r5-search-restored.png |
| B5 切换导航回顶 | PASS | 歌单滚动 1063 → 首页 0；shots/b2r3-nav-top.png |
| B6 sessionStorage 非0值 | PASS | 返回后 playlist key 记值被导航回顶正确归 0，search key=451 保留；无异常 |
| B7 换关键词回顶 | PASS | 换词前 451 → 换词后 0；shots/b2r6-keyword-top.png |

结论：navigation-scroll-restore 全部场景通过；Q20 账本“容器是 window”的旧结论已由实测推翻并更正。

## C 路：搜索历史（spec search-history）— 通过

| 步骤 | 结论 | 关键证据 |
|---|---|---|
| C0 未登录 | PASS | 头部账号显示“登录/注册” |
| C1 搜索后记录 | PASS | 搜 test-history-2026 后 localStorage cloud-search-history=["test-history-2026"] |
| C2 面板显示该词(KP-03) | PASS | focus 后面板可见，历史含该词；shots/c2-history-panel-visible.png |
| C3 点击历史词跳转 | PASS | URL=/search?keyword=test-history-2026（复用 handleSearch）；shots/c3-history-click-jump.png |
| C4a 删单条 | PASS | ["hello-extra-word","test-history-2026"] → 仅剩后者；shots/c4-after-delete-one.png |
| C4b 清空并刷新 | PASS | 确认弹窗后清空，刷新后仍 []；shots/c5-after-clear.png |
| C5 切tab不记历史(Q16/Q17) | PASS | 切“专辑”tab 前后均为 ["周杰伦"]，无新增；shots/c6-tab-no-history.png |
| C6 上限20+最新置顶 | PASS | 连搜21词后恰好20条，最新 limit-word-21 置顶，最旧 limit-word-1 已丢弃；shots/c7-history-limit20.png |

## 证据路径

- 报告：.sdd/queue-scroll-search-ux/visual-report.md
- 分步结果 JSON：result-a.json、result-a7-random.json、result-b.json（初测失败留档）、result-b2.json（最终通过）、result-c.json
- 截图目录：.sdd/queue-scroll-search-ux/shots/（含 A 10 张、B 复验 b2r1~b2r6、C 7 张）
- 验收脚本（只读测试工具，未改源码）：verify-a.js、verify-a7-random.js、verify-b2-rerun.js（最终复验）、verify-b2.js、verify-c.js、diag-b-timeline.js 等
