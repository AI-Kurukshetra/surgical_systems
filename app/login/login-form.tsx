"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getSafeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

function getSessionRole(user: {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
}) {
  const userMetaRole = user.user_metadata?.role;
  if (typeof userMetaRole === "string" && userMetaRole.trim()) return userMetaRole;

  const appMetaRole = user.app_metadata?.role;
  if (typeof appMetaRole === "string" && appMetaRole.trim()) return appMetaRole;

  return null;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextPath = getSafeNextPath(searchParams.get("next"));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = getSupabaseBrowserClient();

    try {
      if (isSignUp) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: "staff" },
          },
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        if (!data.session) {
          setInfo("Signup successful. Please verify your email, then login.");
          setIsSignUp(false);
          setPassword("");
          return;
        }

        await supabase.from("profiles").upsert({
          id: data.user?.id,
          full_name: fullName || null,
          email,
          role: "staff",
        } as never);

        router.replace(nextPath);
        router.refresh();
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }

      if (!data.session) {
        setError("Login failed: session was not created.");
        return;
      }

      const role = getSessionRole(data.user);
      const profilePayload: Record<string, unknown> = {
        id: data.user.id,
        full_name: (data.user.user_metadata?.full_name as string | undefined) ?? null,
        email: data.user.email ?? email,
      };

      if (role) {
        profilePayload.role = role;
      }

      await supabase.from("profiles").upsert(profilePayload as never);

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Unexpected authentication error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? "Create account" : "Welcome back"}</CardTitle>
          <CardDescription>
            {isSignUp ? "Register to access SmartOR" : "Sign in to your SmartOR workspace"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignUp ? (
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            ) : null}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {info ? <p className="text-sm text-emerald-600">{info}</p> : null}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Sign up" : "Login"}
            </Button>

            <button
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              type="button"
              onClick={() => setIsSignUp((prev) => !prev)}
            >
              {isSignUp ? "Already have an account? Login" : "Need an account? Sign up"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
