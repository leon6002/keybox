import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: process.env.SUCCESS_URL,
  server: "sandbox", // Use sandbox for testing - change to 'production' for live
  theme: "dark", // Enforces dark theme to match KeyBox design
});
