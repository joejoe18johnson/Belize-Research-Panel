"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Field, SelectInput, TextArea, TextInput } from "@/components/registration/form-ui";
import type { PanelistDashboardProfile } from "@/lib/panelist-dashboard";
import type { RedemptionOption, RedemptionRequest } from "@/lib/reward-redemption";
import {
  REDEMPTION_MINIMUM_POINTS,
  REDEMPTION_OPTIONS,
  REDEMPTION_RATE_LABEL,
  bzToPoints,
  canAccessRedemption,
  formatBz,
  getAvailablePoints,
  getEligibleRedemptionOptions,
  getRedemptionAmountChoices,
  pointsToBz,
} from "@/lib/reward-redemption";
import { DashboardAlert, DashboardCard, SectionHeading } from "./DashboardShell";
import { formatHeadingCase } from "@/lib/sentence-case";

function defaultFieldValue(
  fieldName: string,
  profile: Pick<PanelistDashboardProfile, "email" | "phone">
): string {
  if (fieldName === "deliveryEmail") return profile.email;
  if (fieldName === "phone" || fieldName === "contactPhone") return profile.phone;
  return "";
}

function buildInitialFormState(
  initialOptionId: string | undefined,
  totalPoints: number,
  requests: RedemptionRequest[],
  profile: Pick<PanelistDashboardProfile, "email" | "phone">
) {
  const availablePoints = getAvailablePoints(totalPoints, requests);
  const eligibleOptions = getEligibleRedemptionOptions(totalPoints, requests);
  const optionId =
    initialOptionId && REDEMPTION_OPTIONS.some((option) => option.id === initialOptionId)
      ? initialOptionId
      : (eligibleOptions[0]?.id ?? "");
  const option = REDEMPTION_OPTIONS.find((item) => item.id === optionId);
  const choices = option ? getRedemptionAmountChoices(option, availablePoints) : [];
  const details: Record<string, string> = {};

  if (option) {
    for (const field of option.fields) {
      details[field.name] = defaultFieldValue(field.name, profile);
    }
  }

  return {
    optionId,
    amountBz: choices[0] ? String(choices[0].amountBz) : "",
    details,
  };
}

