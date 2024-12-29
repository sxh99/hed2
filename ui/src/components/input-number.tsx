import { useState } from 'react';
import { cn } from '~/utils/cn';
import { Input } from './shadcn/input';

interface InputNumberProps
  extends React.ComponentPropsWithoutRef<typeof Input> {
  minValue: number;
  maxValue: number;
  initValue: number;
  onConfirm: (v: number) => void;
}

export function InputNumber(props: InputNumberProps) {
  const { minValue, maxValue, initValue, onConfirm, className, ...restProps } =
    props;

  const [innerValue, setInnerValue] = useState(initValue.toString());

  const handleConfirm = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.valueAsNumber;
    if (
      Number.isNaN(value) ||
      !Number.isSafeInteger(value) ||
      value < minValue ||
      value > maxValue
    ) {
      setInnerValue(initValue.toString());
      return;
    }
    onConfirm(value);
  };

  return (
    <Input
      className={cn('dark:bg-black', className)}
      type="number"
      value={innerValue}
      onChange={(e) => setInnerValue(e.target.value)}
      onBlur={handleConfirm}
      {...restProps}
    />
  );
}
