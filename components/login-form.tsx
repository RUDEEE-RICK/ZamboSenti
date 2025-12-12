"use client";

import { cn, handleError } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/supabase/utils";
import { Button } from "@/components/headless/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/headless/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const redirectPath =
        user && (await isAdmin(user.id)) ? "/admin/complaints" : "/";

      router.push(redirectPath);
      router.refresh();
    } catch (error: unknown) {
      setError(handleError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-vinta-purple to-vinta-pink bg-clip-text text-transparent">
            Welcome to ZamSolucion
          </CardTitle>
          <CardDescription>
            Login to file complaints and track their status in Zamboanga City
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <Input
                label="Email"
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                suppressHydrationWarning
              />

              <div className="grid gap-2">
                <Input
                  label="Password"
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  suppressHydrationWarning
                />
                <div className="flex justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-medium text-vinta-purple hover:text-vinta-pink transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="font-bold text-vinta-purple hover:underline"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
