import { CircleX } from 'lucide-react';
import { toast } from 'sonner';

function toastErrorImpl(msg: string) {
  toast(msg, {
    icon: <CircleX className="text-red-500" />,
    className: 'gap-2',
    classNames: {
      title: 'text-red-500',
      icon: 'size-6 m-0',
    },
  });
}

export function toastError(error: unknown) {
  if (typeof error === 'string') {
    toastErrorImpl(error);
    return;
  }
  if (error instanceof Error) {
    toastErrorImpl(error.message);
    return;
  }
  toastErrorImpl('Unknown error');
}
