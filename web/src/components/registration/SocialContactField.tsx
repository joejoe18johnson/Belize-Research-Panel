"use client";

import { Field, TextInput } from "./form-ui";
import { SocialProfilePreview } from "./SocialProfilePreview";
import type { SocialPlatform } from "@/lib/social-profile";

export function SocialContactField({
  platform,
  label,
  id,
  value,
  onChange,
  placeholder,
}: {
  platform: SocialPlatform;
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label} id={id}>
      <TextInput
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <SocialProfilePreview platform={platform} value={value} />
    </Field>
  );
}
