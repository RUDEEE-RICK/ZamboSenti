"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  Lock,
  User,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BARANGAYS } from "@/lib/data/barangays";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  address: string;
  barangay: string;
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
          barangay: profile.barangay,
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
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="Settings" showNotifications={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/account")}
          className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Account
        </button>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-2 border-gray-100">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "profile"
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "security"
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Shield className="w-4 h-4" />
                Security
              </button>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {activeTab === "profile"
                  ? "Profile Information"
                  : "Security Settings"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "profile"
                  ? "Update your personal details."
                  : "Manage your password and security."}
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <Card className="border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-rose-700">{error}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </Card>
            )}

            {success && (
              <Card className="border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm text-emerald-700">{success}</p>
                </div>
              </Card>
            )}

            {/* Form Content */}
            <Card className="border-gray-100">
              {activeTab === "profile" ? (
                <div className="p-6 space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Full Name
                      </label>
                      <Input
                        value={profile?.name || ""}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Email Address
                      </label>
                      <Input
                        value={profile?.email || ""}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Street Address
                      </label>
                      <Input
                        value={profile?.address || ""}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        placeholder="Your street address"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Barangay
                      </label>
                      <select
                        value={profile?.barangay || ""}
                        onChange={(e) =>
                          handleInputChange("barangay", e.target.value)
                        }
                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">Select barangay</option>
                        {BARANGAYS.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Contact Number
                      </label>
                      <Input
                        value={profile?.contact_number || ""}
                        onChange={(e) =>
                          handleInputChange("contact_number", e.target.value)
                        }
                        placeholder="e.g. 09123456789"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Emergency Contact
                      </label>
                      <Input
                        value={profile?.emergency_contact || ""}
                        onChange={(e) =>
                          handleInputChange("emergency_contact", e.target.value)
                        }
                        placeholder="Emergency contact number"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Birth Date
                      </label>
                      <Input
                        type="date"
                        value={profile?.birth_date || ""}
                        onChange={(e) =>
                          handleInputChange("birth_date", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Gender
                      </label>
                      <select
                        value={profile?.gender || ""}
                        onChange={(e) =>
                          handleInputChange("gender", e.target.value)
                        }
                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                      className="bg-primary hover:bg-primary/90"
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
                <div className="p-6 space-y-5">
                  <Card className="bg-amber-50 border-amber-200 p-4">
                    <div className="flex gap-3">
                      <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-900">
                          Password Security
                        </h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Use a strong password with letters, numbers, and
                          symbols.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        New Password
                      </label>
                      <Input
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
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Confirm New Password
                      </label>
                      <Input
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
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isSaving || !passwordData.newPassword}
                      className="bg-primary hover:bg-primary/90"
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
            </Card>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
