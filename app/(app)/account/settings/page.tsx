"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/headless/Button";
import { Input } from "@/components/headless/Input";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  Lock,
  User,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AnimatedBackground } from "@/components/animated-background";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  address: string;
  contact_number: string;
  emergency_contact: string;
  birth_date: string;
  gender: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchUserProfile = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setProfile({
        ...data,
        email: user.email || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const supabase = createClient();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          address: profile.address,
          contact_number: profile.contact_number,
          emergency_contact: profile.emergency_contact,
          birth_date: profile.birth_date,
          gender: profile.gender,
        })
        .eq("id", profile.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    const supabase = createClient();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error changing password:", err);
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <AnimatedBackground />
        <AppHeader title="Settings" showNotifications={false} />
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh] relative z-10">
          <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/50">
            <Loader2 className="w-8 h-8 animate-spin text-vinta-purple" />
            <p className="text-lg font-medium text-vinta-purple-dark">
              Loading your preferences...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      <AppHeader title="Settings" showNotifications={false} />

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        <button
          onClick={() => router.push("/account")}
          className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-vinta-purple transition-colors bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Account
        </button>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-2">
            <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-lg rounded-xl overflow-hidden p-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "profile"
                    ? "bg-gradient-to-r from-vinta-purple to-vinta-pink text-white shadow-md"
                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                }`}
              >
                <User className="w-4 h-4" />
                Profile Details
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "security"
                    ? "bg-gradient-to-r from-vinta-purple to-vinta-pink text-white shadow-md"
                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                }`}
              >
                <Shield className="w-4 h-4" />
                Security
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-vinta-purple-dark to-vinta-pink-dark">
                  {activeTab === "profile"
                    ? "Profile Information"
                    : "Security Settings"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {activeTab === "profile"
                    ? "Update your personal details and contact information."
                    : "Manage your password and account security."}
                </p>
              </div>
            </div>

            {error && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                <Card className="border-red-200 bg-red-50/90 backdrop-blur-sm shadow-sm">
                  <div className="p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900">Error</h4>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                    <Button
                      variant="ghost"
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-100"
                      onClick={() => setError(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {success && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                <Card className="border-green-200 bg-green-50/90 backdrop-blur-sm shadow-sm">
                  <div className="p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900">Success</h4>
                      <p className="text-sm text-green-700 mt-1">{success}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl overflow-hidden rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === "profile" ? (
                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      id="name"
                      value={profile?.name || ""}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Your full name"
                      startIcon={<User className="w-4 h-4" />}
                    />

                    <div className="space-y-2">
                      <Input
                        label="Email Address"
                        id="email"
                        value={profile?.email || ""}
                        disabled
                        className="bg-gray-100/50"
                        startIcon={<Mail className="w-4 h-4" />}
                      />
                      <p className="text-xs text-muted-foreground ml-1">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <Input
                    label="Address"
                    id="address"
                    value={profile?.address || ""}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="Your complete address"
                    startIcon={<MapPin className="w-4 h-4" />}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Contact Number"
                      id="contact_number"
                      value={profile?.contact_number || ""}
                      onChange={(e) =>
                        handleInputChange("contact_number", e.target.value)
                      }
                      placeholder="e.g. 09123456789"
                      startIcon={<Phone className="w-4 h-4" />}
                    />

                    <Input
                      label="Emergency Contact"
                      id="emergency_contact"
                      value={profile?.emergency_contact || ""}
                      onChange={(e) =>
                        handleInputChange("emergency_contact", e.target.value)
                      }
                      placeholder="Emergency contact number"
                      startIcon={<Heart className="w-4 h-4" />}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Birth Date"
                      id="birth_date"
                      type="date"
                      value={profile?.birth_date || ""}
                      onChange={(e) =>
                        handleInputChange("birth_date", e.target.value)
                      }
                      startIcon={<Calendar className="w-4 h-4" />}
                    />

                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        id="gender"
                        value={profile?.gender || ""}
                        onChange={(e) =>
                          handleInputChange("gender", e.target.value)
                        }
                        className="block w-full rounded-xl border-2 border-gray-200 bg-white/50 px-4 py-2.5 text-sm text-gray-900 focus:border-vinta-purple focus:outline-none focus:ring-4 focus:ring-vinta-purple/10 transition-all duration-200"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-vinta-purple to-vinta-pink hover:from-vinta-purple-dark hover:to-vinta-pink-dark text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[140px]"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex gap-3">
                      <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-900">
                          Password Security
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Ensure your account stays safe by using a strong
                          password. We recommend using a combination of letters,
                          numbers, and symbols.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-md">
                    <Input
                      label="New Password"
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Enter new password"
                    />

                    <Input
                      label="Confirm New Password"
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isSaving || !passwordData.newPassword}
                      className="bg-gradient-to-r from-vinta-purple to-vinta-pink hover:from-vinta-purple-dark hover:to-vinta-pink-dark text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[160px]"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
