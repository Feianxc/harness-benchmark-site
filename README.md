# OHBP / harnessbench

Open Harness Benchmark Protocol（OHBP）实现工作区。

当前仓库目标：

1. 基于 `docs/ohbp-v0.1/ohbp-v0.1.md` 落地共享 schema / canonical / validator / verifier 真源
2. 提供 `hb init -> hb run -> hb pack -> hb validate -> hb inspect -> hb upload(mock)` 的 CLI 闭环
3. 提供 mock intake / verifier
4. 提供网站 public beta：
   - Consumer selection guide（策展选型层，不是 verifier-backed 真榜）
   - Official Verified Board
   - Reproducibility Frontier
   - Community Lab
   - Entry Detail
   - Protocol
   - Validator Playground
   - Public intake（外部上传候选池，不直接上榜）

## 本地运行

```bash
npm ci
npm run build
npm run test
npm run lint
npm run dev:web
```

Web 默认地址：`http://127.0.0.1:3000`

## Public intake 边界

- `/submit` 与 `/api/public-submissions` 只接收候选记录。
- receipt 只公开 `receipt_id`、`payload_digest`、状态和问题数。
- 原始 payload / contact 默认保存在 `PUBLIC_INTAKE_DATA_DIR`，不进入公开 receipt API。
- Public intake 不会自动进入 Consumer 榜单、Evidence Board 或 Official Verified。

生产环境至少设置：

```env
PUBLIC_SITE_URL=https://harness.feian.online
PUBLIC_INTAKE_DATA_DIR=.data/public-submissions
PUBLIC_INTAKE_IP_HASH_SALT=replace-with-random-string
PUBLIC_INTAKE_ADMIN_TOKEN=replace-with-long-random-token
```

## 部署

推荐形态：`Cloudflare DNS/HTTPS -> VPS/Docker -> .data/public-submissions`。

```bash
docker build -t ohbp-harnessbench .
docker run --rm -p 3000:3000 \
  -e PUBLIC_SITE_URL=http://127.0.0.1:3000 \
  -e PUBLIC_INTAKE_DATA_DIR=/app/.data/public-submissions \
  -e PUBLIC_INTAKE_IP_HASH_SALT=local-dev-random-salt \
  -e PUBLIC_INTAKE_ADMIN_TOKEN=local-dev-admin-token \
  -v ohbp_public_data:/app/.data \
  ohbp-harnessbench
```

实现蓝图见：

- `docs/implementation/build-blueprint.md`
- `docs/上线计划/03-feian-online-子域名部署方案.md`
- `docs/上线计划/04-开源仓库与同步方案.md`
