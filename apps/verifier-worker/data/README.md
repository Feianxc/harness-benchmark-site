# verifier-worker/data 公开快照边界

这个目录是网站 public beta 的公开演示快照目录。

- 可以入库：`boards/*.json`、`entries/*.json`、`publications.json`，用于无数据库环境下展示 Evidence Board。
- 不能放入：真实私有 payload、未脱敏日志、token、私有路径、sealed trace、外部上传 receipt。
- 生产运行时如需使用自己的 worker 输出，请设置 `OHBP_WORKER_DATA_DIR` 指向部署环境的持久化目录。
- 外部上传候选池不写入这里；默认写入 `.data/public-submissions`。
