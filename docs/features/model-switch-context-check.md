# 模型切换上下文检查

> Feature Flag: 无（常驻功能，仅对特定模型生效）
> 实现状态：完整
> 涉及文件数：5

## 一、功能概述

切换模型时，若当前对话的上下文已接近目标模型的输入上限，阻止切换并给出提示，避免切换后 API 请求因超限而失败。

**一期范围**：仅对以下小上下文窗口模型生效（切换其他模型不检查）：

| 模型 | config 常量 | 上下文窗口 |
|------|------------|-----------|
| `kimi-k2.7-code` | `MOONSHOT_KIMI_K2_6_CONFIG` | ~256K |
| `ring-2.6-1t` | `RING_2_6_1T_CONFIG` | ~256K |

**阈值**：当前上下文 >= 目标模型窗口的 **90%** 时阻止切换。

## 二、实现架构

### 2.1 上下文大小追踪

```
┌───────────┐  每轮查询完成后    ┌──────────────┐
│  REPL.tsx │ ─────────────────→ │  AppState    │
│ messages  │  tokenCountEst.    │ currentContextTokens
└───────────┘                    └──────────────┘
                                      │
                                      │ 模型切换时读取
                                      ▼
                              ┌──────────────────┐
                              │ checkContextSwitch│
                              │ NeedsWarning()   │
                              └──────────────────┘
```

- **数据来源**：`tokenCountWithEstimation(messages)` — 从最后一条 assistant message 的 API `usage` 对象中取 `input + cache + output tokens`，再估算其后新增的消息
- **更新时机**：`REPL.tsx` 中 `onQueryImpl` 完成后，`await onTurnComplete?.(...)` 之后，通过 `store.setState()` 写入 AppState（不走 React re-render 路径）

### 2.2 检查逻辑

`src/utils/context.ts` → `checkContextSwitchNeedsWarning(targetModel, currentContextTokens)`

1. `targetModel.toLowerCase()` 是否包含 `kimi-k2.7-code` 或 `ring-2.6-1t` → 不是则放行
2. `currentContextTokens` 是否为 null/0 → 空对话则放行
3. 调 `getContextWindowForModel(targetModel)` 获取目标模型上下文窗口
4. `currentContextTokens >= contextWindow * 0.9` → 阻止并返回警告消息

### 2.3 模型切换点（三处拦截）

| 路径 | 文件 | 组件/函数 | 拦截方式 |
|------|------|----------|---------|
| `/model` 交互式选择 | `src/commands/model/model.tsx` | `ModelPickerWrapper.handleSelect` | 读 `useAppState(s => s.currentContextTokens)`，失败时 `onDone(message, { display: 'system' })` |
| `/model <name>` 命令行 | `src/commands/model/model.tsx` | `SetModelAndClose` → `handleModelChange` | 同上 |
| Cmd+P 快捷键 | `src/components/PromptInput/PromptInput.tsx` | `handleModelSelect` | 读 `store.getState().currentContextTokens`，失败时 `addNotification` 显示告警 |

## 三、修改文件一览

| 文件 | 改动 |
|------|------|
| `src/state/AppStateStore.ts` | AppState 类型增加 `currentContextTokens: number \| null` 字段，默认值 `null` |
| `src/screens/REPL.tsx` | import `tokenCountWithEstimation`；onQueryImpl 完成后更新 `currentContextTokens` |
| `src/utils/context.ts` | 新增 `checkContextSwitchNeedsWarning()` |
| `src/commands/model/model.tsx` | import `checkContextSwitchNeedsWarning`；两处切换点加入检查 |
| `src/components/PromptInput/PromptInput.tsx` | import + `handleModelSelect` 加入检查 |

## 四、上下文统计方式对比

本次功能使用的 `tokenCountWithEstimation()` 与 `/context` 命令使用的 `analyzeContextUsage()` 存在差异：

| | 本次功能 | `/context` 命令 |
|---|---|---|
| 核心函数 | `tokenCountWithEstimation()` | `analyzeContextUsage()` |
| Token 来源 | API `usage` + rough estimate | API `usage`（优先）；分类明细（次要） |
| 统计范围 | input + cache + **output** | input + cache（不含 output） |
| 倾向 | **保守**（计入模型输出） | 精确（更匹配 statusline） |
| 适用场景 | 安全校验，宁可误拦不可放过 | 用户可见的精确分解展示 |

`tokenCountWithEstimation` 计入了 output tokens，对本次功能的场景更合适——防止用户切到小窗口后 API 请求因超限失败。

## 五、扩展

如需对更多模型启用此检查，只需修改 `src/utils/context.ts` 中的 `MODELS_WITH_LIMITED_CONTEXT` 数组：

```typescript
const MODELS_WITH_LIMITED_CONTEXT = ['kimi-k2.7-code', 'ring-2.6-1t']
```

无需改动任何其他代码。
