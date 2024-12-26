import { ArrowBigUp, ChevronUp, Command, Option } from 'lucide-react';
import { IS_MAC } from '~/consts';
import { cn } from '~/utils/cn';

interface KbdProps extends React.ComponentProps<'kbd'> {
  keys?: string[];
}

function Keys(props: { keys: string[] }) {
  const { keys } = props;

  const eles: React.ReactNode[] = [];

  keys.forEach((key, i) => {
    if (key === 'shift') {
      eles.push(<ShiftKey key={key} />);
    } else if (key === 'ctrl') {
      eles.push(<CtrlKey key={key} />);
    } else if (key === 'cmd') {
      eles.push(<CmdKey key={key} />);
    } else if (key === 'alt' || key === 'option') {
      eles.push(<AltOrOptionKey key={key} />);
    } else {
      eles.push(<span key={key}>{key}</span>);
    }
    if (i !== keys.length - 1) {
      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
      eles.push(<span key={i}>+</span>);
    }
  });

  return eles;
}

export function Kbd(props: KbdProps) {
  const { className, keys, children, ...restProps } = props;

  const finalChildren = keys ? <Keys keys={keys} /> : children;

  return (
    <kbd
      className={cn(
        'pointer-events-none select-none rounded border bg-muted px-1.5 inline-flex gap-1 items-center',
        className,
      )}
      {...restProps}
    >
      {finalChildren}
    </kbd>
  );
}

type KeyProps = Omit<React.ComponentProps<'span'>, 'children'>;

export function ShiftKey(props: KeyProps) {
  return <span>{IS_MAC ? <ArrowBigUp className="size-4" /> : 'Shift'}</span>;
}

export function CtrlKey(props: KeyProps) {
  return <span>{IS_MAC ? <ChevronUp className="size-4" /> : 'Ctrl'}</span>;
}

export function CmdKey(props: KeyProps) {
  return <span>{IS_MAC ? <Command className="size-3" /> : 'Cmd'}</span>;
}

export function AltOrOptionKey(props: KeyProps) {
  return <span>{IS_MAC ? <Option className="size-3" /> : 'Alt'}</span>;
}
