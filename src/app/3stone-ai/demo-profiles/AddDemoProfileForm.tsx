"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addDemoProfileAction, type AddDemoProfileFormState } from "./actions";

const initialState: AddDemoProfileFormState = {};

export function AddDemoProfileForm() {
  const [state, formAction, pending] = useActionState(addDemoProfileAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [editionKey, setEditionKey] = useState("workspace");

  useEffect(() => {
    if (!state.error && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2 rounded-[12px] border border-line bg-surface p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="label" className="text-[12px] font-medium text-ink-2">Name (for your dropdown)</label>
        <input
          id="label"
          name="label"
          required
          placeholder="Far Eastside Community Alliance"
          className="h-9 w-64 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="orgName" className="text-[12px] font-medium text-ink-2">Organization name shown in the demo</label>
        <input
          id="orgName"
          name="orgName"
          required
          placeholder="Far Eastside Community Alliance"
          className="h-9 w-64 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="editionKey" className="text-[12px] font-medium text-ink-2">Edition</label>
        <select
          id="editionKey"
          name="editionKey"
          value={editionKey}
          onChange={(e) => setEditionKey(e.target.value)}
          className="h-9 w-36 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent"
        >
          <option value="workspace">Workspace</option>
          <option value="student">Student</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="industryProfileKey" className="text-[12px] font-medium text-ink-2">Wording</label>
        <select
          id="industryProfileKey"
          name="industryProfileKey"
          defaultValue={editionKey === "student" ? "student" : "workplace"}
          disabled={editionKey === "student"}
          className="h-9 w-40 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent disabled:opacity-60"
        >
          {editionKey === "student" ? (
            <option value="student">Student (fixed)</option>
          ) : (
            <>
              <option value="workplace">Business (generic)</option>
              <option value="nonprofit">Nonprofit</option>
            </>
          )}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="accentColor" className="text-[12px] font-medium text-ink-2">Accent color</label>
        <select
          id="accentColor"
          name="accentColor"
          defaultValue=""
          className="h-9 w-32 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent"
        >
          <option value="">Default</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="purple">Purple</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="industryLabel" className="text-[12px] font-medium text-ink-2">Description shown in demo (optional)</label>
        <input
          id="industryLabel"
          name="industryLabel"
          placeholder="Youth mentorship nonprofit"
          className="h-9 w-56 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-[8px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save demo profile"}
      </button>
      {state.error ? <p className="basis-full text-[12.5px] text-critical">{state.error}</p> : null}
    </form>
  );
}
