import { useDeferredValue, useState } from 'react';

export function useSearch() {
  const [value, setValue] = useState('');
  const deferredValue = useDeferredValue(value);

  return {
    value,
    deferredValue,
    setValue,
  };
}
