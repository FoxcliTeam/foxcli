// Stub — ant-only component, not available in decompiled build
import React, { useEffect } from 'react';

export function UndercoverAutoCallout({ onDone }: { onDone: () => void }): React.ReactElement | null {
  useEffect(() => {
    onDone();
  }, [onDone]);
  return null;
}
