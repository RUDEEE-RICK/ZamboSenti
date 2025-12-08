export function Hero() {
  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl lg:text-6xl font-bold text-primary">
          ZamboSenti
        </h1>
        <p className="text-xl lg:text-2xl text-muted-foreground font-medium">
          Ez File Complaint
        </p>
      </div>
      <p className="text-lg lg:text-xl !leading-relaxed mx-auto max-w-2xl text-center text-foreground/80">
        Report issues in{" "}
        <span className="font-bold text-primary">
          Zamboanga City
        </span>{" "}
        quickly and securely. Track your complaints from submission to resolution.
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-4" />
    </div>
  );
}
