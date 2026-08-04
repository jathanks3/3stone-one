"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { Button } from "@/ui/Button";
import { useToast } from "@/lib/toast";

type PickerDocument = { id?: string };
type PickerData = { action?: string; docs?: PickerDocument[] };

interface GooglePickerBuilder {
  addView(view: unknown): GooglePickerBuilder;
  setOAuthToken(token: string): GooglePickerBuilder;
  setDeveloperKey(key: string): GooglePickerBuilder;
  setAppId(appId: string): GooglePickerBuilder;
  setOrigin(origin: string): GooglePickerBuilder;
  setCallback(callback: (data: PickerData) => void): GooglePickerBuilder;
  enableFeature(feature: unknown): GooglePickerBuilder;
  build(): { setVisible(visible: boolean): void };
}

interface GoogleBrowserApi {
  picker: {
    DocsView: new () => { setIncludeFolders(value: boolean): unknown };
    PickerBuilder: new () => GooglePickerBuilder;
    Feature: { MULTISELECT_ENABLED: unknown };
  };
}

declare global {
  interface Window {
    google?: GoogleBrowserApi;
    gapi?: { load(name: string, options: { callback: () => void; onerror: () => void }): void };
  }
}

let scriptsPromise: Promise<void> | null = null;
function loadGooglePickerScripts(): Promise<void> {
  if (window.gapi) return Promise.resolve();
  if (scriptsPromise) return scriptsPromise;
  scriptsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google's file picker couldn't load."));
    document.head.appendChild(script);
  });
  return scriptsPromise;
}

function loadPickerLibrary(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.gapi) return reject(new Error("Google Picker isn't available."));
    window.gapi.load("picker", { callback: resolve, onerror: () => reject(new Error("Google Picker couldn't start.")) });
  });
}

export function GoogleDrivePickerButton({ apiKey, appId }: { clientId: string; apiKey: string; appId: string }) {
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    loadGooglePickerScripts()
      .then(loadPickerLibrary)
      .then(() => { if (active) setReady(true); })
      .catch((error) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Google Picker couldn't load.");
      });
    return () => { active = false; };
  }, []);

  async function chooseFiles() {
    setPending(true);
    try {
      if (loadError) throw new Error(loadError);
      if (!ready) throw new Error("Google Picker is still loading. Try again in a moment.");
      const google = window.google;
      if (!google) throw new Error("Google Picker isn't available.");
      const tokenResponse = await fetch("/api/integrations/google/picker-token");
      const tokenResult = await tokenResponse.json().catch(() => ({})) as { accessToken?: string; error?: string };
      if (!tokenResponse.ok || !tokenResult.accessToken) {
        throw new Error(tokenResult.error ?? "Reconnect Google in Integrations, then try again.");
      }
      const view = new google.picker.DocsView();
      view.setIncludeFolders(false);
      const picker = new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(tokenResult.accessToken)
        .setDeveloperKey(apiKey)
        .setAppId(appId)
        .setOrigin(window.location.origin)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setCallback(async (data) => {
          if (data.action !== "picked") return;
          const fileIds = (data.docs ?? []).map((doc) => doc.id).filter((id): id is string => Boolean(id));
          if (!fileIds.length) return;
          const response = await fetch("/api/integrations/google/selected-files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileIds }),
          });
          const result = await response.json().catch(() => ({})) as { error?: string };
          if (!response.ok) return showToast({ title: "Couldn't add Drive files", description: result.error });
          showToast({ title: "Google Drive files added", description: `${fileIds.length} selected file${fileIds.length === 1 ? " is" : "s are"} now available in Documents and to 3Stone AI.` });
          router.refresh();
        })
        .build();
      picker.setVisible(true);
    } catch (error) {
      showToast({ title: "Couldn't open Google Drive", description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setPending(false);
    }
  }

  return <Button type="button" variant="secondary" onClick={chooseFiles} disabled={pending || !ready || Boolean(loadError)} title={loadError ?? undefined}><FolderOpen size={14} />{loadError ? "Picker unavailable" : pending ? "Opening…" : ready ? "Choose Drive files" : "Loading Google Picker…"}</Button>;
}
