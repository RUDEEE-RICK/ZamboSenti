"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/headless/Button";
import { Input } from "@/components/headless/Input";
import { Textarea } from "@/components/headless/Textarea";
import { Select, type SelectOption } from "@/components/headless/Select";
import { Stepper } from "@/components/headless/Stepper";
import {
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Home,
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES: SelectOption[] = [
  { id: "Road and Infrastructure", name: "Road and Infrastructure" },
  { id: "Street Lighting", name: "Street Lighting" },
  { id: "Waste Management", name: "Waste Management" },
  { id: "Water and Drainage", name: "Water and Drainage" },
  { id: "Public Safety", name: "Public Safety" },
  { id: "Noise Complaint", name: "Noise Complaint" },
  { id: "Other", name: "Other" },
];

export default function ReportPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: null as SelectOption | null,
    location: "",
    title: "",
    description: "",
    contactNumber: "",
    imageFile: null as File | null,
    imagePreview: null as string | null,
  });

  const steps = [
    {
      id: "01",
      name: "Category & Location",
      status:
        currentStep === 0
          ? "current"
          : currentStep > 0
          ? "complete"
          : "upcoming",
    },
    {
      id: "02",
      name: "Details",
      status:
        currentStep === 1
          ? "current"
          : currentStep > 1
          ? "complete"
          : "upcoming",
    },
    {
      id: "03",
      name: "Evidence",
      status:
        currentStep === 2
          ? "current"
          : currentStep > 2
          ? "complete"
          : "upcoming",
    },
    {
      id: "04",
      name: "Review",
      status:
        currentStep === 3
          ? "current"
          : currentStep > 3
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
      setUserId(user?.id || null);
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

    if (step === 0) {
      if (!formData.category) errors.category = "Please select a category";
      if (!formData.location.trim()) errors.location = "Location is required";
    }

    if (step === 1) {
      if (!formData.title.trim()) errors.title = "Title is required";
      else if (formData.title.length < 5)
        errors.title = "Title must be at least 5 characters";

      if (!formData.description.trim())
        errors.description = "Description is required";
      else if (formData.description.length < 20)
        errors.description = "Description must be at least 20 characters";
    }

    if (step === 3) {
      if (
        formData.contactNumber &&
        !/^(\+639|09)\d{9}$/.test(formData.contactNumber.replace(/\s/g, ""))
      ) {
        errors.contactNumber = "Invalid Philippine mobile number format";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setError(null);
    if (!userId) {
      setError("You must be logged in to submit a report");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
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

      let imagePath = null;
      if (formData.imageFile) {
        const fileExt = formData.imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("report-image")
          .upload(filePath, formData.imageFile);
        if (uploadError)
          throw new Error(`Image upload failed: ${uploadError.message}`);

        const {
          data: { publicUrl },
        } = supabase.storage.from("report-image").getPublicUrl(filePath);
        imagePath = publicUrl;
      }

      const { data: complaintData, error: insertError } = await supabase
        .from("complaints")
        .insert({
          title: formData.title.trim(),
          category: formData.category?.name,
          location: formData.location.trim(),
          content: formData.description.trim(),
          user_id: currentUser.id,
          status: "pending",
        })
        .select()
        .single();

      if (insertError)
        throw new Error(`Failed to submit: ${insertError.message}`);

      if (imagePath && complaintData) {
        const { data: pictureData, error: pictureError } = await supabase
          .from("pictures")
          .insert({
            image_path: imagePath,
            parent_type: "complaint",
            parent_id: complaintData.id,
          })
          .select()
          .single();

        if (!pictureError && pictureData) {
          await supabase
            .from("complaint_pictures")
            .insert({
              complaint_id: complaintData.id,
              picture_id: pictureData.id,
            });
        }
      }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      {/* Header/Nav */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 w-full max-w-7xl mx-auto">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => router.push("/")}
        >
          <Home className="w-5 h-5" />
          <span className="hidden sm:inline">Back to Home</span>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mt-16 sm:mt-0"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-white/50">
          <div className="p-4 sm:p-8">
            <div className="mb-6 sm:mb-8 text-center sm:text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-vinta-purple to-vinta-pink bg-clip-text text-transparent mb-2">
                New Report
              </h1>
              <p className="text-gray-500 text-sm">
                Help us improve Zamboanga City by reporting issues.
              </p>
            </div>

            <div className="mb-8 overflow-x-auto pb-2">
              {/* Mobile View: Simplified Stepper could go here if needed, but horizontal works okay on mobile usually */}
              <Stepper steps={steps as any} />
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-50 duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Report Submitted!
                </h2>
                <p className="text-gray-500">
                  Thank you for your contribution. Redirecting you home...
                </p>
              </div>
            ) : (
              <div className="relative min-h-[300px]">
                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <Select
                        label="What type of issue is this?"
                        description="Select the category that best fits the problem."
                        options={CATEGORIES}
                        value={formData.category}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, category: val }))
                        }
                        error={validationErrors.category}
                      />
                      <Input
                        label="Where is it located?"
                        placeholder="e.g., Corner of Rizal St. and Tetuan Highway"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        error={validationErrors.location}
                      />
                    </motion.div>
                  )}

                  {currentStep === 1 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <Input
                        label="Issue Title"
                        placeholder="Brief summary of the issue"
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
                        label="Description"
                        placeholder="Please describe the issue in detail..."
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

                  {currentStep === 2 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <span className="block text-sm font-semibold text-gray-700">
                          Photo Evidence (Optional)
                        </span>
                        <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 hover:bg-gray-50 transition-colors relative bg-white/50">
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
                                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
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
                              <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer rounded-md bg-transparent font-semibold text-vinta-purple focus-within:outline-none focus-within:ring-2 focus-within:ring-vinta-purple focus-within:ring-offset-2 hover:text-vinta-pink"
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
                              <p className="text-xs leading-5 text-gray-600">
                                PNG, JPG, GIF up to 10MB
                              </p>
                            </div>
                          )}
                        </div>
                        {validationErrors.image && (
                          <p className="text-sm text-red-500">
                            {validationErrors.image}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <Input
                        label="Contact Number (Optional)"
                        placeholder="For updates on your report"
                        value={formData.contactNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactNumber: e.target.value,
                          }))
                        }
                        error={validationErrors.contactNumber}
                      />

                      <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-900">Summary</h3>
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-gray-500">Category:</span>
                          <span className="col-span-2 font-medium">
                            {formData.category?.name}
                          </span>

                          <span className="text-gray-500">Title:</span>
                          <span className="col-span-2 font-medium">
                            {formData.title}
                          </span>

                          <span className="text-gray-500">Location:</span>
                          <span className="col-span-2 font-medium">
                            {formData.location}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!success && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0 || isLoading}
                  className={currentStep === 0 ? "invisible" : ""}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button onClick={handleNext}>
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    variant="primary"
                    className="bg-gradient-to-r from-vinta-purple to-vinta-pink shadow-vinta-purple/25"
                  >
                    {isLoading ? "Submitting..." : "Submit Report"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
