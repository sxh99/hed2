import { Search } from 'lucide-react';
import { Input } from '~/components';
import { cn } from '~/utils/cn';

interface SearchInputProps
  extends Pick<
    React.ComponentProps<'input'>,
    'name' | 'value' | 'placeholder' | 'className'
  > {
  onValueChange: (v: string) => void;
}

export function SearchInput(props: SearchInputProps) {
  const { className, onValueChange, ...restProps } = props;
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-auto absolute left-2.5 size-4 top-1/2 -translate-y-1/2 select-none opacity-50" />
      <Input
        className="bg-white dark:bg-black pl-8 placeholder:italic"
        onChange={(e) => onValueChange(e.target.value)}
        {...restProps}
      />
    </div>
  );
}
