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
    let reloadTriggered = false;
    let updateTimerId;

    function activateWaitingWorker(registration) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    }

    function handleControllerChange() {
      if (reloadTriggered) {
        return;
      }

      reloadTriggered = true;
      window.location.reload();
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => {
          activateWaitingWorker(registration);

          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;

            if (!installingWorker) {
              return;
            }

            installingWorker.addEventListener("statechange", () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                activateWaitingWorker(registration);
              }
            });
          });

          updateTimerId = window.setInterval(() => {
            registration.update().catch(() => null);
          }, 60 * 1000);
        })
        .catch(() => null);

      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    }

    function handleModeChange(event) {
      setIsStandalone(event.matches);
    }

    function handlePrompt(event) {
      event.preventDefault();
      setPromptEvent(event);
    }

    function handleInstalled() {
      setIsStandalone(true);
      setPromptEvent(null);
    }

    mediaQuery.addEventListener("change", handleModeChange);
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      if (updateTimerId) {
        window.clearInterval(updateTimerId);
      }

      mediaQuery.removeEventListener("change", handleModeChange);
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
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
