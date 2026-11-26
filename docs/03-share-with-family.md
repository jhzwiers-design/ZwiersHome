# Sharing the Zwiers Home prototype with family

> **Current status (25 Nov 2026): PUBLIC demo at https://home.johnzwiers.com**, with no login, at your request.
> Public builds automatically replace personal details: bedroom names, the real floor plan and equipment model numbers (`__PUBLIC__` in `vite.config.ts`, verified by scanning the built files).
> The email-code lock pieces still exist in Cloudflare (the **Family** policy and the **One-time PIN** login method), so re-locking means creating a new Access application for the Worker with the Family policy. The email code never arrived during setup; that needs investigating before relying on the lock.

## Original plan: password-protected, free

_25 Nov 2026. A guide. Nothing here has been set up yet: each step happens in your own accounts._

## Why not just a password screen inside the page?
A password box drawn by the dashboard only **hides** the page. The files behind it (including the floor plan and room names) would still download to anyone with the address. Real protection means the **hosting service checks who you are before sending any file**. That's what this guide sets up.

## What you get
- A private address like `https://zwiers-home.pages.dev`.
- Before anything loads, Cloudflare asks for an **email address** and sends a **one-time code**. Only emails you list (your dad, family) get in.
- It updates itself every time you push to GitHub.
- **Cost: $0**, with no subscription. Cloudflare Pages is free, and Cloudflare Zero Trust has a free plan (up to 50 users when this was written; check when you sign up).

> This is for the **prototype** (sample data only). The real dashboard that controls the house should stay on your home network and Tailscale (see the go-live plan). Don't put real controls on the internet.

## Steps (about 15 minutes, all in your browser)

### 1. Create the site (Cloudflare Pages)
1. Make a free account at **dash.cloudflare.com**.
2. Go to **Workers & Pages → Create → Pages → Connect to Git**, and allow access to **jhzwiers-design/ZwiersHome** only.
3. Use these build settings:
   | Setting | Value |
   |---|---|
   | Production branch | `main` |
   | Root directory | `dashboard` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
4. Choose a project name, for example `zwiers-home`. **Don't open the link or share it yet.** Do step 2 first.

### 2. Lock it (Cloudflare Zero Trust Access)
1. In Cloudflare, open **Zero Trust**, pick the **Free** plan, and choose a team name.
2. Go to **Access → Applications → Add an application → Self-hosted**.
3. Application domain: `zwiers-home.pages.dev`. **Add a second domain** `*.zwiers-home.pages.dev`, so the preview copies Cloudflare makes for each update are locked too.
4. Add a policy: Action **Allow**, Include **Emails**, then list your dad's email, your own, and anyone else's.
5. Login method: **One-time PIN** (no passwords to manage).
6. Save. Then open `https://zwiers-home.pages.dev` in a private browser window: you should see the Cloudflare sign-in page, not the dashboard.

### 2b. Use your own address: `home.johnzwiers.com`
`johnzwiers.com` is already registered and managed at Cloudflare (checked 25 Nov 2026). The portfolio is served by GitHub Pages through the root and `www` records. **Leave those records alone.**
1. In the Pages project, go to **Custom domains → Set up a custom domain** and enter `home.johnzwiers.com`. Cloudflare adds the DNS record for you.
2. In **Zero Trust → Access → Applications**, open the Zwiers Home application and **add `home.johnzwiers.com`** as another domain (keep the `pages.dev` ones too).
3. In a private window, open `https://home.johnzwiers.com`. You should get the email-code sign-in, then the dashboard. Also check that `johnzwiers.com` (the portfolio) still opens normally.

### 3. Send your dad the link
Send him `https://home.johnzwiers.com` (or the `pages.dev` address). He enters his email, gets a 6-digit code, and he's in. On his iPhone he can then **Share → Add to Home Screen** for the Gable icon.

### Removing someone
Edit the Access policy and delete their email. To revoke an active session immediately, use **Zero Trust → My Team → Users → Revoke**.

## If he still sees a white page
The dashboard now explains itself instead of staying white. If he sees **"This browser is too old"**, his device needs iOS/iPadOS 16.4 or newer (Settings → General → Software Update).
