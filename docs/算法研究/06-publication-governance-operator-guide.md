# OHBP v0.2 单人运营治理手册

## 1. 这份文档是干什么的

这是一份给**单人运营者**看的实操手册。

它不讨论抽象概念，只回答 4 个问题：

1. 什么时候要动 `publication-governance.json`；
2. 这个文件怎么写；
3. `disputed / corrected / invalidated / archived` 到底什么时候用；
4. 在没钱、没大机器、没人手的情况下，怎样把真实性守住。

一句话总结：

> **你不需要把每一条上传都重跑十遍，但你必须把“什么时候暂停、什么时候修正、什么时候判失效、为什么这样判”写成可追溯的治理记录。**

---

## 2. 先记住一个最重要的原则

OHBP v0.2 里，真实性不是靠“我感觉这条像真的”。

而是靠两层东西一起守住：

1. **评测方法的硬门槛**
   - 文件真
   - 次数真
   - 人工真
   - 环境真
   - 泛化真
   - 稳定真
2. **治理状态机**
   - 有疑点先暂停
   - 有修正先留痕
   - 失效就明确失效
   - 归档就不再混进活跃榜单

所以，`publication-governance.json` 的作用不是“改分数”。

它的作用是：

> **在平台侧留下一个低成本、可持久、可审计的裁决层。**

---

## 3. 文件放哪里

当前 worker 会从 **intake 数据目录** 读取治理文件：

- 文件名：`publication-governance.json`

在默认开发环境下，它放在 intake 数据目录根部，而不是前端目录里。

你可以把它理解成：

- 上传数据是“参与者说了什么”
- verifier 是“系统按规则自动算了什么”
- governance 文件是“运营者最终怎么处理公开状态”

---

## 4. 文件格式长什么样

文件内容是一个 JSON 数组，每一项是一条治理指令。

最小示例：

```json
[
  {
    "entry_id": "entry_xxx",
    "publication_state": "disputed",
    "reason_code": "operator_dispute_opened",
    "summary": "发现可疑声明，先暂停公开展示，等待进一步复核。",
    "at": "2026-04-23T10:00:00.000Z",
    "actor": "operator:solo-admin"
  }
]
```

你可以用 3 种键来指向目标条目，命中任意一种即可：

- `submission_id`
- `entry_id`
- `public_bundle_digest`

推荐优先级：

1. 有 `entry_id` 就优先写 `entry_id`
2. 如果你担心 entry 重建或导入变化，可以再补 `submission_id`
3. 如果你想绑定到产物本身，再补 `public_bundle_digest`

---

## 5. 每个字段是什么意思

### `publication_state`

你想把该条结果推进到哪个公开状态。

可用值：

- `submitted`
- `provisional`
- `published`
- `disputed`
- `corrected`
- `invalidated`
- `rejected`
- `archived`

注意：

- 这不是可信度分层
- 这只是**公开生命周期状态**

### `reason_code`

给机器和人看的短标签。

建议写成稳定、可搜索的代码，比如：

- `operator_dispute_opened`
- `operator_correction_applied`
- `operator_invalidated_after_trace_review`
- `operator_archived_old_result`

### `summary`

给人看的短说明。

要求：

- 一句话说清原因
- 不要写空话
- 不要只写“已处理”

### `at`

这次治理动作发生的时间，必须是 ISO 时间。

### `actor`

是谁做的。

单人运营也建议写，例如：

- `operator:solo-admin`

这样后面看历史不会不知道是谁改的。

---

## 6. 当前代码允许的状态迁移

当前实现是**严格状态机**，允许的迁移如下：

- `submitted -> provisional | published | rejected`
- `provisional -> published | rejected`
- `published -> disputed | archived`
- `disputed -> published | corrected | invalidated`
- `corrected -> published | invalidated | archived`
- `invalidated -> archived`
- `rejected -> archived`
- `archived ->` 无后续迁移

最需要注意的一条：

> **当前不允许 `published -> corrected` 直接跳。**

必须先：

1. `published -> disputed`
2. 再 `disputed -> corrected`

这样做的原因很简单：

- 先公开承认“这条结果正在被质疑”
- 再进入“修正处理中”
- 避免后台偷偷改状态，前台却没有中间过程

---

## 7. 四种最常用状态到底什么时候用

## 7.1 `disputed`

适用场景：

- 有明显疑点，但你还没完全查清
- 用户投诉某条结果不实
- trace、次数、人工介入、环境声明有冲突
- 怀疑只上传了最好一次，而不是完整 run-group

简单理解：

> **“先暂停，不先下最终结论。”**

进入这个状态后：

- 活跃榜单暂停展示
- entry detail 还保留
- 时间线会记录这次 dispute

这是单人运营最重要的低成本动作之一，因为它能先把风险关掉。

## 7.2 `corrected`

适用场景：

- 原条目存在问题
- 但不是完全作废
- 你已经拿到修正说明，正在等待新版本重新复核

简单理解：

> **“旧结果有问题，但不是直接判死；先标成修正中。”**

注意：

- `corrected` 期间也不会回到活跃榜单
- 它不是“恢复正常”
- 真正恢复，需要后续再走到 `published`

## 7.3 `invalidated`

适用场景：

- 关键证据被推翻
- 发现严重方法学问题
- 运行次数、环境或人工声明与事实冲突到无法继续采信
- 这条成绩已经不能再当作有效比较依据

简单理解：

> **“这条结果作废，但历史说明保留。”**

适合判 invalidated 的典型例子：

- 号称 autonomous，结果 trace 明显有人工自由输入
- 号称 5 runs，结果只上传 1 run 且无法补齐
- 关键 digest 对不上，且无法解释

## 7.4 `archived`

适用场景：

