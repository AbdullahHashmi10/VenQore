# 21st.dev component harvest: VenQore marketing redesign

Collected 2026-09-10.

**Where the code came from.** 21st.dev component pages only show the *demo usage* snippet. The component source loads client-side, and the `/r/` registry is robots-disallowed. So every component file here was copied **byte-for-byte from the author's own public GitHub repo**, which the 21st.dev page links to or which is the author's published library. Each file's header gives the repo and commit.

- Demo snippets marked "21st demo" were copied verbatim from the 21st.dev page with WebFetch.
- No code was written or paraphrased by hand.
- The 21st.dev-published revision may differ slightly from upstream. One known big difference is the Tubelight navbar, noted below.

**Verbatim column.** "Upstream verbatim" means the exact upstream file. "21st demo" means the demo usage was captured verbatim from 21st.dev. "No" means only a URL and description are recorded.

| Category | Component | 21st.dev URL | Author | License | Deps | Verbatim code captured | File |
|---|---|---|---|---|---|---|---|
| 1. AI chat input | AI Input With Search | https://21st.dev/@kokonutd/components/ai-input-with-search | Kokonut UI (@kokonutd) | MIT | lucide-react, motion, shadcn Textarea, cn; hook `use-auto-resize-textarea` (included) | Upstream verbatim (kokonutui@83eec6d) | `ai-chat/kokonutd-ai-input-with-search.tsx` |
| 1. AI chat input | AI Prompt ("AI Input Selector": model dropdown + attach) | Not verified on 21st.dev under this name (maybe `@kokonutd/components/animated-ai-input` or `ai-input`) | Kokonut UI | MIT | lucide-react, motion, shadcn Button/DropdownMenu/Textarea, auto-resize hook, Anthropic icon components (not included) | Upstream verbatim | `ai-chat/kokonutd-ai-prompt.tsx` |
| 2. Cookie consent | Banner (default demo = BannerCookie) | https://21st.dev/@serafimcloud/components/banner | Serafim (@serafimcloud) | MIT | class-variance-authority, lucide-react, shadcn Button | Verbatim from github.com/serafimcloud/21st (21st.dev's own repo) + 21st demo | `cookie/serafimcloud-banner.tsx` |
| 2. Cookie consent | Cookie Consent (preferences with categories) | https://21st.dev/community/components/bankkroll/cookie-consent | Bankk (@bankkroll) | Not stated | next, lucide-react, framer-motion | 21st demo only; **no source** | `cookie/NOTES.md` |
| 2. Cookie consent | Cookie Banner (x2) / PrebuiltUI Cookies | @arunachalam/cookie-banner(-1), @prebuiltui/cookies | Arunachalam / PrebuiltUI | Not stated / proprietary | none listed | No | `cookie/NOTES.md` |
| 3. Navbar | Header 1 (sticky, blur on scroll, animated mobile menu) | https://21st.dev/@efferd/components/header-1 | Efferd UI (@efferd) | MIT (upstream) | react-dom, shadcn Button, cn; logo, menu-toggle-icon and use-scroll included | Upstream verbatim (efferd-ui@d0748f4) + 21st demo | `navbar/efferd-header-1.tsx` |
| 3. Navbar | Header 3 (sticky blur + mega menu) | Not verified on 21st.dev (upstream ui.efferd.com/header#header-3) | Efferd UI | MIT | lucide-react, shadcn NavigationMenu (radix), Button | Upstream verbatim | `navbar/efferd-header-3-mega-menu.tsx` |
| 3. Navbar | Tubelight Navbar | https://21st.dev/@ayushmxxn/components/tubelight-navbar | Ayushmaan Singh (@ayushmxxn) | MIT | 21st: lucide-react, framer-motion. Upstream: framer-motion, next/link, react-icons | **21st demo only.** The 21st source (the `NavBar({items})` API) was not capturable. The file holds the current upstream serenity-ui version, which has a different, prop-less API | `navbar/ayushmxxn-tubelight-navbar.tsx` |
| 4. Footer | Footer Section (Efferd footer-2, animated multi-column) | https://21st.dev/@efferd/components/footer-section | Efferd UI (@efferd) | MIT (upstream) | motion, lucide-react | Upstream verbatim + 21st demo | `footer/efferd-footer-section.tsx` |
| 4. Footer | Footer 7 | https://21st.dev/@shadcnblockscom/components/footer-7 | Shadcnblocks.com | Not stated (free repo is MIT + Commons Clause) | react-icons | No (not in the free repo) | n/a |
| 5. Thinking / typing | AI Text Loading (cycling "Thinking…" shimmer) | https://21st.dev/@kokonutd/components/ai-text-loading | Kokonut UI | MIT | motion, cn | Upstream verbatim | `thinking/kokonutd-ai-text-loading.tsx` |
| 5. Thinking / typing | Shimmer Text | Not listed on 21st.dev (upstream kokonutui only) | Kokonut UI | MIT | motion, cn | Upstream verbatim | `thinking/kokonutd-shimmer-text.tsx` |
| 5. Chat messages | Chat Bubble + MessageLoading (3-dot typing SVG) | https://21st.dev/@jakobhoeg/components/chat-bubble | Jakob Hoeg Mørk (@jakobhoeg) | MIT (upstream) | lucide-react (21st); cva, shadcn Avatar/Button | Upstream verbatim (shadcn-chat@47e5f8a) + 21st demo | `thinking/jakobhoeg-chat-bubble.tsx` |
| 6. Hero / pricing | (skipped: out of budget) | Candidates: @kokonutd/pricing-section, @efferd/pricing-4, @efferd/hero-1 | | | | No | n/a |

## Porting notes for Laravel + Inertia + React 18 (JSX)
- All files are TSX. Strip the types for JSX.
- Replace `next/link` with `@inertiajs/react` `Link`, and drop `"use client"`.
- `framer-motion` imports can become `motion/react` (same API).
- Shared shadcn primitives are needed: `@/components/ui/{button,textarea,avatar,dropdown-menu,navigation-menu}` and `cn` (clsx + tailwind-merge).
- Colours use shadcn tokens (`bg-background`, `text-muted-foreground`, `border-border`). Map them to the V6 `--vq-*` tokens per DESIGN-RULES. `rounded-lg`/`rounded-md` in these files will also go through the known radius defect.

## Budget used
About 22 WebFetch/WebSearch calls. Upstream code came from `git clone` of public GitHub repos (github.com and raw.githubusercontent.com are reachable; 21st.dev and cdn.21st.dev are blocked for curl).
