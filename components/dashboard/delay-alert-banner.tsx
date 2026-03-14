import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DelayAlertBanner({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span>{count} surgeries are delayed. Teams have been notified automatically.</span>
      </CardContent>
    </Card>
  );
}
