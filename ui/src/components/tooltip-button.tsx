import { forwardRef } from 'react';
import { Button, type ButtonProps } from './shadcn/button';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from './shadcn/tooltip';

interface TooltipButtonProps extends ButtonProps {
  tooltip: React.ReactNode;
  open?: boolean;
}

export const TooltipButton = forwardRef<HTMLButtonElement, TooltipButtonProps>(
  (props: TooltipButtonProps, ref) => {
    const { tooltip, open, ...restProps } = props;

    return (
      <Tooltip open={open}>
        <TooltipTrigger asChild>
          <Button ref={ref} {...restProps} />
        </TooltipTrigger>
        <TooltipContent>
          <TooltipArrow />
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  },
);
TooltipButton.displayName = 'TooltipButton';
