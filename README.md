# Langcli

<div align="center">

[English](./README.md) | [简体中文](./docs/README_zh.md)

</div>

Langcli is an interactive AI coding assistant in the terminal, built upon the best practices of Claude Code. It features:
- Langcli is 100% compatible with Claude Code. Therefore, the way to use Langcli is exactly the same as that of standard Claude Code and your existing projects' .claude or skills are all applicable to Langcli. 
- Even more exciting is that Langcli is deeply integrated with [LangRouter](https://langrouter.ai/),
allowing you to friendly use and switch between mainstream LLM models (including Claude OPUS 5, GLM 5.3 flash, GLM 5.2, GPT 5.6 sol, Deepseek v4 pro, Deepseek v4 flash, Kimi K2.7 code, Minimax M3, Mimo 2.5 pro, etc.) within an ongoing session as needed, without interrupting your context.

<div align="center">
  <img title="Langcli" height=400 alt="Alt text" src="./docs/assets/screen.jpg">
</div>

## Sponsors

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
    <td align="center"><a href="https://mimo.mi.com"><strong>Xiaomi MiMo</strong></a></td>
  </tr>
</table>

## Installation

### Quick Install (Recommended)

#### Linux / macOS

```bash
bash -c "$(curl -fsSL https://assets.langcli.com/installation/install-langcli.sh)"
```

#### Windows (Run as Administrator CMD)

```cmd
cmd /c "curl -fsSL -o %TEMP%\install-langcli.bat https://assets.langcli.com/installation/install-langcli.bat && %TEMP%\install-langcli.bat"
```

> **Note**: It's recommended to restart your terminal after installation to ensure environment variables take effect.

### Manual Installation

#### Prerequisites

Make sure you have Node.js 20 or later installed. Download it from [nodejs.org](https://nodejs.org/en/download).

#### NPM installation

```bash
npm i -g langcli-com
```

## Quick Start

#### LangRouter API Key Preparation
 Go to [LangRouter](https://langrouter.ai/), register an account, save your API key.

#### Running
```bash
# Start Langcli (interactive)
langcli

# Then, in the session:
/help
```

## Compile from source code yourself (optional)

#### Environmental requirements

- [Bun](https://bun.sh/) >= 1.3.11

#### Install dependencies

```bash
bun install
```

#### Running

```bash
# Development mode
bun run dev

# Build and run
bun run build && bun dist/cli.js
```

The built version can be started with both bun and node. You can publish to a private registry and start directly.

If you encounter any bugs, please open an issue and we will prioritize fixing them.

## Acknowledgement
This project is a secondary development based on [CCB](https://github.com/claude-code-best/claude-code), and we pay tribute to the contributors of the CCB project.

## License
This project is for educational and research purposes only. All rights to Claude Code belong to [Anthropic](https://www.anthropic.com/).