export function RedemptionRequestForm({
  totalPoints,
  requests,
  profile,
  accountOnHold = false,
  initialOptionId,
  standalone = false,
}: {
  totalPoints: number;
  requests: RedemptionRequest[];
  profile: Pick<PanelistDashboardProfile, "email" | "phone" | "firstName" | "lastName">;
  accountOnHold?: boolean;
  initialOptionId?: string;
  standalone?: boolean;
}) {
  const router = useRouter();
  const unlocked = canAccessRedemption(totalPoints);
  const availablePoints = getAvailablePoints(totalPoints, requests);
  const eligibleOptions = useMemo(
    () => getEligibleRedemptionOptions(totalPoints, requests),
    [totalPoints, requests]
  );
  const optionChoices = useMemo(() => {
    if (standalone && unlocked) return REDEMPTION_OPTIONS;
    return eligibleOptions;
  }, [standalone, unlocked, eligibleOptions]);

  const initialState = useMemo(
    () => buildInitialFormState(initialOptionId, totalPoints, requests, profile),
    [initialOptionId, totalPoints, requests, profile]
  );

  const [optionId, setOptionId] = useState<string>(initialState.optionId);
  const selectedOption = REDEMPTION_OPTIONS.find((option) => option.id === optionId);
  const amountChoices = selectedOption ? getRedemptionAmountChoices(selectedOption, availablePoints) : [];

  const [amountBz, setAmountBz] = useState(initialState.amountBz);
  const [customAmountBz, setCustomAmountBz] = useState("");
  const [details, setDetails] = useState<Record<string, string>>(initialState.details);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const selectedAmount = selectedOption?.amountMode === "custom_min_20"
    ? Number.parseFloat(customAmountBz)
    : Number.parseFloat(amountBz);

  const selectedPoints =
    Number.isFinite(selectedAmount) && selectedAmount > 0 ? bzToPoints(selectedAmount) : null;

  const updateDetail = (name: string, value: string) => {
    setDetails((current) => ({ ...current, [name]: value }));
  };

  const onOptionChange = (nextOptionId: string) => {
    setOptionId(nextOptionId);
    setAmountBz("");
    setCustomAmountBz("");
    setErrors({});
    setSuccessMessage("");

    const option = REDEMPTION_OPTIONS.find((item) => item.id === nextOptionId);
    if (!option) {
      setDetails({});
      return;
    }

    const choices = getRedemptionAmountChoices(option, availablePoints);
    if (choices.length > 0) {
      setAmountBz(String(choices[0].amountBz));
    }

    const nextDetails: Record<string, string> = {};
    for (const field of option.fields) {
      nextDetails[field.name] = details[field.name] ?? defaultFieldValue(field.name, profile);
    }
    setDetails(nextDetails);
  };

  const submit = async () => {
    if (!selectedOption) return;

    setSubmitting(true);
    setErrors({});
    setSuccessMessage("");

    const payloadAmount =
      selectedOption.amountMode === "custom_min_20" ? customAmountBz : amountBz;

    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionId: selectedOption.id,
          amountBz: payloadAmount,
          details,
          notes,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        errors?: Record<string, string>;
      };

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setErrors({ form: data.message ?? "Could not submit redemption request." });
        return;
      }

      setSuccessMessage(data.message ?? "Redemption request submitted.");
      setNotes("");
      setAmountBz("");
      setCustomAmountBz("");
      router.refresh();
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (accountOnHold) {
    return (
      <DashboardCard>
        {!standalone ? <SectionHeading as="h3">Redeem points</SectionHeading> : null}
        <p className={`text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 ${standalone ? "" : "mt-2"}`}>
          Your account is on hold until contact verification is complete. You can still view redemption options on
          rewards, but requests are disabled for now.
        </p>
      </DashboardCard>
    );
  }

  if (!unlocked) {
    return (
      <DashboardCard className="border-dashed border-zinc-300 bg-zinc-50/80">
        {!standalone ? <SectionHeading as="h3">Redeem points</SectionHeading> : null}
        <p className={`text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 ${standalone ? "" : "mt-2"}`}>
          Redemption unlocks at <strong>{REDEMPTION_MINIMUM_POINTS} points ({formatBz(20)})</strong>. You currently
          have <strong>{totalPoints} points</strong> ({formatBz(pointsToBz(totalPoints))}). {REDEMPTION_RATE_LABEL} —
          return to rewards to see what you can redeem and how many points each amount needs.
        </p>
      </DashboardCard>
    );
  }

  if (eligibleOptions.length === 0 && !standalone) {
    return (
      <DashboardCard>
        <SectionHeading as="h3">Redeem points</SectionHeading>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          You have reached the first redemption milestone, but your available balance is{" "}
          <strong>{availablePoints} points</strong> ({formatBz(pointsToBz(availablePoints))})
          {requests.some((request) => request.status === "pending" || request.status === "approved")
            ? " because points are reserved on pending requests."
            : "."}{" "}
          Wait for pending requests to complete or earn more points to redeem again.
        </p>
      </DashboardCard>
    );
  }

  const insufficientAvailable =
    standalone && selectedOption && amountChoices.length === 0 && selectedOption.amountMode !== "custom_min_20";

  return (
    <DashboardCard>
      {!standalone ? (
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <SectionHeading as="h3">Redeem points</SectionHeading>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
            {REDEMPTION_RATE_LABEL}. Submit your details for the reward you want — requests are reviewed before payout.
          </p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4">
          <DashboardAlert tone="success" title="Request submitted">
            {successMessage}
          </DashboardAlert>
        </div>
      ) : null}

      <div className={`space-y-5 ${standalone ? "" : "mt-5"}`}>
        <Field label="Redemption option" required error={errors.optionId} id="redemption-option">
          <SelectInput
            id="redemption-option"
            value={optionId}
            onChange={(event) => onOptionChange(event.target.value)}
            error={errors.optionId}
          >
            <option value="">Select an option</option>
            {optionChoices.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} — from {formatBz(option.minAmountBz)} ({option.incrementLabel.toLowerCase()})
              </option>
            ))}
          </SelectInput>
        </Field>

        {insufficientAvailable ? (
          <DashboardAlert tone="info" title="Insufficient available points">
            You need at least {selectedOption ? bzToPoints(selectedOption.minAmountBz) : REDEMPTION_MINIMUM_POINTS}{" "}
            available points for this option. You currently have {availablePoints} pts (
            {formatBz(pointsToBz(availablePoints))}) available
            {requests.some((request) => request.status === "pending" || request.status === "approved")
              ? " — some points may be reserved on pending requests."
              : "."}
          </DashboardAlert>
        ) : null}

        {selectedOption && !insufficientAvailable ? (
          <>
            {selectedOption.amountMode === "custom_min_20" ? (
              <Field
                label="Amount to pay toward bill"
                required
                hint={`Minimum ${formatBz(20)}. Enter the bill amount you want paid (up to your available balance of ${formatBz(pointsToBz(availablePoints))}).`}
                error={errors.amountBz}
                id="redemption-custom-amount"
              >
                <TextInput
                  id="redemption-custom-amount"
                  type="number"
                  min={20}
                  step={1}
                  value={customAmountBz}
                  onChange={(event) => setCustomAmountBz(event.target.value)}
                  placeholder="e.g. 45"
                  error={errors.amountBz}
                />
              </Field>
            ) : (
              <Field label="Redemption amount" required error={errors.amountBz} id="redemption-amount">
                <SelectInput
                  id="redemption-amount"
                  value={amountBz}
                  onChange={(event) => setAmountBz(event.target.value)}
                  error={errors.amountBz}
                >
                  <option value="">Select amount</option>
                  {amountChoices.map((choice) => (
                    <option key={choice.amountBz} value={String(choice.amountBz)}>
                      {choice.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            )}

            {selectedPoints ? (
              <OptionSummary
                option={selectedOption}
                amountBz={selectedAmount}
                points={selectedPoints}
                availablePoints={availablePoints}
              />
            ) : null}

            {selectedOption.fields.map((field) => (
              <Field
                key={field.name}
                id={`redemption-${field.name}`}
                label={field.label}
                required={field.required}
                hint={field.hint}
                error={errors[field.name]}
              >
                {field.type === "select" ? (
                  <SelectInput
                    id={`redemption-${field.name}`}
                    value={details[field.name] ?? defaultFieldValue(field.name, profile)}
                    onChange={(event) => updateDetail(field.name, event.target.value)}
                    error={errors[field.name]}
                  >
                    {(field.options ?? []).map((option) => (
                      <option key={option.value || "empty"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                ) : field.type === "textarea" ? (
                  <TextArea
                    id={`redemption-${field.name}`}
                    value={details[field.name] ?? defaultFieldValue(field.name, profile)}
                    onChange={(event) => updateDetail(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    error={errors[field.name]}
                  />
                ) : (
                  <TextInput
                    id={`redemption-${field.name}`}
                    type={field.type}
                    value={details[field.name] ?? defaultFieldValue(field.name, profile)}
                    onChange={(event) => updateDetail(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    error={errors[field.name]}
                  />
                )}
              </Field>
            ))}

            <Field label="Additional notes" hint="Optional — include any special instructions." id="redemption-notes">
              <TextInput
                id="redemption-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g. preferred collection time, alternate contact"
              />
            </Field>
          </>
        ) : null}

        {errors.form ? (
          <p className="text-sm text-red-600" role="alert">
            {errors.form}
          </p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={submitting || !selectedOption || !selectedPoints || insufficientAvailable}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300 sm:w-auto"
        >
          {submitting
            ? formatHeadingCase("Submitting…")
            : selectedPoints
              ? formatHeadingCase(`Submit request (${formatBz(selectedAmount)} · ${selectedPoints} pts)`)
              : formatHeadingCase("Submit request")}
        </button>
      </div>
    </DashboardCard>
  );
}

function OptionSummary({
  option,
  amountBz,
  points,
  availablePoints,
}: {
  option: RedemptionOption;
  amountBz: number;
  points: number;
  availablePoints: number;
}) {
  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-sm text-teal-900 dark:text-teal-100">
      <p className="font-semibold">{option.label}</p>
      <p className="mt-1 text-teal-800 dark:text-teal-200">
        {formatBz(amountBz)} · {points} points will be reserved from your balance ({availablePoints} pts /{" "}
        {formatBz(pointsToBz(availablePoints))} available).
      </p>
    </div>
  );
}
