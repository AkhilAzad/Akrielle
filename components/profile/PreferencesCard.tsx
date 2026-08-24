"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

import { ProfileSection } from "@/components/profile/ProfileSection";
import { ToggleSwitch } from "@/components/profile/ToggleSwitch";
import {
  ChipMultiSelect,
  ReadField,
  SelectField,
  ghostPillClass,
  solidPillClass,
} from "@/components/profile/fields";
import { useProfile } from "@/context/ProfileContext";
import { FOCUS_AREAS, SKIN_CONCERNS, STYLE_VIBES } from "@/constants/profile";

/** Toggle a value in/out of a string array (immutably). */
function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

/**
 * Preferences — both beauty/style and app/privacy.
 *
 * The beauty block (style vibe + focus areas + skin concerns) is edited behind
 * an Edit/Save/Cancel flow, since it's a batch of choices. The app/privacy
 * toggle is applied live, the way switches are conventionally expected to
 * behave. All of it persists locally via the profile context.
 */
export function PreferencesCard() {
  const { data: profile, updateBeauty, updateApp } = useProfile();
  const { beauty, app } = profile;

  const [editing, setEditing] = useState(false);
  const [draftVibe, setDraftVibe] = useState("");
  const [draftFocus, setDraftFocus] = useState<string[]>([]);
  const [draftConcerns, setDraftConcerns] = useState<string[]>([]);

  const startEdit = () => {
    setDraftVibe(beauty.styleVibe);
    setDraftFocus(beauty.focusAreas);
    setDraftConcerns(beauty.skinConcerns);
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = () => {
    updateBeauty({
      styleVibe: draftVibe,
      focusAreas: draftFocus,
      skinConcerns: draftConcerns,
    });
    setEditing(false);
  };

  const action = editing ? (
    <>
      <button type="button" onClick={cancel} className={ghostPillClass}>
        <X className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        Cancel
      </button>
      <button type="button" onClick={save} className={solidPillClass}>
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
      eyebrow="Preferences"
      title="How you like things."
      description="Personalize your beauty focus and manage your privacy."
      action={action}
    >
      {/* Beauty & style. */}
      {editing ? (
        <div className="flex flex-col gap-6">
          <div className="sm:max-w-xs">
            <SelectField
              id="profile-vibe"
              label="Style vibe"
              value={draftVibe}
              onChange={setDraftVibe}
              options={STYLE_VIBES}
            />
          </div>
          <ChipMultiSelect
            label="Focus areas"
            options={FOCUS_AREAS}
            selected={draftFocus}
            onToggle={(o) => setDraftFocus((prev) => toggle(prev, o))}
          />
          <ChipMultiSelect
            label="Skin concerns"
            options={SKIN_CONCERNS}
            selected={draftConcerns}
            onToggle={(o) => setDraftConcerns((prev) => toggle(prev, o))}
          />
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <ReadField label="Style vibe" value={beauty.styleVibe} />
          <ReadField label="Focus areas" value={beauty.focusAreas.join(", ")} />
          <ReadField
            label="Skin concerns"
            value={beauty.skinConcerns.join(", ")}
          />
        </div>
      )}

      {/* App & privacy — applied live. */}
      <div className="my-7 hairline" aria-hidden="true" />
      <div className="flex flex-col gap-4">
        <span className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          App &amp; privacy
        </span>
        <ToggleSwitch
          checked={app.savePhotos}
          onChange={(v) => updateApp({ savePhotos: v })}
          label="Save photos to this device"
          description="Keep recent photos in your local portfolio. Turning this off won't remove photos you've already saved."
        />
      </div>
    </ProfileSection>
  );
}
