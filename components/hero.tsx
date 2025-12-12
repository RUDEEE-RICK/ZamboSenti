export function Hero() {
  return (
    <div className="flex flex-col gap-8 items-center py-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
          ZamboSenti
        </h1>
        <p className="text-2xl lg:text-3xl text-muted-foreground font-medium tracking-tight">
          Ez File Complaint
        </p>
      </div>
      <p className="text-lg lg:text-xl leading-relaxed mx-auto max-w-2xl text-center text-muted-foreground">
        Report issues in{" "}
        <span className="font-bold text-primary">
          Zamboanga City
        </span>{" "}
        quickly and securely. Track your complaints from submission to resolution.
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent my-8" />
    </div>
  );
}
