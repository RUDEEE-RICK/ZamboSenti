"use client";

import { cn, handleError, buildFullName } from "@/lib/utils";
import { validateSignUpForm } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [fName, setFName] = useState("");
  const [mName, setMName] = useState("");
  const [lName, setLName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const validation = validateSignUpForm({
      firstName: fName,
      middleName: mName,
      lastName: lName,
      address,
      contact,
      birthDate,
      password,
      repeatPassword,
    });

    if (!validation.valid) {
      setError(validation.error!);
      setIsLoading(false);
      return;
    }

    const fullname = buildFullName(fName, mName, lName);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: fullname,
            address,
            contact,
            birth_date: birthDate,
            user_roles: "citizen",
          }
        },
      });
      if (error) throw error;

      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(handleError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Join ZamboSenti</CardTitle>
          <CardDescription>Create an account to start filing complaints in Zamboanga City</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-2" suppressHydrationWarning>
                <div className="grid gap-2">
                  <Label htmlFor="fName">First Name</Label>
                  <Input
                    id="fName"
                    type="text"
                    placeholder="Juan"
                    required
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    suppressHydrationWarning
                  />
                </div>
                <div className="grid gap-2 justify-center">
                  <Label htmlFor="mName">Middle Name</Label>
                  <Input
                    id="mName"
                    type="text"
                    placeholder="D"
                    required
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    className="w-14 justify-center"
                    suppressHydrationWarning
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lName">Last Name</Label>
                  <Input
                    id="lName"
                    type="text"
                    placeholder="Delacruz"
                    required
                    value={lName}
                    onChange={(e) => setLName(e.target.value)}
                    suppressHydrationWarning
                  />
                </div>
              </div>
              <div className="grid gap-2" suppressHydrationWarning>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main St"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  suppressHydrationWarning
                />
              </div>
              <div className="grid gap-2" suppressHydrationWarning>
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  type="tel"
                  placeholder="+63 912 345 6789"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  suppressHydrationWarning
                />
              </div>
              {/* birth date */}
              <div className="grid gap-2" suppressHydrationWarning>
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                  id="birthDate"
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  suppressHydrationWarning
                />
              </div>
              <div className="grid gap-2" suppressHydrationWarning>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  suppressHydrationWarning
                />
              </div>
              <div className="grid gap-2" suppressHydrationWarning>
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  suppressHydrationWarning
                />
              </div>
              <div className="grid gap-2" suppressHydrationWarning>
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  suppressHydrationWarning
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
