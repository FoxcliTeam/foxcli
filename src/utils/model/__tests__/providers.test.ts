import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { getAPIProvider, isFirstPartyAnthropicBaseUrl } from "../providers";
import {
  DEEPSEEK_V4_FLASH_CONFIG,
  CLAUDE_OPUS_CONFIG,
  MOONSHOT_KIMI_K2_5_CONFIG,
} from "../configs";

describe("getAPIProvider", () => {
  const envKeys = [
    "CLAUDE_CODE_USE_BEDROCK",
    "CLAUDE_CODE_USE_VERTEX",
    "CLAUDE_CODE_USE_FOUNDRY",
    "CLAUDE_CODE_USE_OPENAI",
  ] as const;
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of envKeys) savedEnv[key] = process.env[key];
  });

  afterEach(() => {
    for (const key of envKeys) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });

  test('returns "firstParty" by default', () => {
    delete process.env.CLAUDE_CODE_USE_BEDROCK;
    delete process.env.CLAUDE_CODE_USE_VERTEX;
    delete process.env.CLAUDE_CODE_USE_FOUNDRY;
    expect(getAPIProvider()).toBe("firstParty");
  });

  test('returns "bedrock" when CLAUDE_CODE_USE_BEDROCK is set', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = "1";
    expect(getAPIProvider()).toBe("bedrock");
  });

  test('returns "vertex" when CLAUDE_CODE_USE_VERTEX is set', () => {
    process.env.CLAUDE_CODE_USE_VERTEX = "1";
    expect(getAPIProvider()).toBe("vertex");
  });

  test('returns "foundry" when CLAUDE_CODE_USE_FOUNDRY is set', () => {
    process.env.CLAUDE_CODE_USE_FOUNDRY = "1";
    expect(getAPIProvider()).toBe("foundry");
  });

  test("bedrock takes precedence over vertex", () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = "1";
    process.env.CLAUDE_CODE_USE_VERTEX = "1";
    expect(getAPIProvider()).toBe("bedrock");
  });

  test("bedrock wins when all three env vars are set", () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = "1";
    process.env.CLAUDE_CODE_USE_VERTEX = "1";
    process.env.CLAUDE_CODE_USE_FOUNDRY = "1";
    expect(getAPIProvider()).toBe("bedrock");
  });

  test('"true" is truthy', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = "true";
    expect(getAPIProvider()).toBe("bedrock");
  });

  test('"0" is not truthy', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = "0";
    expect(getAPIProvider()).toBe("firstParty");
  });

  test('empty string is not truthy', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = "";
    expect(getAPIProvider()).toBe("firstParty");
  });

  test('returns "openai" for built-in models with openai protocol', () => {
    delete process.env.CLAUDE_CODE_USE_OPENAI;
    expect(getAPIProvider(DEEPSEEK_V4_FLASH_CONFIG)).toBe("openai");
    expect(getAPIProvider(MOONSHOT_KIMI_K2_5_CONFIG)).toBe("openai");
  });

  test('returns "firstParty" for built-in models with anthropic protocol', () => {
    delete process.env.CLAUDE_CODE_USE_OPENAI;
    expect(getAPIProvider(CLAUDE_OPUS_CONFIG)).toBe("firstParty");
  });

  test('CANONICAL_ID_TO_PROTOCOL takes precedence over env vars for built-in models', () => {
    process.env.CLAUDE_CODE_USE_OPENAI = "1";
    // claude-opus-4-6 is anthropic protocol, so it should still return firstParty
    expect(getAPIProvider(CLAUDE_OPUS_CONFIG)).toBe("firstParty");
    // deepseek-v4-flash is openai protocol, so it should return openai (matches env)
    expect(getAPIProvider(DEEPSEEK_V4_FLASH_CONFIG)).toBe("openai");
  });
});

describe("isFirstPartyAnthropicBaseUrl", () => {
  const originalBaseUrl = process.env.ANTHROPIC_BASE_URL;
  const originalUserType = process.env.USER_TYPE;

  afterEach(() => {
    if (originalBaseUrl !== undefined) {
      process.env.ANTHROPIC_BASE_URL = originalBaseUrl;
    } else {
      delete process.env.ANTHROPIC_BASE_URL;
    }
    if (originalUserType !== undefined) {
      process.env.USER_TYPE = originalUserType;
    } else {
      delete process.env.USER_TYPE;
    }
  });

  test("returns true when ANTHROPIC_BASE_URL is not set", () => {
    delete process.env.ANTHROPIC_BASE_URL;
    expect(isFirstPartyAnthropicBaseUrl()).toBe(true);
  });

  test("returns true for api.anthropic.com", () => {
    process.env.ANTHROPIC_BASE_URL = "https://api.anthropic.com";
    expect(isFirstPartyAnthropicBaseUrl()).toBe(true);
  });

  test("returns false for custom URL", () => {
    process.env.ANTHROPIC_BASE_URL = "https://my-proxy.com";
    expect(isFirstPartyAnthropicBaseUrl()).toBe(false);
  });

  test("returns false for invalid URL", () => {
    process.env.ANTHROPIC_BASE_URL = "not-a-url";
    expect(isFirstPartyAnthropicBaseUrl()).toBe(false);
  });

  test("returns true for staging URL when USER_TYPE is ant", () => {
    process.env.ANTHROPIC_BASE_URL = "https://api-staging.anthropic.com";
    process.env.USER_TYPE = "ant";
    expect(isFirstPartyAnthropicBaseUrl()).toBe(true);
  });

  test("returns true for URL with path", () => {
    process.env.ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
    expect(isFirstPartyAnthropicBaseUrl()).toBe(true);
  });

  test("returns true for trailing slash", () => {
    process.env.ANTHROPIC_BASE_URL = "https://api.anthropic.com/";
    expect(isFirstPartyAnthropicBaseUrl()).toBe(true);
  });

  test("returns false for subdomain attack", () => {
    process.env.ANTHROPIC_BASE_URL = "https://evil-api.anthropic.com";
    expect(isFirstPartyAnthropicBaseUrl()).toBe(false);
  });
});
