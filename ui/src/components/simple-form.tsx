import {
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '~/utils/cn';
import { Label } from './shadcn/label';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from './shadcn/tooltip';

interface FormErr {
  field: string;
  err: string;
}

interface FormContextType {
  err: FormErr;
  setErr: (v: FormErr) => void;
}

const FormContext = createContext<FormContextType>({
  err: { field: '', err: '' },
  setErr: () => {},
});

interface FormProps
  extends Pick<React.ComponentProps<'div'>, 'className' | 'children'> {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  onSubmit: (v: any) => void;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  onValidate: (v: any) => FormErr | undefined;
}

export interface FormRef {
  submit: () => void;
}

export const Form = forwardRef<FormRef, FormProps>((props, ref) => {
  const { className, children, onSubmit, onValidate } = props;

  const [err, setErr] = useState<FormErr>({
    field: '',
    err: '',
  });
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(
    ref,
    () => {
      return {
        submit: () => {
          submitBtnRef.current?.click();
        },
      };
    },
    [],
  );

  const contextValue = useMemo(() => {
    return {
      err,
      setErr,
    };
  }, [err]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data: Record<string, string> = {};
    const formData = new FormData(e.currentTarget);
    for (const [k, v] of formData.entries()) {
      if (typeof v === 'string') {
        data[k] = v.trim();
      }
    }
    const fail = onValidate(data);
    if (fail) {
      setErr(fail);
      return;
    }
    onSubmit(data);
  };

  return (
    <form className={cn('grid gap-4 py-4', className)} onSubmit={handleSubmit}>
      <FormContext.Provider value={contextValue}>
        {children}
      </FormContext.Provider>
      <button type="submit" className="hidden" ref={submitBtnRef}>
        submit
      </button>
    </form>
  );
});

export function FormItem(
  props: React.PropsWithChildren<{
    name: string;
    label: string;
    required?: boolean;
  }>,
) {
  const { name, label, required, children } = props;

  const { err, setErr } = useContext(FormContext);

  const handleChange = () => {
    if (err.field === name) {
      setErr({ field: '', err: '' });
    }
  };

  return (
    <div className="grid grid-cols-6 items-center">
      <Label
        className={cn(
          'text-right pr-4',
          required && `after:content-['*'] after:ml-0.5 after:text-red-500`,
        )}
        htmlFor={name}
      >
        {label}
      </Label>
      <Tooltip open={err.field === name}>
        <TooltipTrigger
          asChild
          className="col-span-5 dark:bg-black placeholder:italic data-[state=instant-open]:border-red-500 data-[state=instant-open]:focus-visible:ring-red-500"
          id={name}
          name={name}
          onChange={handleChange}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent className="bg-red-500">
          <TooltipArrow className="fill-red-500" />
          {err.err}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
Form.displayName = 'Form';
