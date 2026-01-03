"use client";

import { cn, handleError, buildFullName } from "@/lib/utils";
import { validateSignUpForm } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/headless/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/headless/Input";
import { Select, type SelectOption } from "@/components/headless/Select";
import { BARANGAYS } from "@/lib/data/barangays";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "signup_form_data";
const TOTAL_STEPS = 3;

interface FormData {
  email: string;
  fName: string;
  mName: string;
  lName: string;
  barangay: SelectOption | null;
  contact: string;
  birthDate: string;
  password: string;
  repeatPassword: string;
}

interface FieldErrors {
  fName?: string;
  lName?: string;
  mName?: string;
  barangay?: string;
  contact?: string;
  birthDate?: string;
  email?: string;
  password?: string;
  repeatPassword?: string;
  general?: string;
}

const initialFormData: FormData = {
  email: "",
  fName: "",
  mName: "",
  lName: "",
  barangay: null,
  contact: "",
  birthDate: "",
  password: "",
  repeatPassword: "",
};

// Helper component for field error display
const FieldError = ({ error }: { error?: string }) =>
  error ? (
    <p className="text-xs text-red-500 mt-1 animate-in fade-in duration-200">
      {error}
    </p>
  ) : null;

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Don't restore passwords for security
        setFormData({
          ...parsed,
          password: "",
          repeatPassword: "",
        });
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Soft save form data to localStorage (excluding passwords)
  const saveToStorage = useCallback((data: FormData) => {
    const dataToSave = {
      ...data,
      password: "",
      repeatPassword: "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, []);

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    // Clear field error when user starts typing
    if (errors[field as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      saveToStorage(updated);
      return updated;
    });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FieldErrors = {};
    let isValid = true;

    switch (step) {
      case 1:
        if (!formData.fName.trim()) {
          newErrors.fName = "First name is required";
          isValid = false;
        } else if (formData.fName.length < 2) {
          newErrors.fName = "First name must be at least 2 characters";
          isValid = false;
        }

        if (!formData.lName.trim()) {
          newErrors.lName = "Last name is required";
          isValid = false;
        } else if (formData.lName.length < 2) {
          newErrors.lName = "Last name must be at least 2 characters";
          isValid = false;
        }
        break;

      case 2:
        if (!formData.barangay) {
          newErrors.barangay = "Please select your barangay";
          isValid = false;
        }

        const phoneRegex = /^(\+63|0)?9\d{9}$/;
        if (!formData.contact.trim()) {
          newErrors.contact = "Contact number is required";
          isValid = false;
        } else if (!phoneRegex.test(formData.contact.replace(/\s|-/g, ""))) {
          newErrors.contact = "Please enter a valid Philippine phone number";
          isValid = false;
        }

        if (!formData.birthDate) {
          newErrors.birthDate = "Birth date is required";
          isValid = false;
        } else {
          const today = new Date();
          const birthDateObj = new Date(formData.birthDate);
          const age = today.getFullYear() - birthDateObj.getFullYear();
          if (age < 13 || age > 120) {
            newErrors.birthDate = "You must be between 13 and 120 years old";
            isValid = false;
          }
        }
        break;

      case 3:
        if (!formData.email.trim()) {
          newErrors.email = "Email is required";
          isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
          isValid = false;
        }

        if (!formData.password) {
          newErrors.password = "Password is required";
          isValid = false;
        } else if (formData.password.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
          isValid = false;
        }

        if (!formData.repeatPassword) {
          newErrors.repeatPassword = "Please confirm your password";
          isValid = false;
        } else if (formData.password !== formData.repeatPassword) {
          newErrors.repeatPassword = "Passwords do not match";
          isValid = false;
        }
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    setErrors({});

    const validation = validateSignUpForm({
      firstName: formData.fName,
      middleName: formData.mName || undefined,
      lastName: formData.lName,
      barangay: formData.barangay?.name || "",
      contact: formData.contact,
      birthDate: formData.birthDate,
      password: formData.password,
      repeatPassword: formData.repeatPassword,
    });

    if (!validation.valid) {
      setErrors({ general: validation.error });
      setIsLoading(false);
      return;
    }

    const fullname = buildFullName(
      formData.fName,
      formData.mName,
      formData.lName
    );
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: fullname,
            barangay: formData.barangay?.name,
            contact_number: formData.contact,
            birth_date: formData.birthDate,
            user_roles: "citizen",
          },
        },
      });
      if (error) throw error;

      // Clear saved form data on success
      localStorage.removeItem(STORAGE_KEY);
      router.push("/");
    } catch (error: unknown) {
      setErrors({ general: handleError(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <button
            type="button"
            onClick={() => {
              if (step < currentStep) {
                setCurrentStep(step);
                setErrors({});
              }
            }}
            disabled={step > currentStep}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
              step === currentStep
                ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg scale-110"
                : step < currentStep
                ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {step < currentStep ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              step
            )}
          </button>
          {step < TOTAL_STEPS && (
            <div
              className={cn(
                "w-12 h-1 mx-1 rounded-full transition-all duration-300",
                step < currentStep ? "bg-primary" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepTitle = () => {
    const titles = ["Personal Info", "Contact Details", "Account Setup"];
    const descriptions = [
      "Tell us about yourself",
      "How can we reach you?",
      "Create your login credentials",
    ];
    return (
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {titles[currentStep - 1]}
        </h3>
        <p className="text-sm text-gray-500">{descriptions[currentStep - 1]}</p>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            label="First Name"
            id="fName"
            type="text"
            placeholder="Juan"
            required
            value={formData.fName}
            onChange={(e) => updateField("fName", e.target.value)}
            suppressHydrationWarning
            className={errors.fName ? "border-red-500" : ""}
          />
          <FieldError error={errors.fName} />
        </div>
        <div>
          <Input
            label="Last Name"
            id="lName"
            type="text"
            placeholder="Delacruz"
            required
            value={formData.lName}
            onChange={(e) => updateField("lName", e.target.value)}
            suppressHydrationWarning
            className={errors.lName ? "border-red-500" : ""}
          />
          <FieldError error={errors.lName} />
        </div>
      </div>
      <div>
        <Input
          label="Middle Initial (Optional)"
          id="mName"
          type="text"
          placeholder="D"
          value={formData.mName}
          onChange={(e) => updateField("mName", e.target.value)}
          suppressHydrationWarning
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <Select
          label="Barangay"
          description="Select your barangay in Zamboanga City"
          options={BARANGAYS}
          value={formData.barangay}
          onChange={(val) => updateField("barangay", val)}
          placeholder="Select your barangay"
        />
        <FieldError error={errors.barangay} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            label="Contact Number"
            id="contact"
            type="tel"
            placeholder="+63 912 345 6789"
            required
            value={formData.contact}
            onChange={(e) => updateField("contact", e.target.value)}
            suppressHydrationWarning
            className={errors.contact ? "border-red-500" : ""}
          />
          <FieldError error={errors.contact} />
        </div>
        <div>
          <Input
            label="Birth Date"
            id="birthDate"
            type="date"
            required
            value={formData.birthDate}
            onChange={(e) => updateField("birthDate", e.target.value)}
            suppressHydrationWarning
            className={errors.birthDate ? "border-red-500" : ""}
          />
          <FieldError error={errors.birthDate} />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          suppressHydrationWarning
          className={errors.email ? "border-red-500" : ""}
        />
        <FieldError error={errors.email} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            label="Password"
            id="password"
            type="password"
            required
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            suppressHydrationWarning
            className={errors.password ? "border-red-500" : ""}
          />
          <FieldError error={errors.password} />
        </div>
        <div>
          <Input
            label="Confirm Password"
            id="repeat-password"
            type="password"
            required
            value={formData.repeatPassword}
            onChange={(e) => updateField("repeatPassword", e.target.value)}
            suppressHydrationWarning
            className={errors.repeatPassword ? "border-red-500" : ""}
          />
          <FieldError error={errors.repeatPassword} />
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Join ZamSolucion
          </CardTitle>
          <CardDescription>
            Create an account to start filing complaints in Zamboanga City
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            {renderStepIndicator()}
            {renderStepTitle()}

            <div className="min-h-[200px]">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </div>

            {errors.general && (
              <p className="text-sm text-red-500 font-medium mt-4 text-center animate-in fade-in duration-200">
                {errors.general}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}
              {currentStep < TOTAL_STEPS ? (
                <Button type="button" className="flex-1" onClick={handleNext}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              )}
            </div>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-bold text-primary hover:underline"
            >
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
