import { expect, test } from "@playwright/test";

test("auth resilience: transient /me failure does not clear token after signup", async ({ page }) => {
    let meCalls = 0;
    const runState = {
        token: "resilience-token",
        userEmail: "resilience@example.com",
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
                    user_id: "user-resilience",
                    email: runState.userEmail,
                }),
            });
            return;
        }

        if (url.pathname === "/api/auth/me" && method === "GET") {
            meCalls += 1;
            if (meCalls === 1) {
                await route.fulfill({
                    status: 500,
                    contentType: "application/json",
                    body: JSON.stringify({ detail: "Temporary backend issue" }),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ id: "user-resilience", email: runState.userEmail, is_active: true }),
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
                    has_api_key: false,
                }),
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
    await page.getByLabel("Email").fill("resilience@example.com");
    await page.getByLabel("Password", { exact: true }).fill("StrongPass123!");
    await page.getByLabel("Confirm Password").fill("StrongPass123!");
    await page.getByRole("button", { name: "Create account" }).click({ force: true });

    await expect(page).toHaveURL(/\/app$/);

    const storedToken = await page.evaluate(() => window.localStorage.getItem("contentai_access_token"));
    expect(storedToken).toBe(runState.token);
});
