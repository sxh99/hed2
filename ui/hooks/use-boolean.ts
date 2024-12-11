import { useState } from 'react';

export function useBoolean(initValue?: boolean) {
  const [value, setValue] = useState(initValue ?? false);

  return {
    value,
    on() {
      setValue(true);
    },
    off() {
      setValue(false);
    },
    toggle() {
      setValue((prev) => !prev);
    },
    set(v: boolean) {
      setValue(v);
    },
  };
}
