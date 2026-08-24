"use client";

import { useMemo, useState } from "react";
import { Pencil, Check, X } from "lucide-react";

import { ProfileSection } from "@/components/profile/ProfileSection";
import {
  ReadField,
  TextField,
  ghostPillClass,
  solidPillClass,
} from "@/components/profile/fields";
import { DobPicker } from "@/components/onboarding/DobPicker";
import { useOnboarding } from "@/context/OnboardingContext";
import { useProfile } from "@/context/ProfileContext";
import { computeAge, validateDob } from "@/lib/onboarding/date";
import { DEFAULT_DOB, MIN_AGE, MONTHS } from "@/constants/onboarding";
import type { DobValue } from "@/types/onboarding";

function formatDob(dob: DobValue): string {
  const month = MONTHS[dob.month - 1] ?? "";
  return `${dob.day} ${month} ${dob.year}`.trim();
}

function sameDob(a: DobValue, b: DobValue): boolean {
  return a.day === b.day && a.month === b.month && a.year === b.year;
}

/**
 * Personal details — display name, date of birth, pronouns, and location.
 *
 * Name + DOB are the SAME record captured during onboarding, edited here in
 * place via the onboarding context (single source of truth — never duplicated).
 * Pronouns + location are new profile fields persisted via the profile context.
 * The DOB uses the exact same three-wheel picker as onboarding.
 */
export function PersonalDetailsCard() {
  const { data: onboarding, setProfile, setDob } = useOnboarding();
  const { data: profile, updatePersonal } = useProfile();

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftPronouns, setDraftPronouns] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftDob, setDraftDob] = useState<DobValue>(DEFAULT_DOB);

  const hadDob = onboarding.dob !== null;
  const seedDob = onboarding.dob ?? DEFAULT_DOB;

  const dobValidation = useMemo(() => validateDob(draftDob), [draftDob]);
  const dobChanged = !sameDob(draftDob, seedDob);
  // The DOB is "engaged" once the user has one already or has moved the wheels.
  const dobEngaged = hadDob || dobChanged;
  const saveDisabled = dobEngaged && !dobValidation.valid;

  let dobHelper: string;
  if (dobEngaged && dobValidation.reason === "future") {
    dobHelper = "That date is in the future — pick your date of birth.";
  } else if (dobEngaged && dobValidation.reason === "too-young") {
    dobHelper = `You need to be at least ${MIN_AGE}.`;
  } else if (dobEngaged && dobValidation.reason === "too-old") {
    dobHelper = "Please double-check the year.";
  } else if (dobEngaged && dobValidation.valid && dobValidation.age !== null) {
    dobHelper = `You're ${dobValidation.age} — this tailors your analysis.`;
  } else {
    dobHelper = "Optional — set your date of birth to tailor your analysis.";
  }

  const startEdit = () => {
    setDraftName(onboarding.profile?.displayName ?? "");
    setDraftPronouns(profile.personal.pronouns);
    setDraftLocation(profile.personal.location);
    setDraftDob(seedDob);
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = () => {
    if (saveDisabled) return;
    const name = draftName.trim();
    setProfile(name ? { displayName: name } : null);
    updatePersonal({
      pronouns: draftPronouns.trim(),
      location: draftLocation.trim(),
    });
    // Only persist a DOB the user actually engaged with, and only if valid.
    if (dobEngaged && dobValidation.valid) {
      setDob(draftDob);
    }
    setEditing(false);
  };

  const displayName = onboarding.profile?.displayName?.trim() ?? "";
  const dobLabel = onboarding.dob
    ? `${formatDob(onboarding.dob)} · ${computeAge(onboarding.dob)} yrs`
    : "";

  const action = editing ? (
    <>
      <button type="button" onClick={cancel} className={ghostPillClass}>
        <X className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        Cancel
      </button>
      <button
        type="button"
        onClick={save}
        disabled={saveDisabled}
        className={solidPillClass}
      >
        <Check className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        Save
      </button>
    </>
  ) : (
    <button type="button" onClick={startEdit} className={ghostPillClass}>
      <Pencil className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
      Edit
    </button>
  );

  return (
    <ProfileSection
      eyebrow="Personal details"
      title="About you."
      description="The essentials — kept on your device, edited anytime."
      action={action}
    >
      {editing ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="profile-name"
              label="Display name"
              value={draftName}
              onChange={setDraftName}
              placeholder="Your name"
              maxLength={60}
            />
            <TextField
              id="profile-pronouns"
              label="Pronouns"
              value={draftPronouns}
              onChange={setDraftPronouns}
              placeholder="e.g. she/her"
              maxLength={30}
            />
            <TextField
              id="profile-location"
              label="Location"
              value={draftLocation}
              onChange={setDraftLocation}
              placeholder="e.g. London, UK"
              maxLength={80}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[0.6875rem] font-medium uppercase tracking-widest2 text-ink-faint">
              Date of birth
            </span>
            <DobPicker value={draftDob} onChange={setDraftDob} />
            <p
              className={`text-sm ${
                saveDisabled ? "text-accent" : "text-ink-muted"
              }`}
              role="status"
              aria-live="polite"
            >
              {dobHelper}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <ReadField label="Display name" value={displayName} />
          <ReadField label="Date of birth" value={dobLabel} />
          <ReadField label="Pronouns" value={profile.personal.pronouns} />
          <ReadField label="Location" value={profile.personal.location} />
        </div>
      )}
    </ProfileSection>
  );
}
