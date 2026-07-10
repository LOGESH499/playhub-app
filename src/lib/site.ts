export const siteConfig = {
  name: "PLAYHUB",
  title: "PLAYHUB — Sports Slot Booking & Academy Management",
  description:
    "Real-time multi-sports slot booking and academy management platform for venues, coaches, and players.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ogImage: "/opengraph-image",
  keywords: [
    "sports booking",
    "court booking",
    "academy management",
    "badminton",
    "cricket",
    "football",
    "tennis",
    "swimming",
    "venue management",
  ],
} as const;
