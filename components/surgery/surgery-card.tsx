import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function SurgeryCard({
  title,
  patient,
  room,
  start,
  status,
}: {
  title: string;
  patient: string;
  room: string;
  start: string;
  status: "scheduled" | "in_progress" | "completed" | "delayed";
}) {
  const variant = status === "delayed" ? "destructive" : status === "completed" ? "secondary" : "default";

  return (
    <Card>
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">Patient: {patient}</p>
          <p className="text-sm text-muted-foreground">{room}</p>
        </div>
        <div className="text-right">
          <Badge variant={variant}>{status}</Badge>
          <p className="mt-2 text-xs text-muted-foreground">{start}</p>
        </div>
      </CardContent>
    </Card>
  );
}
