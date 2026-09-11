/**
 * 21st.dev page : https://21st.dev/@ayushmxxn/components/tubelight-navbar  (library: https://21st.dev/@ayushmxxn/library/serenity-ui)
 * Author        : Ayushmaan Singh (@ayushmxxn) - Serenity UI
 * License       : MIT (stated on the 21st.dev page; LICENSE in upstream repo, (c) 2026 Ayushmaan Singh)
 * 21st.dev deps : lucide-react, framer-motion   (published 1/5/2025)
 * !! API MISMATCH: the 21st.dev version exports  NavBar({ items })  with lucide icons (see demo at bottom).
 *    That verbatim 21st.dev source was NOT capturable (not rendered on the page; /r/ endpoint disallowed).
 *    The code below is the CURRENT UPSTREAM version from github.com/ayushmxxn/serenity-ui @ 6ca2043, 2026-09-08
 *    (app/components/serenity/tubelight-navbar.tsx): no props, hard-coded tabs, react-icons + next/link.
 *    Porting notes: swap next/link -> Inertia <Link>, react-icons -> lucide-react, framer-motion -> motion/react,
 *    lift 'tabs' into an items prop.
 * Upstream deps : react, framer-motion, next/link, react-icons/lu
 */

// ============================================================
// FILE: ayushmxxn_serenity-ui/app/components/serenity/tubelight-navbar.tsx  (verbatim, unmodified)
// ============================================================
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { LuBriefcase, LuFileText, LuHouse, LuUser } from "react-icons/lu";

export function TubeLightNavbar() {
  const [activeTab, setActiveTab] = useState("Home");

  const tabs = [
    { name: "Home", url: "#", icon: <LuHouse /> },
    { name: "About", url: "#", icon: <LuUser /> },
    { name: "Projects", url: "#", icon: <LuBriefcase /> },
    { name: "Resume", url: "#", icon: <LuFileText /> },
  ];

  return (
    <div className="z-50 py-6 sm:py-10 flex justify-center select-none">
      <div
        className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 py-1 px-1.5 rounded-full"
        style={{
          boxShadow: "0 1px 1px rgba(0,0,0,0.025), 0 2px 6px rgba(0,0,0,0.035)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;

          return (
            <Link
              key={tab.name}
              href={tab.url}
              onClick={() => setActiveTab(tab.name)}
              className={`relative cursor-pointer text-xs sm:text-sm px-4 sm:px-6 py-2 rounded-full transition-colors duration-200 ${
                isActive
                  ? "text-[var(--text-primary)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="liquid-pill"
                  className="absolute inset-0 bg-black/[0.08] dark:bg-white/[0.18] rounded-full"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 28,
                    mass: 0.9,
                  }}
                />
              )}

              <span className="relative z-10 hidden md:inline">{tab.name}</span>
              <span className="relative z-10 md:hidden text-base">
                {tab.icon}
              </span>

              {isActive && (
                <motion.div
                  layoutId="tubelight-lamp"
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-neutral-900 dark:bg-white rounded-t-md pointer-events-none"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-6 h-6 bg-neutral-900 dark:bg-white rounded-full pointer-events-none"
                    style={{ filter: "blur(6px)", opacity: 0.15 }}
                  />
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -top-2.5 w-10 h-8 bg-neutral-900 dark:bg-white rounded-full pointer-events-none"
                    style={{ filter: "blur(10px)", opacity: 0.07 }}
                  />
                </motion.div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default TubeLightNavbar;

// ============================================================
// DEMO USAGE - verbatim as shown on the 21st.dev page (captured via WebFetch, 2026-09-10)
// ============================================================
// import { Home, User, Briefcase, FileText } from 'lucide-react'
// import { NavBar } from "@/components/ui/tubelight-navbar"
// 
// export function NavBarDemo() {
//   const navItems = [
//     { name: 'Home', url: '#', icon: Home },
//     { name: 'About', url: '#', icon: User },
//     { name: 'Projects', url: '#', icon: Briefcase },
//     { name: 'Resume', url: '#', icon: FileText }
//   ]
// 
//   return <NavBar items={navItems} />
// }
