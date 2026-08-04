"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { Button } from "@/ui/Button";
import { useToast } from "@/lib/toast";

type PickerDocument = { id?: string };
type PickerData = { action?: string; docs?: PickerDocument[] };
type TokenResponse = { access_token?: string; error?: string };

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
  accounts: { oauth2: { initTokenClient(config: { client_id: string; scope: string; callback: (response: TokenResponse) => void }): { requestAccessToken(options?: { prompt?: string }): void } } };
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
  if (window.google?.accounts && window.gapi) return Promise.resolve();
  if (scriptsPromise) return scriptsPromise;
  scriptsPromise = new Promise((resolve, reject) => {
    let loaded = 0;
    const done = () => { loaded += 1; if (loaded === 2) resolve(); };
    const add = (src: string) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = done;
      script.onerror = () => reject(new Error("Google's file picker couldn't load."));
      document.head.appendChild(script);
    };
    add("https://accounts.google.com/gsi/client");
    add("https://apis.google.com/js/api.js");
  });
  return scriptsPromise;
}

function loadPickerLibrary(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.gapi) return reject(new Error("Google Picker isn't available."));
    window.gapi.load("picker", { callback: resolve, onerror: () => reject(new Error("Google Picker couldn't start.")) });
  });
}

export function GoogleDrivePickerButton({ clientId, apiKey, appId }: { clientId: string; apiKey: string; appId: string }) {
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
      const token = await new Promise<string>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("Google authorization didn't open. Check that pop-ups are allowed, then try again.")), 15_000);
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive.file",
          callback: (response) => {
            window.clearTimeout(timeout);
            if (response.access_token) resolve(response.access_token);
            else reject(new Error(response.error ?? "Google authorization was cancelled."));
          },
        });
        client.requestAccessToken({ prompt: "" });
      });
      const view = new google.picker.DocsView();
      view.setIncludeFolders(false);
      const picker = new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
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
