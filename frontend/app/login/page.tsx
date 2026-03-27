"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const fn = mode === "login" ? login : signup;
            const response = await fn({ email, password });
            window.localStorage.setItem("contentai_access_token", response.access_token);
            window.localStorage.setItem("contentai_user_email", response.email);
            router.replace("/app");
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const detail = err.response?.data?.detail;
                if (typeof detail === "string" && detail.trim()) {
                    setError(detail);
                } else {
                    setError(mode === "login" ? "Invalid credentials." : "Unable to create account.");
                }
            } else {
                setError(mode === "login" ? "Invalid credentials." : "Unable to create account.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-shell-bg flex min-h-screen items-center justify-center px-4 py-8">
            <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="app-panel border-border/80 p-2">
                    <CardHeader>
                        <CardTitle className="text-2xl tracking-tight">ContentAI Workspace</CardTitle>
                        <CardDescription>
                            Secure access to generation workflows, compliance approvals, and publishing history.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="rounded-xl border border-border bg-secondary p-4">
                            Unified generation, review, and governance in one place.
                        </div>
                        <div className="rounded-xl border border-border bg-secondary p-4">
                            Built for teams that need reliable, policy-safe content operations.
                        </div>
                        <div className="rounded-xl border border-border bg-secondary p-4">
                            Minimal interface, clear workflows, enterprise-ready control.
                        </div>
                    </CardContent>
                </Card>

                <Card className="app-panel border-border/80">
                    <CardHeader>
                        <CardTitle>{mode === "login" ? "Sign in" : "Create account"}</CardTitle>
                        <CardDescription>
                            {mode === "login"
                                ? "Continue to your workspace"
                                : "Create an account to start generating content"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={onSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="border-border bg-input"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 8 characters"
                                    className="border-border bg-input"
                                />
                            </div>

                            {error && <p className="text-sm text-destructive">{error}</p>}

                            <Button className="h-11 w-full" type="submit" disabled={loading}>
                                {loading ? "Please wait" : mode === "login" ? "Sign in" : "Create account"}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full"
                                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                            >
                                {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
