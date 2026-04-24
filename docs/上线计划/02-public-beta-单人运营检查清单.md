# Public Beta 单人运营检查清单（低成本版）

生成时间：2026-04-24  
适用范围：Harness 测评网站 public beta。  
核心原则：**先保护真实性，再追求榜单热闹；宁可空榜，也不把未复验数据包装成真榜。**

## 1. 上线前 30 分钟检查

| 检查项 | 操作 | 通过标准 | 失败时处理 |
|---|---|---|---|
| 构建 | `npm run build` | 全仓通过 | 不上线，先修类型/构建错误 |
| 测试 | `npm run test` | 全仓测试通过 | 不上线，先修失败用例 |
| Lint 壳 | `npm run lint` | 命令可执行，无失败 | 若项目仍无 lint 规则，记录为“空 lint” |
| Web smoke | 访问 `/`、`/leaderboards/general`、`/compare`、`/boards/official-verified`、`/protocol`、`/playground/validator` | 均 200，页面能打开 | 回退到上一版或暂停发布 |
| Public intake smoke | 访问 `/submit`，提交一条测试 payload | 返回 receipt；`.data/public-submissions` 产生文件；Evidence Board 不变 | 关闭 `PUBLIC_INTAKE_ENABLED`，先查原因 |
| 探活 | 访问 `/healthz` | 返回 `ok: true` | 部署平台不要放量 |
| SEO 壳 | 访问 `/robots.txt`、`/sitemap.xml` | robots 有绝对 sitemap；sitemap 有关键页面 | 修复后再上线 |
| 真实性边界 | 首页/榜单/对比 | 明确是 curated selection guide，不是 verified truth table | 不上线，避免误导用户 |
| Evidence 边界 | Evidence Board | policy / provenance / uncertainty 可见 | 不上线或隐藏入口 |

## 2. 环境变量

| 变量 | 是否必须 | 建议值 | 说明 |
|---|---:|---|---|
| `PORT` | 部署平台通常提供 | 平台分配 | Web server 监听端口 |
| `PUBLIC_SITE_URL` | 推荐 | `https://你的域名` | robots/sitemap 使用它生成 canonical URL；没有时退回当前 Host |
| `PUBLIC_INTAKE_ENABLED` | 必须确认 | `true` / 紧急时 `false` | 控制 `/submit` 与 `/api/public-submissions` 是否接收新提交 |
| `PUBLIC_INTAKE_DATA_DIR` | 必须 | `.data/public-submissions` 或 `/app/.data/public-submissions` | 外部上传 receipt 本地持久化目录 |
| `PUBLIC_INTAKE_RATE_LIMIT` | 必须 | `6` | 每 10 分钟、每个客户端的候选提交次数 |
| `PUBLIC_INTAKE_ADMIN_LIST_LIMIT` | 推荐 | `200` | 管理列表最多返回多少条 receipt，避免一次性输出过多 |
| `PUBLIC_INTAKE_MAX_FILES` | 推荐 | `5000` | 候选池 receipt 文件上限，防止单机磁盘被刷满 |
| `PUBLIC_INTAKE_MAX_BYTES` | 推荐 | `268435456` | 候选池总字节上限，默认 256 MiB |
| `PUBLIC_INTAKE_TRUST_PROXY` | 反向代理后推荐 | `true`（仅在代理可信时） | 使用 `CF-Connecting-IP` / `X-Forwarded-For` 作为限流与 IP hash 输入 |
| `PUBLIC_INTAKE_IP_HASH_SALT` | 生产必须 | 随机长字符串 | 避免把 IP hash 做成可猜值 |
| `PUBLIC_INTAKE_ADMIN_TOKEN` | 生产必须 | 随机长 token | 访问 `GET /api/public-submissions` 的管理员 bearer token |

> 如果部署在反向代理后面，确保外层启用 HTTPS，并只在代理可信、直连端口不可公网访问时开启 `PUBLIC_INTAKE_TRUST_PROXY=true`。

## 3. 数据发布规则

| 数据类型 | 能否进 Consumer 选型页 | 能否进 Evidence Board | 备注 |
|---|---:|---:|---|
| 静态策展分 | 可以 | 不作为 verified 证据 | 必须标注 `curated_host_fit_demo` |
| 用户上传 payload-only | 不可以 | 不可以 | 没有 bundle/path/digest 时直接拒绝或停留在草稿区 |
| Public intake receipt | 不可以 | 不可以 | `/submit` 只进入 `.data/public-submissions` 候选池，不自动进入任何榜单 |
| 已通过本地 validator 的 bundle | 不直接进真榜 | 可进入待审/社区层 | 仍需 intake gate 与状态机 |
| verifier-worker 产出的 snapshot | 不改 Consumer 分 | 可以作为 Evidence 数据源 | 注意 slice 与不确定性 |
| Official Verified | 不自动承诺 | 可以 | 需要明确准入、复验、separation evidence |

## 4. 单人低成本复核策略

1. **默认不全量复跑**：只对异常高分、首次提交、榜首变更、争议提交做抽样复核。
2. **先机器门禁**：schema、digest、bundle integrity、admission gaps 必须先过。
3. **再人工抽查**：看提交说明、证据路径、任务包是否混排、是否有明显污染。
4. **最后发布状态**：`draft → admitted → frontier/community → official`，不要跳级。
5. **保留回滚口**：任何被质疑的数据先降级到 `needs_review`，不要硬删历史。

## 5. 每次新增/变更榜单前的人工判断

| 问题 | 如果答案是否定 |
|---|---|
| 这个结果能追到 bundle digest 吗？ | 不能上 Evidence Board |
| task package / execution contract / tolerance policy 是同一个 slice 吗？ | 不能混排 |
| 样本量足够支持硬排名吗？ | 只显示 rank band / interval，不显示硬名次 |
| 用户上传内容是否只公开 digest / metadata？ | 先封存 raw，不公开 |
| 这个结论是否会被普通用户误解成“官方真榜”？ | 改文案或降级展示 |

## 6. 回滚办法

1. 前端误导性文案：立即改文案并重新部署。
2. 证据数据有争议：先把条目状态降到 `needs_review` 或移出 Official。
3. 部署失败：回退到上一版构建产物或关闭新入口。
4. 外部上传被滥用：临时关闭上传入口，只保留 validator playground。
5. 管理员 token 暴露：立即更换 `PUBLIC_INTAKE_ADMIN_TOKEN`，保留旧 receipt 文件，检查访问日志。
6. 数据目录异常膨胀：先备份 `.data/public-submissions`，再按 receipt 时间分批归档，不直接删除未知来源证据。

## 7. 本轮已验证证据

- `npm run build`：通过。
- `npm run test`：通过。
- `npm run lint`：通过，当前是 workspace `--if-present` 空壳检查。
- Web smoke：`/`、`/?lang=en`、`/leaderboards/*`、`/compare`、`/boards/official-verified`、`/protocol`、`/playground/validator`、`/api/home`、`/api/boards/official-verified` 均返回 200。
- Lighthouse mobile（本地）：Accessibility 100，SEO 100，Best Practices 77；剩余失败来自本地 HTTP/AdGuard 注入，生产 HTTPS 环境需复测。