- 结果已经过期
- 被新条目替代
- 不再参与当前榜单，但保留历史参考

简单理解：

> **“不是说它假，而是它已经不是当前有效展示对象。”**

---

## 8. 这些状态会怎样影响前端展示

当前实现里，`publication_state` 会进一步映射成 `board_disposition`：

- `published / provisional / submitted` -> `active`
- `disputed / corrected` -> `suspended`
- `invalidated / archived` -> `historical_only`
- `rejected` -> `hidden`

这意味着：

### 活跃榜单会屏蔽这些状态

- `disputed`
- `corrected`
- `invalidated`
- `archived`
- `rejected`

也就是说：

> **这些条目不会继续占用 Official / Frontier / Community 的活跃名次。**

但 entry detail 页面仍然可以展示：

- publication state notice
- state history
- correction log
- redaction notes

这就是“风险下架，但历史不消失”。

---

## 9. 单人运营时的推荐处理顺序

如果你发现一条结果可疑，建议按下面顺序走：

### 第一步：先判断是不是“立刻要下架”

只要满足下面任意一条，就先 `disputed`：

- 关键事实有冲突
- 公开榜单继续展示会误导用户
- 你还没查清，但已经不放心

### 第二步：再判断是修正、失效还是归档

#### 走 `corrected`

当你认为：

- 问题是可修的
- 修正后还有机会重新发布

#### 走 `invalidated`

当你认为：

- 这条旧结果已经不能再采信
- 即使补材料，也不能把原结果继续当成有效结果

#### 走 `archived`

当你认为：

- 它不是假，也不是错到失效
- 只是已经过期或被替代

### 第三步：把一句人话写进 `summary`

不要只写内部术语。

好的写法：

- `发现 run-group 次数声明与已上传 attempts 不一致，先暂停公开展示。`
- `复核后确认旧条目遗漏人工输入记录，旧结果失效。`
- `新版本已发布，旧版本转历史归档。`

差的写法：

- `已处理`
- `异常`
- `不通过`

---

## 10. 推荐的治理动作模板

## 10.1 打开争议

```json
{
  "entry_id": "entry_xxx",
  "publication_state": "disputed",
  "reason_code": "operator_dispute_opened",
  "summary": "发现可疑声明，先暂停公开展示，等待进一步复核。",
  "at": "2026-04-23T10:00:00.000Z",
  "actor": "operator:solo-admin"
}
```

## 10.2 进入修正中

```json
{
  "entry_id": "entry_xxx",
  "publication_state": "corrected",
  "reason_code": "operator_correction_requested",
  "summary": "旧结果需要修正后重审，暂不恢复活跃榜单。",
  "at": "2026-04-23T12:00:00.000Z",
  "actor": "operator:solo-admin"
}
```

## 10.3 判定失效

```json
{
  "entry_id": "entry_xxx",
  "publication_state": "invalidated",
  "reason_code": "operator_invalidated_after_review",
  "summary": "复核后确认关键事实不成立，旧结果失效，只保留历史说明。",
  "at": "2026-04-23T14:00:00.000Z",
  "actor": "operator:solo-admin"
}
```

## 10.4 归档

```json
{
  "entry_id": "entry_xxx",
  "publication_state": "archived",
  "reason_code": "operator_archived_superseded_result",
  "summary": "旧结果已被新版本替代，转入历史归档。",
  "at": "2026-04-23T16:00:00.000Z",
  "actor": "operator:solo-admin"
}
```

---

## 11. 单人低成本运营时，最值得坚持的 6 条习惯

1. **先 disputed，再慢慢查**
   - 不要为了“榜单不断更”而把可疑结果继续挂着

2. **所有治理动作都写 `reason_code + summary`**
   - 以后你自己回头看，也能知道当时为什么这么做

3. **不要直接删条目**
   - 优先走状态机
   - 让历史留下来

4. **不要直接把 corrected 当恢复**
   - corrected 只是“修正中”
   - 不是“已经洗白”

5. **不要让 demo fallback 回流到真榜**
   - v0.2 已经明确 fail-closed
   - 没有真实 eligible entry，就允许空榜

6. **不要把 publication_state 说成 trust_tier**
   - `published` 不等于 `verified`
   - `disputed` 也不是能力分下降

---

## 12. 一句最通俗的人话解释

如果你完全不懂算法，可以把这套治理想成：

> **榜单不是“谁分高谁永远挂着”，而是“谁现在既有成绩、又过了规则、又没在争议里”。**

如果一条结果出了问题：

- 先暂停
- 再调查
- 再决定是修、是废、还是归档

这样做的好处是：

- 便宜
- 清楚
- 不容易误伤
- 也不容易让假结果一直挂在榜上

---

## 13. 当前实现约束（运营时必须知道）

截至当前代码版本，下面这些约束已经是真实现：

1. `publication-governance.json` 是 **worker 输入源**
   - 不是数据库
   - 但足够适合单人运营

2. 当前状态机会严格校验迁移是否合法
   - 非法迁移会报错

3. `published -> corrected` 当前不允许直接跳
   - 必须先 `disputed`

4. `disputed / corrected / invalidated / archived / rejected`
   - 都不会再进入活跃榜单

5. 前端 entry detail 已开始展示
   - state notice
   - state history
   - board disposition

---

## 14. 下一步建议

如果你准备继续完善这套机制，建议下一步做这 3 件事：

1. 增加 `supersedes / superseded_by` 关系
   - 让“新结果替代旧结果”更清楚

2. 增加 repeated-run / uncertainty 展示
   - 让排名不只看单次点估计

3. 后面如果再做后台
   - 再把 `publication-governance.json` 升级成可操作 UI

在那之前，当前这套 JSON 治理层已经足够支撑单人、低预算、可审计运营。
