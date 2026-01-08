"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/headless/Button";
import { Input } from "@/components/headless/Input";
import { Textarea } from "@/components/headless/Textarea";
import { Select, type SelectOption } from "@/components/headless/Select";
import { Stepper } from "@/components/headless/Stepper";
import { AppHeader } from "@/components/app-header";
import { BARANGAYS } from "@/lib/data/barangays";
import {
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  MapPin,
  FileText,
  Image as ImageIcon,
  Send,
  Construction,
  Lightbulb,
  Trash2,
  Droplets,
  ShieldAlert,
  Volume2,
  HelpCircle,
  UserX,
  LayoutGrid,
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// Category type with icon component
interface CategoryOption {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: "Road and Infrastructure",
    name: "Road and Infrastructure",
    icon: Construction,
    description: "Potholes, damaged roads, bridges",
  },
  {
    id: "Street Lighting",
    name: "Street Lighting",
    icon: Lightbulb,
    description: "Broken or missing street lights",
  },
  {
    id: "Waste Management",
    name: "Waste Management",
    icon: Trash2,
    description: "Garbage collection, illegal dumping",
  },
  {
    id: "Water and Drainage",
    name: "Water and Drainage",
    icon: Droplets,
    description: "Flooding, clogged drains, water supply",
  },
  {
    id: "Public Safety",
    name: "Public Safety",
    icon: ShieldAlert,
    description: "Safety hazards, security concerns",
  },
  {
    id: "Noise Complaint",
    name: "Noise Complaint",
    icon: Volume2,
    description: "Excessive noise disturbances",
  },
  {
    id: "Other",
    name: "Other",
    icon: HelpCircle,
    description: "Other issues not listed above",
  },
];

