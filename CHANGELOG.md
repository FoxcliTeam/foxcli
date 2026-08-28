# Changelog

## 0.1.46

- Fixed User-Agent for openai reqeusts
- Fixed reasoning_effort for openai reqeusts

## 0.1.45

- Added GLM 5.3 flash model

## 0.1.44

- Added /goal command and function
- Fixed bash mode output display problem
- Fixed openaiConvertMessages image block convert problem

## 0.1.43

- Fixed free model max_tokens problem

## 0.1.42

- Fixed effort setting problem for laude-opus-4-8 

## 0.1.41

- Replace claude-opus-4-6 with claude-opus-4-8
- Replace gpt-5.5 with gpt-5.6-sol
- Replace kimi-k2.6 with kimi-k2.7-code

## 0.1.40

- Replace minimax-m2.5 with minimax-m3

## 0.1.39

- Update GLM 5.1 to GLM 5.2

## 0.1.38

- End Xiaomi Mimo model free campaign

## 0.1.37

- Replace gpt-5.3-codex with gpt-5.4 and gpt-5.5

## 0.1.36

- Collaboration with Xiaomi Mimo, and highlight the Mimo models

## 0.1.35

- /connect command now support Mimo models; disabled AttributionHeader

## 0.1.34

- Fix missing scripts/setup-chrome-mcp.mjs

## 0.1.33

- Add Chrome Use function which doesn't need Anthropic subscription 

## 0.1.32

- Fix model name for Mimo 2.5 pro

## 0.1.31

- Add Mimo 2.5 pro model, free for 2 weeks

## 0.1.30

- Change ring-2.6-1t model description

## 0.1.29

- Modified the thinking handling logic of the Anthropic protocol to cooperate with the LangRouter upgrade.

## 0.1.28

- Fix 1M context size for custom models defined in modelProviders session of settings.json

## 0.1.27

- When using custom model, getDefaultOpusModel、getDefaultSonnetModel、getDefaultHaikuModel、getDefaultFreeModel all point to the custom model.

## 0.1.26

- Add Ring 2.6 1T model

## 0.1.25

- Fix thinking block missing problem when using anthropic protocol + deepseek v4

## 0.1.24

- Fix the onboarding logic

## 0.1.23

- Fix the issue where the context window size is displayed incorrectly.

## 0.1.22

- Sync acp code from upstream repo

## 0.1.21

- Fix metricsOptOut api problem

## 0.1.20

- Add preventive measures for handling DeepSeek's reasoning_content.

## 0.1.19

- Fix applyPromptToMarkdown bug for web_fetch tool

## 0.1.18

- Fix acp duplicate resp text for thinking model

## 0.1.17

- Fix opus 4.6 thinking bug

## 0.1.16

- Default open verbose mode(include thinking in messages stream)

## 0.1.15

- Fix reansoning content missing bug

## 0.1.14

- Support ACP

## 0.1.13

- Route all preset no-claude models to openai protocol

## 0.1.12

- Support Deepseek v4 models(include flash and pro)

## 0.1.11

- Support custom models
- disable telemetry
