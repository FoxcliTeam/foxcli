# ACP 模块对比：`src/services/acp` vs `t/acp`

> 对比日期：2026-08-26

`t/acp` 是 `src/services/acp` 的**重构 + 功能增强版**：对外 API 面（`entry.ts`、barrel 导出）保持一致，但内部拆分了模块并合入了大量协议行为修复。核心区别如下。

## 1. 架构差异

| | src/services/acp | t/acp |
|---|---|---|
| agent | 单文件 `agent.ts`（971 行） | 拆成 `agent/` 子模块：`AcpAgent.ts`（类壳）+ `createSessionMethod/sessionLifecycle/promptFlow`（通过 `Object.assign` 原型挂载，barrel 保证加载顺序）+ 纯函数模块（`permissionMode/promptQueue/configOptions/internalAccessors/sessionTypes`） |
| bridge | 单文件 `bridge.ts`（1238 行） | 拆成 `bridge/` 子模块：`forwarding/notifications/contentBlocks/toolResults/toolInfo/modelUsage/paths/types` |

## 2. t/acp 新增的协议行为（src 中没有）

### Session 生命周期

- **session/delete**：新增 `unstable_deleteSession` + `extMethod` 分发（幂等删除、ENOENT 容忍、未知方法返回 -32601）
- **forkSession 真正分叉**：加载源会话消息作为 `initialMessages`；src 版 fork 出的是空白会话
- **resume ≠ load**：`unstable_resumeSession` 传 `replay: false` 不回放历史（符合 session-setup.mdx）；src 两者都回放
- **listSessions**：显式拒绝分页 cursor、按 canonical cwd 严格过滤、无 cwd 时回退 `getOriginalCwd()`；src 只做 `limit: 100` 不过滤
- **会话文件定位改用 `resolveSessionFilePath`**（跨 git worktree 回退），并在 create/getOrCreate/prompt 前调用 `switchSession()` 保证 transcript 写入正确文件——src 只调 `setOriginalCwd`

### prompt 流程

- 空 prompt 改为抛错（invalid_params）；src 返回 `end_turn`
- 支持 `messageId` → `userMessageId` 回显（message-id RFD）
- AbortError 形态的错误也判定为 cancelled（收窄 interrupt/cancel 竞态窗口）
- 每会话发一次 `session_info_update`（派生标题 + updatedAt）
- usage 增加 `thoughtTokens` 并镜像到 `_meta.claudeCode.usage`

### 其他

- `setSessionMode` 额外发送 `current_mode_update` 通知
- `setSessionConfigOption` 校验 value 必须在 options 列表内（src 接受任意值）
- 权限桥新增 `onPermissionCancelled` 回调（客户端取消 → 触发会话中断而非普通 deny），并新增 "Always Reject" 选项

## 3. 能力宣告（initialize）变化

- `promptCapabilities.image: true → false`（诚实声明尚不支持多模态输入）
- fork 从 `sessionCapabilities.fork` 移到 `_meta.claudeCode.forkSession`（UNSTABLE 标注），新增 `_meta...delete`
- 显式 `authMethods: []`

## 4. 流式转发（bridge）修复

- **stopReason 映射修正**：max_tokens/refusal/isError 互斥分支、`error_*` 子类型 → `max_turn_requests`；src 只处理了 max_tokens 且存在覆盖问题
- **assistant 消息 messageId 跟踪**：同一条消息的所有 chunk 共享一个 UUID（`currentAgentMessageId`）

## 5. 小差异

- `utils.ts`：t 移除未用的 `nodeToWebReadable`，路径工具改用 `node:path/posix`（替代手动 `replaceAll('\\','/')`）
- `promptConversion.ts`：t 新增 BlobResource（base64 二进制）占位符输出
- 测试规模约为 src 的 1.5 倍（3811 vs 2580 行），覆盖上述新行为
- `entry.ts` 仅格式化差异，功能相同

## 结论

`t/acp` 是按 ACP 规范文档（session-setup.mdx、message-id.mdx、session-delete.mdx 等）逐条对齐后的版本，代码注释中大量引用规范条款和 audit 编号，属于更完整的实现。
