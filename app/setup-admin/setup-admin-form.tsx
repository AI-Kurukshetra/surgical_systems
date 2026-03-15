"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

type ApiEnvelope = {
  success: boolean;
  message?: string;
  data?: {
    userId: string;
    email: string;
    role: "admin";
  };
};

export function SetupAdminForm() {
  const [email, setEmail] = useState("admin@smartor.com");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json().catch(() => null)) as ApiEnvelope | null;
      if (!response.ok || !payload?.success) {
        setErrorMessage(payload?.message ?? "Unable to create admin user.");
        return;
      }

      setSuccessMessage(`Admin created successfully for ${payload.data?.email ?? email}.`);
    } catch {
      setErrorMessage("Unexpected error while creating admin user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Setup Admin</CardTitle>
        <CardDescription>Create the first SmartOR administrator account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleCreateAdmin}>
          <div className="space-y-1">
            <Label htmlFor="admin-email">Admin Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="admin-password">Password</Label>
            <PasswordInput
              id="admin-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Creating Admin..." : "Create Admin"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already initialized? <Link href="/login" className="underline">Go to login</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
