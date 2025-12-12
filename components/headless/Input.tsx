import {
  Input as HeadlessInput,
  InputProps as HeadlessInputProps,
  Field,
  Label,
  Description,
} from "@headlessui/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends HeadlessInputProps {
  label?: React.ReactNode;
  description?: string;
  error?: string;
  containerClassName?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export function Input({
  label,
  description,
  error,
  className,
  containerClassName,
  startIcon,
  endIcon,
  ...props
}: InputProps) {
  return (
    <Field className={cn("w-full", containerClassName)}>
      {label && (
        <Label className="block text-sm font-semibold text-gray-700 mb-2 data-[disabled]:opacity-50">
          {label}
        </Label>
      )}
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {startIcon}
          </div>
        )}
        <HeadlessInput
          {...props}
          className={cn(
            "block w-full rounded-xl border-2 border-gray-200 bg-white/50 py-2.5 text-sm text-gray-900",
            "focus:border-vinta-purple focus:outline-none focus:ring-4 focus:ring-vinta-purple/10",
            "data-[invalid]:border-red-500 data-[invalid]:focus:ring-red-100",
            "placeholder:text-gray-400",
            "transition-all duration-200",
            startIcon ? "pl-10 pr-4" : "px-4",
            endIcon ? "pr-10" : "",
            className
          )}
        />
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
            {endIcon}
          </div>
        )}
      </div>
      {description && !error && (
        <Description className="mt-2 text-xs text-gray-500">
          {description}
        </Description>
      )}
      {error && (
        <Description className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
          {error}
        </Description>
      )}
    </Field>
  );
}
