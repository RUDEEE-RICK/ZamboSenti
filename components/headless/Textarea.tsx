import {
  Textarea as HeadlessTextarea,
  TextareaProps as HeadlessTextareaProps,
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

interface TextareaProps extends HeadlessTextareaProps {
  label?: React.ReactNode;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export function Textarea({
  label,
  description,
  error,
  className,
  containerClassName,
  ...props
}: TextareaProps) {
  return (
    <Field className={cn("w-full", containerClassName)}>
      {label && (
        <Label className="block text-sm font-semibold text-gray-700 mb-2 data-[disabled]:opacity-50">
          {label}
        </Label>
      )}
      <HeadlessTextarea
        {...props}
        className={cn(
          "block w-full rounded-xl border-2 border-gray-200 bg-white/50 px-4 py-3 text-sm text-gray-900",
          "focus:border-vinta-purple focus:outline-none focus:ring-4 focus:ring-vinta-purple/10",
          "data-[invalid]:border-red-500 data-[invalid]:focus:ring-red-100",
          "placeholder:text-gray-400",
          "min-h-[100px] resize-none",
          "transition-all duration-200",
          className
        )}
      />
      {description && !error && (
        <Description className="mt-2 text-xs text-gray-500">
          {description}
        </Description>
      )}
      {error && (
        <Description className="mt-2 text-xs font-medium text-red-500">
          {error}
        </Description>
      )}
    </Field>
  );
}
