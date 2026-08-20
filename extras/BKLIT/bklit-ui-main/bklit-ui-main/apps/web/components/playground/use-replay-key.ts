"use client";

import { useCallback, useState } from "react";

export function useReplayKey(initialKey = 0) {
  const [key, setKey] = useState(initialKey);
  const replay = useCallback(() => {
    setKey((current) => current + 1);
  }, []);

  return [key, replay] as const;
}
