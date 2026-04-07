import "./globals.css";

export const metadata = {
  title: "Discipline Tracker",
  description: "Premium PWA for budget and gym discipline tracking",
  applicationName: "Discipline Tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Discipline Tracker",
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/apple-touch-icon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f7fbf4",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>{children}</body>
    </html>
  );
}
