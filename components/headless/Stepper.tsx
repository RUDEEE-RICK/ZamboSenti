import { Transition } from "@headlessui/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Fragment } from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Step {
  id: string;
  name: string;
  description?: string;
  status: "current" | "upcoming" | "complete";
}

interface StepperProps {
  steps: Step[];
}

export function Stepper({ steps }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => (
          <li key={step.name} className="md:flex-1">
            <div
              className={cn(
                "group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 transition-colors duration-300",
                step.status === "complete"
                  ? "border-primary"
                  : step.status === "current"
                  ? "border-primary/60"
                  : "border-gray-200"
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide transition-colors duration-300",
                  step.status === "complete"
                    ? "text-primary"
                    : step.status === "current"
                    ? "text-primary/80"
                    : "text-gray-500"
                )}
              >
                Step {index + 1}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {step.name}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
