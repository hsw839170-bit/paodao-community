# 订单状态机文档 (Order State Machine)

> 本文档描述 DeltaRun 订单系统的状态流转规则。
> 
> 最后更新：2026-03-25
> 状态：正式规则 + 草案（已标注）

---

## 1. 当前正式支持的状态流转

### 1.1 订单状态枚举

```typescript
enum OrderStatus {
  PENDING     // 待接单 - 初始状态
  ACCEPTED    // 已接单 - 跑手确认接单
  IN_PROGRESS // 进行中 - 跑手开始服务
  COMPLETED   // 已完成 - 订单完成
  CANCELED    // 已取消 - 订单取消
}

enum OrderMode {
  PRIVATE     // 指定跑手
  PUBLIC      // 公开发布（抢单大厅）
}
```

### 1.2 正式状态流转图

```
                    ┌─────────────┐
                    │   PENDING   │ ← 初始状态
                    │   (待接单)   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   ACCEPTED    │  │   CANCELED    │  │   (过期自动)   │
│   (已接单)     │  │   (已取消)     │  │  → CANCELED   │
└───────┬───────┘  └───────────────┘  └───────────────┘
        │
        │ (进度更新)
        ▼
┌───────────────┐
│ IN_PROGRESS   │
│  (进行中)      │
└───────┬───────┘
        │
        │ (完成)
        ▼
┌───────────────┐
│   COMPLETED   │
│   (已完成)     │
└───────────────┘
```

### 1.3 正式支持的流转规则

| 当前状态 | 目标状态 | 触发条件 | 权限 | API |
|---------|---------|---------|------|-----|
| PENDING | ACCEPTED | 跑手接单/抢单 | RUNNER | `PUT /orders/[id]/accept` 或 `PUT /orders/[id]/claim` |
| PENDING | CANCELED | 取消订单 | BOSS/订单所有者 | `PUT /orders/[id]/cancel` |
| ACCEPTED | IN_PROGRESS | 更新进度 | RUNNER | `PUT /orders/[id]/progress` |
| ACCEPTED | COMPLETED | 直接完成 | RUNNER | `PUT /orders/[id]/complete` |
| IN_PROGRESS | COMPLETED | 更新进度为100% | RUNNER | `PUT /orders/[id]/progress` |
| ACCEPTED | COMPLETED | 超时自动完成（24h）| SYSTEM | Cron 自动执行 |
| * | CANCELED | 超时未接单 | SYSTEM | （根据 claimDeadline）|

### 1.4 当前状态权限矩阵

| 状态 | BOSS 可操作 | RUNNER 可操作 | SYSTEM 可操作 |
|------|------------|--------------|--------------|
| PENDING | 查看、取消 | 查看、接单/抢单 | 过期检查 |
| ACCEPTED | 查看 | 查看、更新进度、完成 | 超时自动完成 |
| IN_PROGRESS | 查看 | 查看、更新进度 | 超时自动完成 |
| COMPLETED | 查看、评价 | 查看 | - |
| CANCELED | 查看 | 查看 | - |

---

## 2. 预留接口（草案，暂未启用）

> ⚠️ 以下内容为草案，尚未实现，仅作为接口占位符

### 2.1 放弃订单 (Abandon)

**接口**: `PUT /api/orders/[id]/abandon`

**使用场景**: 跑手接单后，因故无法完成，主动放弃订单

**草案状态流转**:
```
ACCEPTED → [ABANDONED] → PENDING (回退到抢单池)
                ↓
         CANCELED (彻底取消)
```

**待确定事项**:
1. **状态选择**: 放弃后订单回退到 PENDING 还是进入 ABANDONED？
   - 方案 A: 回退 PENDING（其他跑手可接）
   - 方案 B: 进入 ABANDONED（等待老板确认）
   - 方案 C: 直接 CANCELED

2. **惩罚机制**:
   - 首次放弃：警告
   - 多次放弃：限制接单权限 / 信用分 -5
   - 频繁放弃：封号处理

3. **通知机制**:
   - 是否通知老板？
   - 是否记录放弃原因？

