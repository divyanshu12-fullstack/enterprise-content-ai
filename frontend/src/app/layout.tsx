import type { Metadata } from "next";
import { Sora, Space_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const sora = Sora({
    subsets: ["latin"],
    variable: "--font-sora"
});

const spaceMono = Space_Mono({
    subsets: ["latin"],
    variable: "--font-space-mono",
    weight: ["400", "700"]
});

export const metadata: Metadata = {
    title: "Enterprise Content AI",
    description: "Frontend scaffold for multi-agent content operations"
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${sora.variable} ${spaceMono.variable}`}>
                <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_1fr]">
                    <Sidebar />
                    <main className="glass-panel shell-grid min-h-[calc(100vh-2rem)] rounded-3xl p-6 lg:p-8">{children}</main>
                </div>
            </body>
        </html>
    );
}
