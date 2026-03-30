import { expect, test } from "@playwright/test";

test("golden flow: login -> generate -> approval -> publish -> history", async ({ page }) => {
    const runState: {
        token: string;
        userEmail: string;
        generation: null | {
            id: string;
            topic: string;
            audience: string;
            linkedin_post: string;
            twitter_post: string;
            image_prompt: string;
            compliance_status: "APPROVED" | "REJECTED";
            compliance_notes: string;
            status: string;
            duration_ms: number;
            created_at: string;
            completed_at: string | null;
        };
    } = {
        token: "smoke-token",
        userEmail: "smoke@example.com",
        generation: null,
    };

    await page.route("**/api/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const method = request.method();

        if (url.pathname === "/api/auth/signup" && method === "POST") {
            const payload = request.postDataJSON() as { email: string; password: string; };
            runState.userEmail = payload.email;
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    access_token: runState.token,
                    token_type: "bearer",
                    user_id: "user-smoke",
                    email: runState.userEmail,
                }),
            });
            return;
        }

        if (url.pathname === "/api/auth/me" && method === "GET") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ id: "user-smoke", email: runState.userEmail, is_active: true }),
            });
            return;
        }

        if (url.pathname === "/api/settings" && method === "GET") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    selected_model: "gemini-3-flash-preview",
                    auto_retry: true,
                    max_retries: 2,
                    include_source_urls: true,
                    auto_generate_image: true,
                    strict_compliance: true,
                    custom_blocked_words: [],
                    has_api_key: true,
                }),
            });
            return;
        }

        if (url.pathname === "/api/generate" && method === "POST") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    linkedin_post: "Enterprise teams can scale AI safely with policy-first execution.",
                    twitter_post: "Policy-first AI delivery improves reliability and trust. #AI #Enterprise",
                    image_prompt: "Modern enterprise command center with ethical AI visuals",
                    compliance_status: "APPROVED",
                    compliance_notes: "Compliant",
                }),
            });
            return;
        }

        if (url.pathname === "/api/generate/stream" && method === "POST") {
            const sse = [
                'event: progress\ndata: {"stage":"init","message":"Initializing generation pipeline"}\n\n',
                'event: progress\ndata: {"stage":"research","message":"Gathering market context"}\n\n',
                'event: progress\ndata: {"stage":"writing","message":"Drafting LinkedIn and Twitter content"}\n\n',
                'event: progress\ndata: {"stage":"compliance","message":"Applying deterministic compliance checks"}\n\n',
                'event: progress\ndata: {"stage":"visual","message":"Preparing final visual prompt package"}\n\n',
                'event: result\ndata: {"linkedin_post":"Enterprise teams can scale AI safely with policy-first execution.","twitter_post":"Policy-first AI delivery improves reliability and trust. #AI #Enterprise","image_prompt":"Modern enterprise command center with ethical AI visuals","compliance_status":"APPROVED","compliance_notes":"Compliant"}\n\n',
                'event: done\ndata: {}\n\n',
            ].join("");

            await route.fulfill({
                status: 200,
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                },
                body: sse,
            });
            return;
        }

        if (url.pathname === "/api/generations" && method === "POST") {
            const payload = request.postDataJSON() as {
                topic: string;
                audience: string;
                linkedin_post?: string;
                twitter_post?: string;
                image_prompt?: string;
                compliance_status?: "APPROVED" | "REJECTED";
                compliance_notes?: string;
                status?: string;
                duration_ms?: number;
            };

            runState.generation = {
                id: "gen-smoke-1",
                topic: payload.topic,
                audience: payload.audience,
                linkedin_post: payload.linkedin_post ?? "",
                twitter_post: payload.twitter_post ?? "",
                image_prompt: payload.image_prompt ?? "",
                compliance_status: payload.compliance_status ?? "APPROVED",
                compliance_notes: payload.compliance_notes ?? "Compliant",
                status: payload.status ?? "APPROVED",
                duration_ms: payload.duration_ms ?? 1200,
                created_at: new Date().toISOString(),
                completed_at: null,
            };

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(runState.generation),
            });
            return;
        }

        if (url.pathname === "/api/generations/metrics" && method === "GET") {
            const hasRecord = runState.generation !== null;
            const isRejected = hasRecord && runState.generation?.compliance_status === "REJECTED";
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    total_runs: hasRecord ? 1 : 0,
                    approved_runs: hasRecord && !isRejected ? 1 : 0,
                    rejected_runs: isRejected ? 1 : 0,
                    pass_rate: hasRecord && !isRejected ? 100.0 : 0.0,
                    rejection_rate: isRejected ? 100.0 : 0.0,
                    median_duration_ms: hasRecord ? runState.generation?.duration_ms ?? 0 : null,
                }),
            });
            return;
        }

        if (url.pathname === "/api/generations" && method === "GET") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    items: runState.generation ? [runState.generation] : [],
                    total: runState.generation ? 1 : 0,
                }),
            });
            return;
        }

        if (url.pathname === "/api/generations/gen-smoke-1" && method === "GET") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(runState.generation),
            });
            return;
        }

        if (url.pathname === "/api/generations/gen-smoke-1/publish" && method === "POST") {
            if (runState.generation) {
                runState.generation.status = "PUBLISHED";
            }
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(runState.generation),
            });
            return;
        }

        await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ detail: `Unhandled API call: ${method} ${url.pathname}` }),
        });
    });

    await page.goto("/login");

    await page.getByRole("button", { name: /Need an account/ }).click();
    await expect(page.getByRole("button", { name: /Create account/ })).toBeVisible();
    await page.getByLabel("Email").fill("smoke@example.com");
    await page.getByLabel("Password", { exact: true }).fill("StrongPass123!");
    await page.getByLabel("Confirm Password").fill("StrongPass123!");
    await page.getByRole("button", { name: "Create account" }).click({ force: true });

    await expect(page).toHaveURL(/\/app$/);

    await page.getByLabel("Topic or narrative").fill("Launch a policy-first AI content workflow");
    await page.getByRole("button", { name: "Professionals" }).click();

    await page.getByRole("combobox").nth(0).click();
    await page.getByRole("option", { name: "Thought Leadership" }).click();

    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Professional" }).click();

    await page.getByRole("button", { name: "Generate Content Package" }).click();

    await expect(page).toHaveURL(/\/app\/approval\?id=gen-smoke-1/);
    await expect(page.getByRole("button", { name: "Post to LinkedIn" })).toBeVisible();

    await page.getByRole("link", { name: "Previous" }).click();
    await expect(page).toHaveURL(/\/app\/history/);

    await expect(page.getByText("Launch a policy-first AI content workflow")).toBeVisible();
    await expect(page.getByText("100.0%", { exact: true })).toBeVisible();
});
