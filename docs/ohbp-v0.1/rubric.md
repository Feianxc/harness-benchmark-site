# OHBP v0.1 审核 Rubric

总原则：每轮审核都按同一 rubric 打分，避免“满分”口径漂移。

## 评分项（每项 10 分）

### 1. 方法论严谨性
- 是否明确区分“协议”“benchmark”“榜单政策”
- 是否避免把产品偏好伪装成科学真理
- 是否处理 benchmark health / contamination / freshness

### 2. 协议完整性
- 是否覆盖 benchmark card / execution contract / run manifest / evidence bundle
- 是否覆盖状态机与验证层级
- 字段是否足以支撑上传、复验、展示

### 3. 治理与反作弊
- 是否处理 best-of-N、人工干预、benchmark-tuning、缓存答案、环境作弊、伪造 trace
- 是否明确 disputes / invalidation / audit 流程

### 4. 可实现性
- 是否能在 0→1 阶段真正做出来
- 是否有 MVP / lite lane / thin website / CLI-first 路线
- 是否避免依赖无法落地的超重基础设施

### 5. 生态兼容性
- 是否能支持 preset + custom adapter
- 是否兼容不同 harness / agent / model provider
- 是否避免被单一生态锁死

### 6. 文档清晰度
- 结构是否清楚
- 概念边界是否清楚
- 是否便于开发、评审和后续扩展

## 评级规则

- **10/10**：该维度无明显缺口，可直接作为 v0.1 正式规范一部分
- **8-9/10**：基本成熟，但有若干需要修饰或补字段的问题
- **6-7/10**：方向正确，但结构或边界仍不稳
- **≤5/10**：存在关键性缺陷，不适合进入正式草案

## 阻断条件

若任一审核 agent 发现以下问题，则本轮不得宣称“满分”：

1. P0：协议缺少关键对象，导致无法上传或无法复验
2. P1：治理机制无法防止自报分数直接污染主榜
3. P1：字段不足以实现可审计证据链
4. P1：文档边界混乱，导致 protocol / policy / product page 三者混淆

## 本项目的“满分”定义

仅当：

1. 所有审核组对 6 个维度全部给出 **10/10**
2. 无 P0 / P1
3. 无未记录的结构性 trade-off

方可称为本轮“满分”。
