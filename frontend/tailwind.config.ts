import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {
            colors: {
                ink: "#101017",
                dusk: "#1a1f2b",
                flare: "#f25930",
                mist: "#eff2f8",
                mint: "#7ae6c7"
            },
            fontFamily: {
                display: ["var(--font-sora)"],
                mono: ["var(--font-space-mono)"]
            },
            boxShadow: {
                panel: "0 20px 60px rgba(7, 10, 20, 0.35)"
            },
            backgroundImage: {
                noise: "radial-gradient(circle at 20% 20%, rgba(242, 89, 48, 0.15), transparent 38%), radial-gradient(circle at 85% 5%, rgba(122, 230, 199, 0.2), transparent 40%), linear-gradient(135deg, #11131c 0%, #1e2433 50%, #101017 100%)"
            },
            keyframes: {
                drift: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-6px)" }
                },
                reveal: {
                    "0%": { opacity: "0", transform: "translateY(14px)" },
                    "100%": { opacity: "1", transform: "translateY(0px)" }
                }
            },
            animation: {
                drift: "drift 6s ease-in-out infinite",
                reveal: "reveal 450ms ease-out both"
            }
        }
    },
    plugins: []
};

export default config;
