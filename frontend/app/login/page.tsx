"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowRight, Eye, EyeOff, Hexagon, ShieldCheck, Zap, Workflow, AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordMismatch, setPasswordMismatch] = useState(false);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (error) setError(null);
        if (emailError) setEmailError(null);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (error) setError(null);
        if (passwordMismatch && mode === "signup") setPasswordMismatch(false);
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
        if (passwordMismatch) setPasswordMismatch(false);
    };

    const handleEmailBlur = () => {
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("Please enter a valid email address.");
        }
    };

    const handleConfirmPasswordBlur = () => {
        if (confirmPassword && confirmPassword !== password) {
            setPasswordMismatch(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const form = e.currentTarget.closest("form");
            if (form) form.requestSubmit();
        }
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("Please enter a valid email address.");
            return;
        }

        if (mode === "signup" && password !== confirmPassword) {
            setPasswordMismatch(true);
            return;
        }

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
                if (mode === "signup" && err.response?.status === 409) {
                    setError("409_CONFLICT");
                } else {
                    const detail = err.response?.data?.detail;
                    if (typeof detail === "string" && detail.trim()) {
                        setError(detail);
                    } else {
                        setError(mode === "login" ? "Invalid credentials." : "Unable to create account.");
                    }
                }
            } else {
                setError(mode === "login" ? "Invalid credentials." : "Unable to create account.");
            }
        } finally {
            setLoading(false);
        }
    };

    const getPwdStrength = (pwd: string) => {
        if (!pwd) return 0;
        if (pwd.length < 6) return 1;
        if (pwd.length < 10) return 2;
        return 3;
    };
    const pwdStrength = getPwdStrength(password);

    return (
        <div className="app-shell-bg flex min-h-screen items-center justify-center px-4 py-8">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes button-shimmer {
                    0% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 rgba(255,255,255,0); }
                    50% { opacity: 0.95; transform: scale(0.99); box-shadow: 0 0 8px rgba(255,255,255,0.1); }
                    100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 rgba(255,255,255,0); }
                }
                .btn-shimmer:not(:disabled):hover {
                    animation: button-shimmer 2s ease-in-out infinite;
                }
                @keyframes loading-skeleton {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .btn-loading::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
                    animation: loading-skeleton 1.5s infinite;
                }
            `}} />
            <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                {/* LEFT PANEL */}
                <div className="app-panel relative hidden flex-col justify-between overflow-hidden rounded-xl border border-border/80 p-8 md:flex">
                    <div className="absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-5 blur-3xl mix-blend-screen" />

                    <div>
                        <div className="mb-10 flex items-center gap-2">
                            <Hexagon className="h-6 w-6 text-foreground" />
                            <span className="font-heading text-xl font-medium tracking-tight text-foreground">ContentAI</span>
                        </div>
                        <h2 className="mb-4 text-3xl font-light tracking-tight text-foreground">
                            Enterprise Content Workspace
                        </h2>
                        <p className="text-muted-foreground">
                            Secure access to generation workflows, compliance approvals, and publishing history.
                        </p>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="flex items-start gap-4 rounded-xl border-l-[3px] border-l-border border-y-transparent border-r-transparent bg-secondary/50 p-4">
                            <Zap className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                            <div className="text-sm text-foreground/90">
                                <span className="block font-medium text-foreground">Unified Generation</span>
                                <span className="text-muted-foreground">Streamlined creation, review, and governance in one place.</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 rounded-xl border-l-[3px] border-l-border border-y-transparent border-r-transparent bg-secondary/50 p-4">
                            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                            <div className="text-sm text-foreground/90">
                                <span className="block font-medium text-foreground">Compliance First</span>
                                <span className="text-muted-foreground">Built for teams that need reliable, policy-safe content operations.</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 rounded-xl border-l-[3px] border-l-border border-y-transparent border-r-transparent bg-secondary/50 p-4">
                            <Workflow className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                            <div className="text-sm text-foreground/90">
                                <span className="block font-medium text-foreground">Clear Workflows</span>
                                <span className="text-muted-foreground">Minimal interface with enterprise-ready flow control.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <Card className="app-panel relative flex flex-col justify-center border-border/80 p-2 md:p-6 lg:p-8 overflow-hidden rounded-xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="flex flex-col gap-6"
                        >
                            <CardHeader className="px-0 pb-0">
                                <CardTitle className="text-2xl">{mode === "login" ? "Sign in" : "Create account"}</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    {mode === "login"
                                        ? "Continue to your workspace"
                                        : "Create an account to start generating content"}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="px-0 pb-0">
                                <form className="space-y-5" onSubmit={onSubmit}>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={handleEmailChange}
                                            onBlur={handleEmailBlur}
                                            onKeyDown={handleKeyDown}
                                            disabled={loading}
                                            autoComplete="email"
                                            aria-describedby={emailError ? "email-error" : undefined}
                                            placeholder="you@company.com"
                                            className={`border-border bg-input transition-colors focus-visible:bg-secondary focus-visible:ring-1 focus-visible:ring-ring ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        />
                                        {emailError && (
                                            <p id="email-error" className="text-xs text-destructive">{emailError}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-muted-foreground">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                minLength={8}
                                                value={password}
                                                onChange={handlePasswordChange}
                                                onKeyDown={handleKeyDown}
                                                disabled={loading}
                                                autoComplete={mode === "login" ? "current-password" : "new-password"}
                                                placeholder="Minimum 8 characters"
                                                className="border-border bg-input pr-10 transition-colors focus-visible:bg-secondary focus-visible:ring-1 focus-visible:ring-ring"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={loading}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {mode === "signup" && (
                                            <div className="mt-2 flex h-1 w-full gap-1">
                                                <div className={`h-full w-full rounded-full transition-colors ${pwdStrength >= 1 ? "bg-destructive" : "bg-muted"}`} />
                                                <div className={`h-full w-full rounded-full transition-colors ${pwdStrength >= 2 ? "bg-[var(--warning)]" : "bg-muted"}`} />
                                                <div className={`h-full w-full rounded-full transition-colors ${pwdStrength >= 3 ? "bg-[var(--success)]" : "bg-muted"}`} />
                                            </div>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {mode === "signup" && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="space-y-2 pt-1">
                                                    <Label htmlFor="confirmPassword" className="text-muted-foreground">Confirm Password</Label>
                                                    <Input
                                                        id="confirmPassword"
                                                        type={showPassword ? "text" : "password"}
                                                        required
                                                        value={confirmPassword}
                                                        onChange={handleConfirmPasswordChange}
                                                        onBlur={handleConfirmPasswordBlur}
                                                        onKeyDown={handleKeyDown}
                                                        disabled={loading}
                                                        autoComplete="new-password"
                                                        aria-describedby={passwordMismatch ? "confirm-password-error" : undefined}
                                                        placeholder="Confirm your password"
                                                        className={`border-border bg-input transition-colors focus-visible:bg-secondary focus-visible:ring-1 focus-visible:ring-ring ${passwordMismatch ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                                    />
                                                    {passwordMismatch && (
                                                        <p id="confirm-password-error" className="text-xs text-destructive">Passwords do not match.</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {error && (
                                        <div className="flex items-start gap-3 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive relative">
                                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <div className="flex-1 leading-tight">
                                                {error === "409_CONFLICT" ? (
                                                    <>
                                                        This email is already registered.{" "}
                                                        <button
                                                            type="button"
                                                            className="font-semibold underline hover:text-destructive/80 transition-colors"
                                                            onClick={() => {
                                                                setMode("login");
                                                                setError(null);
                                                            }}
                                                        >
                                                            Sign in instead?
                                                        </button>
                                                    </>
                                                ) : (
                                                    error
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setError(null)}
                                                className="text-destructive/70 hover:text-destructive shrink-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}

                                    <Button className={`btn-shimmer h-11 w-full mt-2 ${loading ? "btn-loading relative overflow-hidden" : ""}`} type="submit" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {mode === "login" ? "Signing in..." : "Creating account..."}
                                            </>
                                        ) : (
                                            <>
                                                {mode === "login" ? "Sign in" : "Create account"}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>

                                    <div className="pt-2 text-center text-sm">
                                        <button
                                            type="button"
                                            className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                            onClick={() => setMode(mode === "login" ? "signup" : "login")}
                                        >
                                            {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
                                        </button>
                                    </div>
                                </form>
                            </CardContent>
                        </motion.div>
                    </AnimatePresence>
                </Card>
            </div>
        </div>
    );
}
