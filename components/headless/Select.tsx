import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Field,
  Label,
  Description,
  Transition,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React, { Fragment } from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SelectOption {
  id: string | number;
  name: string;
  [key: string]: any;
}

interface SelectProps<T extends SelectOption> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
  value: T | null;
  onChange: (value: T) => void;
  options: T[];
  placeholder?: string;
  className?: string;
  displayValue?: (item: T) => string;
}

export function Select<T extends SelectOption>({
  label,
  description,
  error,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className,
  displayValue = (item) => item.name,
}: SelectProps<T>) {
  return (
    <Field className={cn("w-full", className)}>
      {label && (
        <Label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </Label>
      )}
      <Listbox value={value ?? undefined} onChange={onChange}>
        <div className="relative">
          <ListboxButton
            className={cn(
              "relative w-full cursor-pointer rounded-xl border-2 border-gray-200 bg-white/50 py-2.5 pl-4 pr-10 text-left text-sm",
              "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
              "transition-all duration-200",
              error && "border-red-500 focus:ring-red-100"
            )}
          >
            <span className={cn("block truncate", !value && "text-gray-400")}>
              {value ? displayValue(value) : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                className="h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white/90 backdrop-blur-xl py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
              {options.map((option) => (
                <ListboxOption
                  key={option.id}
                  className={({ focus }) =>
                    cn(
                      "relative cursor-pointer select-none py-2.5 pl-10 pr-4",
                      focus ? "bg-primary/10 text-primary" : "text-gray-900"
                    )
                  }
                  value={option}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={cn(
                          "block truncate",
                          selected ? "font-medium" : "font-normal"
                        )}
                      >
                        {displayValue(option)}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
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
