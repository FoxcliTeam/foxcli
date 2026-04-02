/**
 * Stub: SDK Control Types (not yet published in open-source).
 * Used by bridge/transport layer for the control protocol.
 */
export type SDKControlRequest = { type: string; [key: string]: unknown }
export type SDKControlResponse = { type: string; [key: string]: unknown }
export type StdoutMessage = any;
export type SDKControlInitializeRequest = any;
export type SDKControlInitializeResponse = any;
export type SDKControlMcpSetServersResponse = any;
export type SDKControlReloadPluginsResponse = any;
export type StdinMessage = any;
export type SDKPartialAssistantMessage = any;
export type SDKControlPermissionRequest = any;
export type SDKControlCancelRequest = any;
export type SDKControlRequestInner = any;
