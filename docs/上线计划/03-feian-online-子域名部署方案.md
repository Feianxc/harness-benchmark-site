# 子域名与部署上线方案（feian.online）

生成时间：2026-04-24  
推荐子域名：`harness.feian.online`  
当前 DNS 事实：`feian.online` 使用 Cloudflare NS：`sandra.ns.cloudflare.com` / `arturo.ns.cloudflare.com`。

## 1. 推荐上线形态

本项目已经开放 public intake，且提交记录需要持久化。因此不建议用纯静态托管。推荐：

```text
用户 → Cloudflare DNS / HTTPS → Node Web Service → .data/public-submissions
```

低预算优先级：

| 方案 | 适合程度 | 原因 |
|---|---:|---|
| VPS + Docker + Cloudflare A 记录 | 高 | 最便宜、数据就在服务器磁盘、可控 |
| Render Web Service + Persistent Disk | 中 | 管理简单，但持久盘通常是付费项 |
| Fly.io + Volume | 中 | 适合 Docker 和卷，但要理解 volume 单机/区域限制 |
| Cloudflare Pages | 低 | 当前是 Node HTTP server，不是纯静态站；public intake 需要持久化 |

## 2. DNS 记录

如果使用 VPS：

| Type | Name | Target | Proxy |
|---|---|---|---|
| A | `harness` | 服务器公网 IPv4 | Proxied |
| AAAA | `harness` | 服务器公网 IPv6（如有） | Proxied |

如果使用 Render / Fly / 其他 PaaS：

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `harness` | 平台给的 hostname | 通常先 DNS only，平台验证完成后再按平台要求开启 Proxied |

Cloudflare 官方文档要点：

- 子域名可以创建 `A`、`AAAA` 或 `CNAME` 记录。
- CNAME 适合把子域名指向平台分配的 FQDN。
- Cloudflare 只有在 DNS 记录为 Proxied 时才会给该记录提供 Cloudflare 侧 SSL/TLS 证书。

参考：

- https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-subdomain/
- https://developers.cloudflare.com/fundamentals/setup/manage-domains/manage-subdomains/

## 3. 生产环境变量

```bash
PORT=3000
PUBLIC_SITE_URL=https://harness.feian.online
PUBLIC_INTAKE_ENABLED=true
PUBLIC_INTAKE_DATA_DIR=.data/public-submissions
PUBLIC_INTAKE_RATE_LIMIT=6
PUBLIC_INTAKE_ADMIN_LIST_LIMIT=200
PUBLIC_INTAKE_MAX_FILES=5000
PUBLIC_INTAKE_MAX_BYTES=268435456
PUBLIC_INTAKE_TRUST_PROXY=false
PUBLIC_INTAKE_IP_HASH_SALT=<生产随机长字符串>
PUBLIC_INTAKE_ADMIN_TOKEN=<生产随机长字符串>
```

如果使用 Docker 且挂载 `/app/.data`，则：

```bash
PUBLIC_INTAKE_DATA_DIR=/app/.data/public-submissions
```

如果 Node 只允许通过 Cloudflare / Caddy / Nginx 访问，并且公网不能直连 `3000` 端口，可设置：

```bash
PUBLIC_INTAKE_TRUST_PROXY=true
```

如果 `3000` 端口可能被公网直连，不要开启该项；否则攻击者可伪造 `X-Forwarded-For` 绕过内存限流。

## 4. Docker 部署

本仓库已新增 `Dockerfile`。

本地构建：

```bash
docker build -t ohbp-harnessbench .
```

本地运行：

```bash
docker run --rm -p 3000:3000 \
  -e PUBLIC_SITE_URL=http://127.0.0.1:3000 \
  -e PUBLIC_INTAKE_ENABLED=true \
  -e PUBLIC_INTAKE_DATA_DIR=/app/.data/public-submissions \
  -e PUBLIC_INTAKE_IP_HASH_SALT=local-dev-random-salt \
  -e PUBLIC_INTAKE_ADMIN_TOKEN=local-dev-admin-token \
  -v ohbp_public_data:/app/.data \
  ohbp-harnessbench
```

生产 smoke：

```bash
curl https://harness.feian.online/healthz
curl https://harness.feian.online/robots.txt
curl https://harness.feian.online/sitemap.xml
curl https://harness.feian.online/submit
```

## 5. VPS 反向代理示例

Node 服务监听本机 `3000`，Nginx/Caddy 对外提供 HTTPS。

Caddy 示例：

```caddyfile
harness.feian.online {
  reverse_proxy 127.0.0.1:3000
}
```

Nginx 示例：

```nginx
server {
  server_name harness.feian.online;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
  }
}
```

VPS 防火墙建议：

- 只开放 `80/443/22`。
- `3000` 仅监听本机或只允许反向代理访问。
- Cloudflare Proxied 模式下，生产环境 `PUBLIC_SITE_URL=https://harness.feian.online`。

## 6. 外部上传边界

当前 `/submit` 与 `/api/public-submissions` 已开放候选提交，但不会直接进榜。

| 层 | 行为 |
|---|---|
| `/submit` | 表单提交，写入 `.data/public-submissions` |
| `/api/public-submissions` | JSON API 提交，写入同一目录 |
| `GET /api/public-submissions/:receipt_id` | 只返回公开 receipt，不返回原始 payload/contact |
| `GET /api/public-submissions` | 管理员 Bearer Token 后返回 receipt 列表 |
| receipt | 只返回 digest、状态、问题数 |
| Evidence Board | 不自动消费 public intake |
| Official | 仍需 intake / verifier / governance |

这保证开放外部上传后，用户不能靠自报数据直接污染榜单。

## 7. 上线前最后门禁

```bash
npm run build
npm run test
npm run lint
```

上线后：

1. HTTPS 访问正常。
2. `/healthz` 返回 `ok: true`。
3. `/robots.txt` 里的 sitemap 是 `https://harness.feian.online/sitemap.xml`。
4. `/submit` 可提交测试 payload。
5. `.data/public-submissions` 有对应 receipt 文件。
6. Evidence Board 没有自动吸收 public intake。
