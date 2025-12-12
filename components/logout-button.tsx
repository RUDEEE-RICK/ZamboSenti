"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/headless/Button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <Button onClick={logout} variant="destructive">
      Logout
    </Button>
  );
}
