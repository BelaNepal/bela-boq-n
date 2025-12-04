import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

export const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-md px-8 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <img src="/belalogo.png" alt="Bela Nepal" className="h-24 w-auto animate-pulse" />
          <h2 className="text-2xl font-bold text-foreground">Loading...</h2>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-center text-muted-foreground text-sm">
          Please wait while we prepare your workspace
        </p>
      </div>
    </div>
  );
};
