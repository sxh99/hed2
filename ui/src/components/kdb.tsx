import { ArrowBigUp, ChevronUp, Command, Option } from 'lucide-react';
import { IS_MAC } from '~/consts';
import { cn } from '~/utils/cn';

function ShiftKey() {
  return <span>{IS_MAC ? <ArrowBigUp className="size-4" /> : 'Shift'}</span>;
}

function CtrlKey() {
  return <span>{IS_MAC ? <ChevronUp className="size-4" /> : 'Ctrl'}</span>;
}

function CmdKey() {
  return <span>{IS_MAC ? <Command className="size-3" /> : 'Cmd'}</span>;
}

function AltOrOptionKey() {
  return <span>{IS_MAC ? <Option className="size-3" /> : 'Alt'}</span>;
}

interface KeysProps {
  keybind: string;
}

function Keys(props: KeysProps) {
  const { keybind } = props;

  const eles: React.ReactNode[] = [];
  const keys = keybind.split('+').map((s) => s.trim());

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

export function Kbd(props: React.ComponentProps<'kbd'> & KeysProps) {
  const { className, keybind, children, ...restProps } = props;

  const finalChildren = keybind ? <Keys keybind={keybind} /> : children;

  return (
    <kbd
      className={cn(
        'pointer-events-none select-none rounded border bg-muted px-1.5 inline-flex gap-1 items-center text-foreground',
        className,
      )}
      {...restProps}
    >
      {finalChildren}
    </kbd>
  );
}
