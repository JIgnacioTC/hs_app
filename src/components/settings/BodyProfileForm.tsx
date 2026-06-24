"use client";

import { Input, Label } from "@/components/ui/Input";
import {
  ACTIVITY_LEVELS,
  SEX_OPTIONS,
  TRAINING_EXPERIENCE,
  type ActivityLevelId,
  type SexId,
  type TrainingExperienceId,
} from "@/lib/fitness/profile";
import { cn } from "@/lib/utils";

export interface BodyProfileFormValues {
  sex: SexId | "";
  age_years: string;
  height_cm: string;
  weight_kg: string;
  activity_level: ActivityLevelId | "";
  training_experience: TrainingExperienceId | "";
}

export const EMPTY_BODY_PROFILE: BodyProfileFormValues = {
  sex: "",
  age_years: "",
  height_cm: "",
  weight_kg: "",
  activity_level: "",
  training_experience: "",
};

export function bodyProfileFromApi(profile: {
  sex?: SexId | null;
  birth_date?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: ActivityLevelId | null;
  training_experience?: TrainingExperienceId | null;
} | null): BodyProfileFormValues {
  if (!profile) return { ...EMPTY_BODY_PROFILE };

  let age_years = "";
  if (profile.birth_date) {
    const born = new Date(`${profile.birth_date}T12:00:00`);
    const today = new Date();
    let age = today.getFullYear() - born.getFullYear();
    if (today.getMonth() < born.getMonth()) age -= 1;
    age_years = String(age);
  }

  return {
    sex: profile.sex ?? "",
    age_years,
    height_cm: profile.height_cm != null ? String(profile.height_cm) : "",
    weight_kg: profile.weight_kg != null ? String(profile.weight_kg) : "",
    activity_level: profile.activity_level ?? "",
    training_experience: profile.training_experience ?? "",
  };
}

export function bodyProfileToPayload(values: BodyProfileFormValues) {
  return {
    sex: values.sex || null,
    age_years: values.age_years ? Number(values.age_years) : null,
    height_cm: values.height_cm ? Number(values.height_cm) : null,
    weight_kg: values.weight_kg ? Number(values.weight_kg) : null,
    activity_level: values.activity_level || null,
    training_experience: values.training_experience || null,
  };
}

export function isBodyProfileFormValid(values: BodyProfileFormValues): boolean {
  const age = Number(values.age_years);
  const height = Number(values.height_cm);
  const weight = Number(values.weight_kg);
  return Boolean(
    values.sex &&
      values.activity_level &&
      values.training_experience &&
      Number.isFinite(age) &&
      age >= 10 &&
      age <= 100 &&
      Number.isFinite(height) &&
      height >= 100 &&
      height <= 250 &&
      Number.isFinite(weight) &&
      weight >= 30 &&
      weight <= 300
  );
}

interface BodyProfileFormProps {
  values: BodyProfileFormValues;
  onChange: (values: BodyProfileFormValues) => void;
}

export function BodyProfileForm({ values, onChange }: BodyProfileFormProps) {
  function patch(partial: Partial<BodyProfileFormValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <div className="space-y-5">
      <div>
        <Label>Sexo</Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SEX_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => patch({ sex: option.id })}
              className={cn(
                "rounded-[20px] border px-3 py-2.5 text-sm transition-all duration-200 active:scale-[0.98]",
                values.sex === option.id
                  ? "border-accent-soft bg-accent/10 text-foreground"
                  : "border-border text-secondary"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="age">Edad</Label>
          <Input
            id="age"
            type="number"
            inputMode="numeric"
            placeholder="28"
            value={values.age_years}
            onChange={(e) => patch({ age_years: e.currentTarget.value })}
          />
        </div>
        <div>
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            inputMode="decimal"
            placeholder="175"
            value={values.height_cm}
            onChange={(e) => patch({ height_cm: e.currentTarget.value })}
          />
        </div>
        <div>
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            inputMode="decimal"
            placeholder="72"
            value={values.weight_kg}
            onChange={(e) => patch({ weight_kg: e.currentTarget.value })}
          />
        </div>
      </div>

      <div>
        <Label>Nivel de actividad</Label>
        <div className="mt-2 space-y-2">
          {ACTIVITY_LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => patch({ activity_level: level.id })}
              className={cn(
                "flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition-all duration-200 active:scale-[0.98]",
                values.activity_level === level.id
                  ? "border-accent-soft bg-accent/10"
                  : "border-border hover:border-accent-soft/40"
              )}
            >
              <div>
                <p className="text-sm font-medium">{level.label}</p>
                <p className="text-xs text-muted">{level.hint}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Experiencia entrenando</Label>
        <div className="mt-2 grid grid-cols-1 gap-2">
          {TRAINING_EXPERIENCE.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => patch({ training_experience: level.id })}
              className={cn(
                "rounded-[20px] border px-4 py-3 text-left transition-all duration-200 active:scale-[0.98]",
                values.training_experience === level.id
                  ? "border-accent-soft bg-accent/10"
                  : "border-border hover:border-accent-soft/40"
              )}
            >
              <p className="text-sm font-medium">{level.label}</p>
              <p className="text-xs text-muted">{level.hint}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
