"use client";
import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import { cn } from "./utils";
function InputOTP({ className, containerClassName, ...props }) {
    return (<OTPInput data-slot="input-otp" containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)} className={cn("disabled:cursor-not-allowed", className)} {...props}/>);
}
function InputOTPGroup({ className, ...props }) {
    return (<div data-slot="input-otp-group" className={cn("flex items-center gap-1", className)} {...props}/>);
}
function InputOTPSlot({ index, className, ...props }) {
    var _a;
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = (_a = inputOTPContext === null || inputOTPContext === void 0 ? void 0 : inputOTPContext.slots[index]) !== null && _a !== void 0 ? _a : {};
    return (<div data-slot="input-otp-slot" data-active={isActive} className={cn("data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center text-sm bg-input-background transition-all outline-none data-[active=true]:z-10 data-[active=true]:ring-[3px]", className)} {...props}>
      {char}
      {hasFakeCaret && (<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000"/>
        </div>)}
    </div>);
}
function InputOTPSeparator({ ...props }) {
    return (<div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>);
}
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
