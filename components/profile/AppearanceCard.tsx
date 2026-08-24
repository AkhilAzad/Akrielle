"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

import { ProfileSection } from "@/components/profile/ProfileSection";
import {
  ReadField,
  SelectField,
  ghostPillClass,
  solidPillClass,
} from "@/components/profile/fields";
import { useProfile } from "@/context/ProfileContext";
import { EYE_COLORS, HAIR_COLORS, SKIN_TYPES } from "@/constants/profile";

/**
 * Appearance details the user self-reports — hair colour, eye colour, and skin
 * type. These are distinct from AXL's AI-derived readings (skin tone,
 * undertone, etc.) and are stored locally via the profile context.
 */
export function AppearanceCard() {
  const { data: profile, updateAppearance } = useProfile();
  const { appearance } = profile;

  const [editing, setEditing] = useState(false);
  const [draftHair, setDraftHair] = useState("");
  const [draftEye, setDraftEye] = useState("");
  const [draftSkin, setDraftSkin] = useState("");

  const startEdit = () => {
    setDraftHair(appearance.hairColor);
    setDraftEye(appearance.eyeColor);
    setDraftSkin(appearance.skinType);
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = () => {
    updateAppearance({
      hairColor: draftHair,
      eyeColor: draftEye,
      skinType: draftSkin,
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
      eyebrow="Appearance"
      title="Your features."
      description="What you'd tell a stylist — separate from what the AI detects."
      action={action}
    >
      {editing ? (
        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField
            id="profile-hair"
            label="Hair colour"
            value={draftHair}
            onChange={setDraftHair}
            options={HAIR_COLORS}
          />
          <SelectField
            id="profile-eye"
            label="Eye colour"
            value={draftEye}
            onChange={setDraftEye}
            options={EYE_COLORS}
          />
          <SelectField
            id="profile-skin"
            label="Skin type"
            value={draftSkin}
            onChange={setDraftSkin}
            options={SKIN_TYPES}
          />
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <ReadField label="Hair colour" value={appearance.hairColor} />
          <ReadField label="Eye colour" value={appearance.eyeColor} />
          <ReadField label="Skin type" value={appearance.skinType} />
        </div>
      )}
    </ProfileSection>
  );
}
