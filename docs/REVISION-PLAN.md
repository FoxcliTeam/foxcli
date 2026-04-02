# 文档修正计划

> 目标：补充源码级洞察，让每篇文档从"概念科普"升级为"逆向工程白皮书"水准。

---

## 第一梯队：空壳页，需要大幅重写

### 1. `safety/sandbox.mdx` — 沙箱机制 ✅ DONE

**现状**：35 行，只列了"文件系统/网络/进程/时间"四个维度，没有任何实现细节。

**修正方向**：
- 补充 macOS `sandbox-exec` 的实际调用方式，展示沙箱 profile 的关键片段
- 说明 `getSandboxConfig()` 的判定逻辑：哪些命令走沙箱、哪些跳过
- 补充 `dangerouslyDisableSandbox` 参数的设计权衡
- 加入 Linux 平台的沙箱差异对比（seatbelt vs namespace）
- 展示一次命令执行从权限检查→沙箱包裹→实际执行的完整链路

---

### 2. `introduction/what-is-claude-code.mdx` — 什么是 Claude Code ✅ DONE

**现状**：39 行，纯营销文案，和"普通聊天 AI"的对比表太低级。

**修正方向**：
- 砍掉"能做什么"的泛泛列表，改为一个具体的端到端示例（从用户输入→系统处理→最终输出）
- 用一张简化架构图替代文字描述，让读者 30 秒建立直觉
- 补充 Claude Code 的技术定位：不是 IDE 插件、不是 Web Chat，而是 terminal-native agentic system
- 加入与 Cursor / Copilot / Aider 等工具的定位差异（架构层面而非功能清单）

---

### 3. `introduction/why-this-whitepaper.mdx` — 为什么写这份白皮书 ✅ DONE

**现状**：40 行，全是空话，四张 Card 只是后续章节标题的预告。

**修正方向**：
- 明确定位：这是对 Anthropic 官方 CLI 的逆向工程分析，不是官方文档
- 列出逆向过程中发现的 3-5 个最意外/最精妙的设计决策（吊住读者胃口）
- 说明白皮书的阅读路线图：推荐的阅读顺序和每个章节解决什么问题
- 补充"这份白皮书不是什么"——不是使用教程，不是 API 文档

---

### 4. `safety/why-safety-matters.mdx` — 为什么安全至关重要 ✅ DONE

**现状**：40 行，只列了显而易见的风险，"安全 vs 效率的平衡"只有 3 个 bullet。

**修正方向**：
- 从源码角度展示安全体系的全景图：权限规则 → 沙箱 → Plan Mode → 预算上限 → Hooks 的纵深防御链
- 补充 Claude 自身 System Prompt 中的安全指令（"执行前确认"、"优先可逆操作"等），展示 AI 端的安全约束
- 用真实场景说明"安全 vs 效率"的工程权衡：比如 Read 工具为什么免审批、Bash 工具为什么要逐条确认
- 加入 Prompt Injection 防御的简要说明（tool result 中的恶意内容如何被系统标记）

---

## 第二梯队：有骨架但太浅，需要补肉

### 5. `conversation/streaming.mdx` — 流式响应 ✅ DONE

**现状**：43 行，只说了"流式好"和 3 行 provider 表。

**修正方向**：
- 补充 `BetaRawMessageStreamEvent` 的核心事件类型及其含义
- 展示文本 chunk 和 tool_use block 交织的状态机流转
- 说明流式中的错误处理：网络断开、API 限流、token 超限时的重试/降级策略
- 补充 `processStreamEvents()` 的核心逻辑：如何从事件流中分离出文本、工具调用、usage 统计

---

### 6. `tools/search-and-navigation.mdx` — 搜索与导航 ✅ DONE

**现状**：43 行，只说 Glob 和 Grep 存在。

**修正方向**：
- 补充 ripgrep 二进制的内嵌方式（vendor 目录、平台适配）
- 说明搜索结果的 head_limit 默认 250 的设计原因（token 预算）
- 展示 ToolSearch 的实现：如何用语义匹配在 50+ 工具（含 MCP）中找到最相关的
- 补充 Glob 按修改时间排序的意义：最近修改的文件最可能与当前任务相关

---

### 7. `tools/task-management.mdx` — 任务管理 ✅ DONE

**现状**：50 行，只有流程 Steps 和状态展示的 4 个 bullet。

**修正方向**：
- 补充任务的数据模型：id / subject / description / status / blockedBy / blocks / owner
- 说明依赖管理的实现：blockedBy 如何阻止任务被认领、完成一个任务后如何自动解锁下游
- 展示任务与 Agent 工具的联动：子 Agent 如何认领任务、报告进度
- 补充 activeForm 字段的 UX 设计：进行中任务的 spinner 动画文案

---

### 8. `context/token-budget.mdx` — Token 预算管理 ✅ DONE

**现状**：55 行，预算控制只有 3 张 Card 各一句话。

**修正方向**：
- 补充 `contextWindowTokens` 和 `maxOutputTokens` 的动态计算逻辑
- 说明缓存 breakpoint 的放置策略：System Prompt 中不变内容在前、变化内容在后的原因
- 展示工具输出截断的具体机制：超长结果如何被 truncate、何时触发 micro-compact
- 补充 token 计数的实现：`countTokens` 的调用时机和近似 vs 精确计数的权衡

---

### 9. `agent/worktree-isolation.mdx` — Worktree 隔离 ✅ DONE

**现状**：55 行，只描述了 git worktree 的概念。

**修正方向**：
- 展示 `.claude/worktrees/` 的目录结构和分支命名规则
- 说明 worktree 的生命周期：创建时机（`isolation: "worktree"`）→ 子 Agent 执行 → 完成/放弃 → 自动清理
- 补充 worktree 与子 Agent 的绑定关系：Agent 结束时如何判断 keep or remove
- 加入 EnterWorktree / ExitWorktree 工具的交互设计

---

### 10. `extensibility/custom-agents.mdx` — 自定义 Agent ✅ DONE

**现状**：56 行，只有配置表和示例表。

**修正方向**：
- 展示 agent markdown 文件的完整 frontmatter 格式（name / description / model / allowedTools 等）
- 说明 agent 如何被加载和注入 System Prompt：`loadAgentDefinitions()` 的发现和合并逻辑
- 展示工具限制的实现：allowedTools 如何过滤工具列表
- 补充 agent 与 subagent_type 参数的关联：Agent 工具如何指定使用自定义 Agent
