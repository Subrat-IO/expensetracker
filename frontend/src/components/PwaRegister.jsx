"use client";

import { useEffect, useState } from "react";

export default function PwaRegister() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(display-mode: standalone)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => null);
    }

    function handleModeChange(event) {
      setIsStandalone(event.matches);
    }

    function handlePrompt(event) {
      event.preventDefault();
      setPromptEvent(event);
    }

    mediaQuery.addEventListener("change", handleModeChange);
    window.addEventListener("beforeinstallprompt", handlePrompt);

    return () => {
      mediaQuery.removeEventListener("change", handleModeChange);
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  }, []);

  async function handleInstall() {
    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();
    setPromptEvent(null);
  }

  if (!promptEvent || isStandalone) {
    return null;
  }

  return (
    <button type="button" className="install-chip" onClick={handleInstall}>
      Install App
    </button>
  );
}