export default function ReportPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    category: null as CategoryOption | null,
    barangay: null as SelectOption | null,
    useDefaultBarangay: true,
    location: "",
    title: "",
    description: "",
    contactNumber: "",
    imageFile: null as File | null,
    imagePreview: null as string | null,
    isAnonymous: false,
    isPublic: false,
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    providePersonalInfo: false,
  });
  const [userDefaultBarangay, setUserDefaultBarangay] =
    useState<SelectOption | null>(null);

  const steps = [
    {
      id: "01",
      name: "Issue Type",
      status:
        currentStep === 0
          ? "current"
          : currentStep > 0
          ? "complete"
          : "upcoming",
    },
    {
      id: "02",
      name: "Location",
      status:
        currentStep === 1
          ? "current"
          : currentStep > 1
          ? "complete"
          : "upcoming",
    },
    {
      id: "03",
      name: "Details",
      status:
        currentStep === 2
          ? "current"
          : currentStep > 2
          ? "complete"
          : "upcoming",
    },
    {
      id: "04",
      name: "Evidence",
      status:
        currentStep === 3
          ? "current"
          : currentStep > 3
          ? "complete"
          : "upcoming",
    },
    {
      id: "05",
      name: "Review",
      status:
        currentStep === 4
          ? "current"
          : currentStep > 4
          ? "complete"
          : "upcoming",
    },
  ] as const;

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Allow guest users
        setIsGuest(true);
        setIsAdmin(false);
        return;
      }

      setUserId(user.id);
      setIsGuest(false);

      // Fetch user's profile to check admin status and default barangay
      const { data: profile } = await supabase
        .from("profiles")
        .select("barangay, user_roles")
        .eq("id", user.id)
        .single();

      const userIsAdmin = profile?.user_roles === "admin";
      setIsAdmin(userIsAdmin);

      // Redirect admins away from this page
      if (userIsAdmin) {
        router.push("/");
        return;
      }

      if (profile?.barangay) {
        const defaultBarangay = BARANGAYS.find(
          (b) => b.name === profile.barangay
        );
        if (defaultBarangay) {
          setUserDefaultBarangay(defaultBarangay);
          setFormData((prev) => ({ ...prev, barangay: defaultBarangay }));
        }
      }
    };
    getUser();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          image: "Image must be less than 10MB",
        }));
        return;
      }
      if (!file.type.startsWith("image/")) {
        setValidationErrors((prev) => ({
          ...prev,
          image: "File must be an image",
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
      setValidationErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    // Step 0: Issue Type (category selection)
    if (step === 0) {
      if (!formData.category) errors.category = "Please select an issue type";
    }

    // Step 1: Location
    if (step === 1) {
      if (!formData.barangay) errors.barangay = "Please select a barangay";
      // Specific location is optional
    }

    // Step 2: Details
    if (step === 2) {
      if (!formData.title.trim()) errors.title = "Please tell us what's wrong";
      if (!formData.description.trim())
        errors.description = "Please describe the issue";
    }

    // Step 3: Evidence (optional, no validation needed)

    // Step 4: Review
    if (step === 4) {
      if (
        formData.contactNumber &&
        !/^(\+639|09)\d{9}$/.test(formData.contactNumber.replace(/\s/g, ""))
      ) {
        errors.contactNumber = "Invalid Philippine mobile number format";
      }
      
      // Guest validation
      if (isGuest && formData.providePersonalInfo) {
        if (!formData.guestName.trim()) errors.guestName = "Name is required";
        if (!formData.guestEmail.trim()) errors.guestEmail = "Email is required";
        if (formData.guestEmail && !/\S+@\S+\.\S+/.test(formData.guestEmail)) {
          errors.guestEmail = "Invalid email format";
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setError(null);
    setIsLoading(true);
    const supabase = createClient();

    try {
      let complaintUserId = null;
      
      if (!isGuest) {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !currentUser)
          throw new Error("Authentication required.");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileError || !profileData)
          throw new Error(
            "User profile not found. Please complete your profile."
          );
        
        complaintUserId = currentUser.id;
      }

      let imagePath = null;
      if (formData.imageFile) {
        console.log("📸 Starting image upload...");
        const fileExt = formData.imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        console.log("📤 Uploading to storage:", { bucket: "report-image", path: filePath });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("report-image")
          .upload(filePath, formData.imageFile);
        
        if (uploadError) {
          console.error("❌ STORAGE UPLOAD ERROR:", {
            message: uploadError.message,
            error: uploadError,
          });
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        console.log("✅ Storage upload successful:", uploadData);

        const {
          data: { publicUrl },
        } = supabase.storage.from("report-image").getPublicUrl(filePath);
        imagePath = publicUrl;
        console.log("🔗 Public URL generated:", imagePath);
      }
      console.log("📝 Inserting complaint into database...");
      
      const complaintPayload: any = {
        title: formData.title.trim(),
        category: formData.category?.name,
        barangay: formData.barangay?.name,
        location: formData.location.trim(),
        content: formData.description.trim(),
        user_id: complaintUserId,
        status: "pending",
        is_anonymous: isGuest ? !formData.providePersonalInfo : formData.isAnonymous,
        is_public: formData.isPublic,
        image_url: imagePath,
        view_count: 0,
      };

      // Add guest info if provided
      if (isGuest && formData.providePersonalInfo) {
        complaintPayload.guest_name = formData.guestName.trim();
        complaintPayload.guest_email = formData.guestEmail.trim();
        complaintPayload.guest_phone = formData.guestPhone.trim();
      }
      
      const { data: complaintData, error: insertError } = await supabase
        .from("complaints")
        .insert(complaintPayload)
        .select()
        .single();

      if (insertError) {
        console.error("❌ COMPLAINT INSERT ERROR:", {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        });
        throw new Error(`Failed to submit complaint: ${insertError.message}`);
      }

      console.log("✅ Complaint created successfully:", complaintData);

      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex items-center justify-center px-4 sm:px-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 pb-24 md:pb-8">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Report an Issue</h1>
          <p className="text-muted-foreground">
            Submit a complaint or report a problem in your community
          </p>
        </div>

      <div className="flex flex-col items-center justify-center">      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100/50">
          {/* Progress Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Report an Issue
              </h1>
              <span className="text-white/80 text-sm font-medium">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            {/* Step Progress Bar */}
            <div className="flex gap-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    index < currentStep
                      ? "bg-white"
                      : index === currentStep
                      ? "bg-white/80"
                      : "bg-white/30"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <span
                  key={step.id}
                  className={`text-xs font-medium transition-all ${
                    index <= currentStep ? "text-white" : "text-white/50"
                  }`}
                >
                  {step.name}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex gap-3 text-rose-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Report Submitted!
                </h2>
                <p className="text-muted-foreground">
                  Thank you for your contribution. Redirecting you home...
                </p>
              </div>
            ) : (
              <div className="relative min-h-[300px]">
                <AnimatePresence mode="wait">
                  {/* Step 0: Issue Type Selection */}
                  {currentStep === 0 && (
                    <motion.div
                      key="step0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Step Header */}
                      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <LayoutGrid className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-900">
                            What type of issue?
                          </h2>
                          <p className="text-sm text-gray-500">
                            Select the category that best describes the problem
                          </p>
                        </div>
                      </div>

                      {/* Category Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {CATEGORIES.map((category) => {
                          const IconComponent = category.icon;
                          const isSelected =
                            formData.category?.id === category.id;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, category }))
                              }
                              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group hover:shadow-md ${
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-md"
                                  : "border-gray-200 bg-white hover:border-primary/50 hover:bg-gray-50"
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                                  isSelected
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary"
                                }`}
                              >
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <h3
                                className={`font-medium text-sm mb-1 ${
                                  isSelected ? "text-primary" : "text-gray-900"
                                }`}
                              >
                                {category.name}
                              </h3>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {category.description}
                              </p>
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircle className="w-5 h-5 text-primary" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {validationErrors.category && (
                        <p className="text-sm text-rose-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.category}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Step 1: Location */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Step Header */}
                      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-900">
                            Where is the issue?
                          </h2>
                          <p className="text-sm text-gray-500">
                            Help us locate the problem
                          </p>
                        </div>
                      </div>

                      {/* Barangay Selection */}
                      <div className="space-y-3">
                        {userDefaultBarangay && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.useDefaultBarangay}
                              onChange={(e) => {
                                const useDefault = e.target.checked;
                                setFormData((prev) => ({
                                  ...prev,
                                  useDefaultBarangay: useDefault,
                                  barangay: useDefault
                                    ? userDefaultBarangay
                                    : prev.barangay,
                                }));
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-foreground">
                              Use my default barangay (
                              {userDefaultBarangay.name})
                            </span>
                          </label>
                        )}

                        {(!formData.useDefaultBarangay ||
                          !userDefaultBarangay) && (
                          <Select
                            label={
                              <>
                                Barangay where the issue is located{" "}
                                <span className="text-rose-500">*</span>
                              </>
                            }
                            description="Select the barangay where you want to file the complaint."
                            options={BARANGAYS}
                            value={formData.barangay}
                            onChange={(val) =>
                              setFormData((prev) => ({
                                ...prev,
                                barangay: val,
                              }))
                            }
                            error={validationErrors.barangay}
                          />
                        )}
                      </div>

                      <Input
                        label="Specific Location (Optional)"
                        description="Help us find the exact spot"
                        placeholder="e.g., Corner of Rizal St. and Tetuan Highway"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                      />
                    </motion.div>
                  )}

                  {/* Step 2: Details */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Step Header */}
                      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-900">
                            Issue Details
                          </h2>
                          <p className="text-sm text-gray-500">
                            Tell us more about the problem
                          </p>
                        </div>
                      </div>

                      <Input
                        label={
                          <>
                            What's the issue?{" "}
                            <span className="text-rose-500">*</span>
                          </>
                        }
                        placeholder="e.g., Broken streetlight, pothole on main road..."
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        error={validationErrors.title}
                      />
                      <Textarea
                        label={
                          <>
                            Can you describe it?{" "}
                            <span className="text-rose-500">*</span>
                          </>
                        }
                        placeholder="Give us details so we can help faster. What did you see? When did it start?"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        error={validationErrors.description}
                      />
                    </motion.div>
                  )}

                  {/* Step 3: Evidence */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Step Header */}
                      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-900">
                            Add Photo
                          </h2>
                          <p className="text-sm text-gray-500">
                            A picture helps us understand better
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="block text-sm font-semibold text-foreground">
                          Photo Evidence (Optional)
                        </span>
                        <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-gray-200 px-6 py-10 hover:bg-gray-50 hover:border-primary/30 transition-all cursor-pointer relative bg-white">
                          {formData.imagePreview ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                              <Image
                                src={formData.imagePreview}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setFormData((prev) => ({
                                      ...prev,
                                      imageFile: null,
                                      imagePreview: null,
                                    }));
                                  }}
                                  className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition-colors"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Camera
                                className="mx-auto h-12 w-12 text-gray-300"
                                aria-hidden="true"
                              />
                              <div className="mt-4 flex text-sm leading-6 text-muted-foreground justify-center">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer rounded-md bg-transparent font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                                >
                                  <span>Upload a file</span>
                                  <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs leading-5 text-muted-foreground">
                                PNG, JPG, GIF up to 10MB
                              </p>
                            </div>
                          )}
                        </div>
                        {validationErrors.image && (
                          <p className="text-sm text-rose-500">
                            {validationErrors.image}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Review */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Step Header */}
                      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Send className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-900">
                            Review & Submit
                          </h2>
                          <p className="text-sm text-gray-500">
                            Almost done! Check your details
                          </p>
                        </div>
                      </div>

                      <Input
                        label="Contact Number (Optional)"
                        description="We'll text you updates about your report"
                        placeholder="09XX XXX XXXX"
                        value={formData.contactNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactNumber: e.target.value,
                          }))
                        }
                        error={validationErrors.contactNumber}
                      />

                      {/* Guest Personal Info Section */}
                      {isGuest && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-4">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.providePersonalInfo}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  providePersonalInfo: e.target.checked,
                                }))
                              }
                              className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">
                                Provide my contact information
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                Help us reach you for updates (optional)
                              </p>
                            </div>
                          </label>

                          {formData.providePersonalInfo && (
                            <div className="space-y-3 pt-2">
                              <Input
                                label={
                                  <>
                                    Your Name{" "}
                                    <span className="text-rose-500">*</span>
                                  </>
                                }
                                placeholder="Juan Dela Cruz"
                                value={formData.guestName}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    guestName: e.target.value,
                                  }))
                                }
                                error={validationErrors.guestName}
                              />
                              <Input
                                label={
                                  <>
                                    Email{" "}
                                    <span className="text-rose-500">*</span>
                                  </>
                                }
                                type="email"
                                placeholder="your.email@example.com"
                                value={formData.guestEmail}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    guestEmail: e.target.value,
                                  }))
                                }
                                error={validationErrors.guestEmail}
                              />
                              <Input
                                label="Phone Number"
                                placeholder="09XX XXX XXXX"
                                value={formData.guestPhone}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    guestPhone: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Summary Card */}
                      <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-xl p-5 space-y-4 text-sm border border-gray-100">
                        <h3 className="font-semibold text-foreground">
                          Summary
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-muted-foreground">
                            Category:
                          </span>
                          <span className="col-span-2 font-medium">
                            {formData.category?.name}
                          </span>

                          <span className="text-muted-foreground">
                            Barangay:
                          </span>
                          <span className="col-span-2 font-medium">
                            {formData.barangay?.name}
                          </span>

                          <span className="text-muted-foreground">Title:</span>
                          <span className="col-span-2 font-medium">
                            {formData.title}
                          </span>

                          {formData.location && (
                            <>
                              <span className="text-muted-foreground">
                                Location:
                              </span>
                              <span className="col-span-2 font-medium">
                                {formData.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Anonymous Submission Checkbox */}
                      {!isGuest && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isAnonymous}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  isAnonymous: e.target.checked,
                                }))
                              }
                              className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <UserX className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-gray-900">
                                  Submit anonymously
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Your name will be hidden from public view. Only
                                administrators can see your identity for follow-up
                                purposes.
                              </p>
                            </div>
                          </label>
                        </div>
                      )}

                      {/* Public Visibility Toggle */}
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isPublic}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                isPublic: e.target.checked,
                              }))
                            }
                            className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">
                              Share to Social Hub
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Make this complaint visible in the public social hub where others can see, react, and comment on it.
                            </p>
                          </div>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!success && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0 || isLoading}
                  className={currentStep === 0 ? "invisible" : "gap-2"}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    className="gap-2 min-w-[140px]"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    variant="primary"
                    className="gap-2 min-w-[160px]"
                  >
                    <Send className="w-4 h-4" />
                    {isLoading ? "Submitting..." : "Submit Report"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
      </div>
      </main>
    </div>
  );
}
