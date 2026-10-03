import { Metadata } from "next";
import { Settings as SettingsIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Settings | KhataBook",
  description: "Administrative preferences and system configurations",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Settings</CardTitle>
          <CardDescription>
            Configure portal preferences, notification channels, and security settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center bg-card/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              System Settings
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Configuration options and preferences will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