**当前实现**: 接口仅做参数校验，返回占位响应，不修改订单状态

---

### 2.2 协商取消 (Negotiate Cancel)

**接口**: `PUT /api/orders/[id]/negotiate-cancel`

**使用场景**: 老板和跑手双方沟通后，一致同意取消订单

**草案流程**:
```
当前状态 (PENDING/ACCEPTED/IN_PROGRESS)
    ↓
一方发起协商取消请求
    ↓
另一方收到通知，确认/拒绝
    ↓
双方确认 → CANCELED
    ↓
根据责任判定信用分影响
```

**待确定事项**:
1. **确认时限**: 对方多久内需要响应？超时如何处理？
   - 建议：24 小时超时
   - 超时未响应：自动拒绝 / 自动同意（待定）

2. **取消原因分类**:
   - MUTUAL_AGREEMENT（双方协商一致）- 无惩罚
   - TIME_ISSUE（时间问题）- 轻惩罚
   - AMOUNT_DISPUTE（金额争议）- 视责任判定
   - SERVICE_ISSUE（服务问题）- 视责任判定
   - FORCE_MAJEURE（不可抗力）- 无惩罚
   - OTHER（其他）- 轻惩罚

3. **赔付机制**:
   - 是否需要赔付？
   - 赔付金额如何计算？
   - 谁承担赔付？

4. **重新交易**:
   - 取消后老板能否重新发布？
   - 跑手能否重新接单？

**当前实现**: 接口仅做参数校验，返回占位响应，不修改订单状态

---

## 3. 状态机设计建议

### 3.1 新增状态考虑

如果引入放弃/协商取消机制，可能需要新增以下状态：

```typescript
enum OrderStatus {
  // 现有状态
  PENDING
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  CANCELED
  
  // 草案状态（待确定）
  ABANDONED        // 跑手已放弃，等待处理
  NEGOTIATING      // 协商取消中
  DISPUTED         // 争议中（平台介入）
}
```

### 3.2 订单日志补充

建议在所有状态流转时创建 OrderLog：

```typescript
// 示例日志类型
interface OrderLog {
  orderId: string
  action: 'CREATE' | 'ACCEPT' | 'ABANDON' | 'NEGOTIATE_CANCEL' | 'COMPLETE' | 'CANCEL'
  actorType: 'BOSS' | 'RUNNER' | 'SYSTEM'
  actorId: string
  message: string
  metadata?: {
    reason?: string
    reasonType?: string
    previousStatus?: OrderStatus
    newStatus?: OrderStatus
  }
}
```

### 3.3 信用分机制草案

```typescript
interface CreditScoreRule {
  action: string
  points: number
  cooldown?: number  // 冷却期（天）
  limit?: number     // 触发限制的次数
}

const CREDIT_RULES: CreditScoreRule[] = [
  { action: 'ABANDON_FIRST', points: -5, cooldown: 7 },
  { action: 'ABANDON_REPEAT', points: -20, limit: 3 },
  { action: 'NEGOTIATE_CANCEL_MUTUAL', points: 0 },
  { action: 'NEGOTIATE_CANCEL_FAULT', points: -10 },
]
```

---

## 4. 决策检查清单

在启用放弃/协商取消功能前，需要确定：

- [ ] 放弃订单后的订单状态（PENDING/ABANDONED/CANCELED）
- [ ] 放弃订单的惩罚机制（信用分/限制接单/封号）
- [ ] 协商取消的确认时限（24小时/48小时）
- [ ] 协商取消的超时处理（自动拒绝/自动同意）
- [ ] 取消原因的分类和责任判定规则
- [ ] 是否需要赔付机制
- [ ] 通知机制（短信/推送/站内信）
- [ ] 是否需要平台介入流程

---

## 5. 相关文件

- API 实现: `app/api/orders/[id]/abandon/route.ts` (占位符)
- API 实现: `app/api/orders/[id]/negotiate-cancel/route.ts` (占位符)
- 本文档: `docs/ORDER_STATE_MACHINE.md`

---

*本文档为草案，最终规则以产品决策为准。*
