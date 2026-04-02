import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { use } from 'react';
import { Box } from '../ink.js';
import type { AgentDefinitionsResult } from '../tools/AgentTool/loadAgentsDir.js';
import { getMemoryFiles } from '../utils/claudemd.js';
import { getGlobalConfig } from '../utils/config.js';
import { getActiveNotices, type StatusNoticeContext } from '../utils/statusNoticeDefinitions.js';
type Props = {
  agentDefinitions?: AgentDefinitionsResult;
};

/**
 * StatusNotices contains the information displayed to users at startup. We have
 * moved neutral or positive status to src/components/Status.tsx instead, which
 * users can access through /status.
 */
export function StatusNotices(t0) {
  const $ = _c(4);
  const {
    agentDefinitions
  } = t0 === undefined ? {} : t0;
  const t1 = getGlobalConfig();
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = getMemoryFiles();
    $[0] = t2;
  } else {
    t2 = $[0];
  }
  const context = {
    config: t1,
    agentDefinitions,
    memoryFiles: use(t2) as any
  };
  const activeNotices = getActiveNotices(context);
  if (activeNotices.length === 0) {
    return null;
  }
  const T0 = Box;
  const t3 = "column";
  const t4 = 1;
  const t5 = activeNotices.map(notice => <React.Fragment key={notice.id}>{notice.render(context)}</React.Fragment>);
  let t6;
  if ($[1] !== T0 || $[2] !== t5) {
    t6 = <T0 flexDirection={t3} paddingLeft={t4}>{t5}</T0>;
    $[1] = T0;
    $[2] = t5;
    $[3] = t6;
  } else {
    t6 = $[3];
  }
  return t6;
}
