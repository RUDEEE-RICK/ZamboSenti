import { Button as HeadlessButton } from "@headlessui/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React, { ElementType, ComponentPropsWithoutRef } from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const variantStyles = {
  primary:
    "bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 shadow-lg shadow-primary/20 data-[active]:scale-95",
  secondary:
    "bg-white text-primary hover:bg-gray-50 border border-gray-200 shadow-sm data-[active]:scale-95",
  outline:
    "bg-transparent border-2 border-primary/20 text-primary hover:bg-primary/5 data-[active]:scale-95",
  ghost:
    "bg-transparent text-primary hover:bg-primary/5 data-[active]:scale-95",
  destructive:
    "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 data-[active]:scale-95",
};

type ButtonOwnProps<E extends ElementType = "button"> = {
  as?: E;
  variant?: keyof typeof variantStyles;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps<E extends ElementType> = ButtonOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof ButtonOwnProps>;

export function Button<E extends ElementType = "button">({
  as,
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps<E>) {
  const Component = as || HeadlessButton;
  return (
    <Component
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </Component>
  );
}
