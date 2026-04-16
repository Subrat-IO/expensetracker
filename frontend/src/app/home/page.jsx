"use client";

import dynamic from "next/dynamic";

const HomeDashboard = dynamic(() => import("../../components/HomeDashboard"), {
  ssr: false,
});

export default function HomePage() {
  return <HomeDashboard />;
}
