import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Welcome to ZamboSenti!
              </CardTitle>
              <CardDescription>Check your email to confirm your account</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up for ZamboSenti. Please check your email to
                confirm your account before signing in. Once confirmed, you can start filing complaints and tracking their status in Zamboanga City.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
