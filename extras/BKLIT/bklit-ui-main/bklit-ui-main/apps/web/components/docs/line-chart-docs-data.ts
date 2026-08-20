/** Shared demo data for line-chart docs (kept out of MDX to reduce dev compile weight). */
export const lineChartDocsData = [
  {
    date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    users: 1200,
    pageviews: 4500,
  },
  {
    date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    users: 1350,
    pageviews: 4800,
  },
  {
    date: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
    users: 1100,
    pageviews: 4200,
  },
  {
    date: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
    users: 1450,
    pageviews: 5100,
  },
  {
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    users: 1380,
    pageviews: 4900,
  },
  {
    date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
    users: 1520,
    pageviews: 5400,
  },
  {
    date: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
    users: 1600,
    pageviews: 5800,
  },
  {
    date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
    users: 1480,
    pageviews: 5200,
  },
  {
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    users: 1550,
    pageviews: 5500,
  },
  {
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    users: 1420,
    pageviews: 5000,
  },
  {
    date: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
    users: 1680,
    pageviews: 6100,
  },
  {
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    users: 1750,
    pageviews: 6400,
  },
  {
    date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    users: 1620,
    pageviews: 5900,
  },
  {
    date: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
    users: 1580,
    pageviews: 5700,
  },
  {
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    users: 1720,
    pageviews: 6200,
  },
  {
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    users: 1850,
    pageviews: 6800,
  },
  {
    date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    users: 1780,
    pageviews: 6500,
  },
  {
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    users: 1650,
    pageviews: 6000,
  },
  {
    date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    users: 1920,
    pageviews: 7100,
  },
  {
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    users: 1880,
    pageviews: 6900,
  },
  {
    date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    users: 1750,
    pageviews: 6400,
  },
  {
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    users: 1980,
    pageviews: 7300,
  },
  {
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    users: 2050,
    pageviews: 7600,
  },
  {
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    users: 1920,
    pageviews: 7100,
  },
  {
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    users: 2100,
    pageviews: 7800,
  },
  {
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    users: 2180,
    pageviews: 8100,
  },
  {
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    users: 2050,
    pageviews: 7600,
  },
  {
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    users: 2250,
    pageviews: 8400,
  },
  {
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    users: 2320,
    pageviews: 8700,
  },
  { date: new Date(), users: 2400, pageviews: 9000 },
];

export const lineChartDocsMarkers = [
  {
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    icon: "🚀",
    title: "v1.2.0 Released",
    description: "New chart animations",
    href: "https://github.com/bklit/bklit-ui/releases",
    target: "_blank",
  },
  {
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    icon: "🐛",
    title: "Bug Fix",
    description: "Fixed tooltip positioning",
    href: "https://github.com/bklit/bklit-ui/issues",
    target: "_blank",
  },
  {
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    icon: "📦",
    title: "Dependency Update",
    description: "Updated motion to v12",
    href: "https://motion.dev",
    target: "_blank",
  },
  {
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    icon: "⚡",
    title: "Performance",
    description: "50% faster renders",
    href: "#performance",
    target: "_self",
  },
  {
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    icon: "✨",
    title: "Feature Launch",
    description: "Added grid support",
    href: "#grid",
    target: "_self",
  },
  {
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    icon: "🎨",
    title: "Design Update",
    description: "New color system",
    href: "#theming",
    target: "_self",
  },
  {
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    icon: "📝",
    title: "Docs Updated",
    description: "Added examples",
    href: "#usage",
    target: "_self",
  },
];
