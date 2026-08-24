import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const page = read("app/page.tsx");
const landingRail = read("components/marketing/landing-rail.tsx");
const settings = read("app/dashboard/settings/page.tsx");
const copy = read("components/copy-button.tsx");
const onboarding = read("components/onboarding/first-run-onboarding.tsx");
const theme = read("components/animated-theme-toggler.tsx");

for (const token of ["LandingRail", "MarketingShell"]) {
  if (!page.includes(token)) throw new Error(`Landing integration missing: ${token}`);
}
if (!landingRail.includes("PublicStats")) {
  throw new Error("Landing component integration missing: PublicStats");
}
for (const token of ["updatePreferences", "Replay product walkthrough", "DELETE MY ACCOUNT"]) {
  if (!settings.includes(token)) throw new Error(`Settings integration missing: ${token}`);
}
for (const token of ["navigator.clipboard", "Unable to copy", "aria-live"]) {
  if (!copy.includes(token)) throw new Error(`Copy contract missing: ${token}`);
}
for (const token of ["onboardingCompletedAt", "primaryWorkflow", "Open dashboard"]) {
  if (!onboarding.includes(token)) throw new Error(`Onboarding contract missing: ${token}`);
}
for (const token of ["startViewTransition", "prefers-reduced-motion", "aria-label"]) {
  if (!theme.includes(token)) throw new Error(`Theme contract missing: ${token}`);
}

console.log("docs product component smoke: ok");
