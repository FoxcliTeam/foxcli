import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Link, Text } from '../ink.js';
import { Select } from './CustomSelect/index.js';
import { Dialog } from './design-system/Dialog.js';
type Props = {
  onDone: () => void;
};
export function CostThresholdDialog(t0) {
  const $ = _c(7);
  const {
    onDone
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <Box flexDirection="column"><Text>Learn more about how to monitor your spending:</Text><Link url="https://code.claude.com/docs/en/costs" /></Box>;
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [{
      value: "ok",
      label: "Got it, thanks!"
    }];
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  let t3;
  if ($[2] !== onDone) {
    t3 = <Select options={t2} onChange={onDone} />;
    $[2] = onDone;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  let t4;
  if ($[4] !== onDone || $[5] !== t3) {
    t4 = <Dialog title="You've spent $5 on the Anthropic API this session." onCancel={onDone}>{t1}{t3}</Dialog>;
    $[4] = onDone;
    $[5] = t3;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  return t4;
}
