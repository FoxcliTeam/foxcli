# Langcli

<div align="center">

[English](/README.md) | [简体中文](./README_zh.md)

</div>

Langcli 是一款在终端中使用的交互式 AI 编程助手, 它是基于Claude code的最佳实践进行开发而成。它有这些特点：
- Langcli 与 Claude Code 100% 兼容。因此，使用 Langcli 的方式与标准 Claude Code 完全相同，并且你现有项目中的 .claude或skills 目录也完全适用于 Langcli。
- 更令人兴奋的是Langcli与[LangRouter](https://langrouter.ai/)已深度集成，这样，你可以在一个正在工作的session中根据需求随意使用、切换主流的LLM 模型(包括Claude OPUS 4.8, GLM 5.3 flash, GLM 5.2, GPT 5.6 sol, Deepseek v4 pro, Deepseek v4 flash, Kimi K2.7 code, Minimax M3, Mimo 2.5 pro等)，而不会中断你的上下文。

<div align="center">
  <img title="Langcli" height=400 alt="Alt text" src="/docs/assets/screen.jpg">
</div>

## 赞助商

<table align="center">
  <tr>
    <td align="center" width="150" height="80">
      <a href="https://langrouter.ai/">
        <img src="/assets/langrouter-logo.svg" alt="Langrouter logo" width="72">
      </a>
    </td>
    <td align="center" width="150" height="80">
      <a href="https://mimo.mi.com">
        <img src="https://mimo.xiaomi.com/mimo-v2-pro/assets/logo.svg" alt="Xiaomi MiMo logo" width="136">
      </a>
    </td>
  </tr>
  <tr>
    <td align="center"><a href="https://langrouter.ai/"><strong>LangRouter</strong></a></td>
    <td align="center"><a href="https://mimo.mi.com"><strong>小米 MiMo</strong></a></td>
  </tr>
</table>

## 安装

### 快速安装（推荐）

#### Linux / macOS

```bash
bash -c "$(curl -fsSL https://assets.langcli.com/installation/install-langcli.sh)"
```

#### Windows (请使用Administrator运行Powershell)

```cmd
cmd /c "curl -fsSL -o %TEMP%\install-langcli.bat https://assets.langcli.com/installation/install-langcli.bat && %TEMP%\install-langcli.bat"
```

> **备注**: 安装完成后建议重启终端，以确保环境变量生效。

### 手动安装

#### 前提条件

请确保您已安装 Node.js 20 或更高版本。如果你还没安装，请你[下载](https://nodejs.org/en/download)安装它。

#### NPM安装

```bash
npm i -g langcli-com
```

## 快速开始

#### LangRouter api-key准备
 去 [LangRouter](https://langrouter.ai/) 注册一个账号，保存api-key

#### 运行
```bash
# 启动langcli (交互式的)
langcli

# 然后，在回话中:
/help
```

## 自己从源代码编译、运行 (可选)

#### 环境要求

- [Bun](https://bun.sh/) >= 1.3.11

#### 安装依赖

```bash
bun install
```

#### 运行

```bash
# 开发模式启动
bun run dev

# 编译运行
bun run build && bun dist/cli.js
```

构建出的版本 bun 和 node 都可以启动, 你 publish 到私有源可以直接启动

如果遇到 bug 请直接提一个 issues, 我们优先解决

## 致谢
本项目是在[CCB](https://github.com/claude-code-best/claude-code)的基础上进行二次开发而成，致敬CCB项目的贡献者们。

## 许可证
本项目仅供学习研究用途。Claude Code 的所有权利归 [Anthropic](https://www.anthropic.com/) 所有。
