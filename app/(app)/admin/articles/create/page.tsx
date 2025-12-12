"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/headless/Button";
import { Input } from "@/components/headless/Input";
import { Textarea } from "@/components/headless/Textarea";
import {
  ArrowLeft,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Edit3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export default function CreateArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showPreview, setShowPreview] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate files
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          images: "Each image must be less than 10MB",
        }));
        return;
      }
      if (!file.type.startsWith("image/")) {
        setValidationErrors((prev) => ({
          ...prev,
          images: "Only image files are allowed",
        }));
        return;
      }
    }

    setImageFiles((prev) => [...prev, ...files]);
    setValidationErrors((prev) => ({ ...prev, images: "" }));

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Title is required";
    } else if (title.trim().length < 10) {
      errors.title = "Title must be at least 10 characters";
    }

    if (!content.trim()) {
      errors.content = "Content is required";
    } else if (content.trim().length < 50) {
      errors.content = "Content must be at least 50 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      setError("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      // Verify user is admin
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required. Please log in again.");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_roles")
        .eq("id", user.id)
        .single();

      if (!profile || profile.user_roles !== "admin") {
        throw new Error("Admin privileges required");
      }

      // Insert article
      const { data: articleData, error: insertError } = await supabase
        .from("articles")
        .insert({
          title: title.trim(),
          content: content.trim(),
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create article: ${insertError.message}`);
      }

      const articleId = articleData.id;

      // Upload images if any
      if (imageFiles.length > 0) {
        for (const imageFile of imageFiles) {
          // Upload to storage
          const fileExt = imageFile.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`;
          const filePath = `articles/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("report-image")
            .upload(filePath, imageFile);

          if (uploadError) {
            console.error("Image upload failed:", uploadError);
            continue; // Skip this image but continue with others
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("report-image").getPublicUrl(filePath);

          // Insert into pictures table
          const { data: pictureData, error: pictureError } = await supabase
            .from("pictures")
            .insert({
              image_path: publicUrl,
              parent_type: "article",
              parent_id: articleId,
            })
            .select()
            .single();

          if (pictureError) {
            console.error("Failed to insert picture:", pictureError);
            continue;
          }

          // Link article and picture
          const { error: linkError } = await supabase
            .from("article_pictures")
            .insert({
              article_id: articleId,
              picture_id: pictureData.id,
            });

          if (linkError) {
            console.error("Failed to link article and picture:", linkError);
          }
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/articles");
      }, 2000);
    } catch (error: unknown) {
      console.error("Error creating article:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Create Article" showNotifications={false} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 pl-0 hover:bg-transparent hover:text-vinta-purple transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        {error && (
          <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
            <Card className="p-4 border-red-200 bg-red-50/90 backdrop-blur-sm border-none shadow-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Error</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {success && (
          <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
            <Card className="p-4 border-green-200 bg-green-50/90 backdrop-blur-sm border-none shadow-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">Success!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Article created successfully. Redirecting...
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Card className="overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-md">
          <div className="bg-gradient-to-r from-vinta-purple to-vinta-pink p-8 text-white">
            <h2 className="text-3xl font-bold">Create New Article</h2>
            <p className="text-white/90 mt-2 font-medium">
              Write and publish news for Zamboanga City residents
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Title */}
            <Input
              label={
                <span className="flex items-center gap-1">
                  Article Title <span className="text-red-500">*</span>
                </span>
              }
              id="title"
              type="text"
              placeholder="Enter article title (minimum 10 characters)"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setValidationErrors((prev) => ({ ...prev, title: "" }));
              }}
              error={validationErrors.title}
            />

            {/* Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                  Article Content (Markdown){" "}
                  <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-8 text-xs border-vinta-purple/20 hover:bg-vinta-purple/5 text-vinta-purple"
                >
                  {showPreview ? (
                    <>
                      <Edit3 className="w-3 h-3 mr-2" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-2" />
                      Preview
                    </>
                  )}
                </Button>
              </div>

              {showPreview ? (
                <Card className="p-6 min-h-[300px] bg-secondary/20 rounded-xl border border-gray-200">
                  <MarkdownRenderer content={content} />
                </Card>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    id="content"
                    placeholder="Write your article content here in markdown format (minimum 50 characters)...\n\nExample:\n# Heading 1\n## Heading 2\n**Bold text**\n*Italic text*\n- List item\n```code block```"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, content: "" }));
                    }}
                    className="font-mono text-sm min-h-[400px]"
                    error={validationErrors.content}
                  />
                  {!validationErrors.content && (
                    <p className="text-xs text-right text-gray-400">
                      {content.length} characters • Supports markdown formatting
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Images (Optional)
              </label>

              <div
                className={`border-2 border-dashed rounded-xl p-8 transition-colors ${
                  validationErrors.images
                    ? "border-red-500 bg-red-50/50"
                    : "border-gray-200 hover:border-vinta-purple/50 hover:bg-gray-50/50"
                }`}
              >
                {imagePreviews.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="relative group rounded-xl overflow-hidden shadow-sm"
                        >
                          <div className="relative w-full h-32">
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              className="h-8 w-8 p-0 rounded-full"
                              onClick={() => removeImage(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center">
                      <label htmlFor="images">
                        <div className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-vinta-purple border border-vinta-purple/20 bg-white hover:bg-vinta-purple/5 cursor-pointer transition-colors shadow-sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Add More Images
                        </div>
                        <input
                          id="images"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="images"
                    className="flex flex-col items-center justify-center cursor-pointer gap-2 py-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-vinta-purple/10 flex items-center justify-center mb-2 text-vinta-purple group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-base font-medium text-gray-900">
                      Click to upload images
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG up to 10MB each
                    </p>
                    <input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              {validationErrors.images && (
                <p className="text-sm text-red-500 mt-2 font-medium">
                  {validationErrors.images}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-gray-100">
              <Button
                type="submit"
                variant="primary"
                className="flex-1 h-12 text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Created!
                  </>
                ) : (
                  "Create Article"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 px-8"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
