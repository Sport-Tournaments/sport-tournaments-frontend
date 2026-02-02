"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Textarea,
  Alert,
  FileUpload,
  FilePreview,
  LocationAutocomplete,
  AgeGroupsManager,
  Modal,
} from "@/components/ui";
import type { AgeGroupFormData } from "@/components/ui";
import { tournamentService, fileService } from "@/services";
import { getCurrentLocation } from "@/services/location.service";
import type { LocationSuggestion } from "@/types";
import { slugify, getTournamentPublicPath } from "@/utils/helpers";

const tournamentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  urlSlug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    )
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000),
  location: z.string().min(2, "Location is required"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  whatsappGroupLink: z.string().url("Invalid URL").optional().or(z.literal("")),
  rules: z.string().optional(),
  isPrivate: z.boolean().default(false),
  invitationCodeExpirationDays: z.coerce.number().min(1).max(365).optional(),
});

type TournamentFormData = z.infer<typeof tournamentSchema>;

export default function CreateTournamentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const initialAgeGroupsRef = useRef<string>("[]");
  const pendingNavigationRef = useRef<null | (() => void)>(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Auto-scroll to error message when error is set
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // Focus on the error message for accessibility
      errorRef.current.focus();
    }
  }, [error]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [regulationsFile, setRegulationsFile] = useState<File | null>(null);
  const [ageGroups, setAgeGroups] = useState<AgeGroupFormData[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      isPrivate: false,
      invitationCodeExpirationDays: 30,
    },
  });

  const isPrivate = watch("isPrivate");
  const watchedName = watch("name");
  const hasUnsavedAgeGroups = useMemo(() => {
    return initialAgeGroupsRef.current !== JSON.stringify(ageGroups);
  }, [ageGroups]);
  const hasUnsavedFiles = useMemo(() => {
    return !!bannerFile || !!regulationsFile;
  }, [bannerFile, regulationsFile]);
  const hasUnsavedChanges = isDirty || hasUnsavedAgeGroups || hasUnsavedFiles;

  useEffect(() => {
    if (slugTouched) return;
    const generatedSlug = watchedName ? slugify(watchedName) : "";
    setValue("urlSlug", generatedSlug, { shouldDirty: !!generatedSlug });
  }, [watchedName, slugTouched, setValue]);

  const getLeaveMessage = useCallback(
    () =>
      t(
        "common.unsavedChangesPrompt",
        "You have unsaved changes. Are you sure you want to leave this page?",
      ),
    [t],
  );

  const openLeaveModal = useCallback((action: () => void) => {
    pendingNavigationRef.current = action;
    setLeaveModalOpen(true);
  }, []);

  const closeLeaveModal = useCallback(() => {
    setLeaveModalOpen(false);
    pendingNavigationRef.current = null;
  }, []);

  const confirmLeave = useCallback(() => {
    setLeaveModalOpen(false);
    const action = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    action?.();
  }, []);

  const shouldWarnOnLeave = hasUnsavedChanges && !isLoading;

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!shouldWarnOnLeave) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      event.preventDefault();
      event.stopPropagation();

      openLeaveModal(() => {
        if (href.startsWith("http")) {
          window.location.href = href;
          return;
        }
        router.push(href);
      });
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () =>
      document.removeEventListener("click", handleDocumentClick, true);
  }, [shouldWarnOnLeave, getLeaveMessage]);

  // Handle location selection from autocomplete
  const handleLocationSelect = (location: LocationSuggestion) => {
    setValue("location", location.formattedAddress);
    if (location.latitude && location.longitude) {
      setValue("latitude", location.latitude);
      setValue("longitude", location.longitude);
    }
  };

  // Handle getting current device location
  const handleGetDeviceLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      setValue("latitude", location.latitude);
      setValue("longitude", location.longitude);
      // Update the location field to show coordinates (user can override with autocomplete)
      setValue(
        "location",
        `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get location";
      setError(message);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const onSubmit = async (data: TournamentFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate that at least one age group is defined
      if (ageGroups.length === 0) {
        setError("Please add at least one age category");
        setIsLoading(false);
        return;
      }

      // Transform frontend field names to backend DTO field names
      const tournamentData = {
        name: data.name,
        urlSlug: data.urlSlug?.trim() || undefined,
        description: data.description,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        ...(data.whatsappGroupLink?.trim() && {
          whatsappGroupLink: data.whatsappGroupLink.trim(),
        }),
        isPrivate: data.isPrivate,
        // Only include rules if provided (as regulationsData)
        ...(data.rules && { regulationsData: { rules: data.rules } }),
        // Include age groups (required now - they handle all dates)
        ageGroups,
      };
      const response = await tournamentService.createTournament(tournamentData);
      const tournamentId = response.data?.id;

      // Upload regulations file if provided
      if (regulationsFile && tournamentId) {
        try {
          const uploadResponse = await fileService.uploadFile(regulationsFile, {
            entityType: "tournament",
            entityId: tournamentId,
            isPublic: true,
          });

          // Update tournament with the file ID (used for download URL)
          if (uploadResponse.data?.id) {
            await tournamentService.updateTournament(tournamentId, {
              regulationsDocument: uploadResponse.data.id,
            });
          }
        } catch (uploadErr) {
          console.error("Failed to upload regulations file:", uploadErr);
          // Don't fail the whole creation, just warn
        }
      }

      // Redirect to tournament preview page
      if (response.data) {
        router.push(getTournamentPublicPath(response.data));
      } else if (tournamentId) {
        router.push(`/main/tournaments/${tournamentId}`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create tournament";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back button at top */}
        <div className="mb-2">
          <button
            onClick={() => {
              if (!shouldWarnOnLeave) {
                router.back();
                return;
              }
              openLeaveModal(() => router.back());
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t("common.back", "Back")}
          </button>
        </div>

        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t("tournament.createNew")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {t("tournament.createDesc")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("tournament.basicInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={t("tournament.name")}
                placeholder={t("tournament.namePlaceholder")}
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                label={t("tournament.slug", "Tournament URL Slug")}
                placeholder={t(
                  "tournament.slugPlaceholder",
                  "e.g. summer-youth-cup-2025",
                )}
                helperText={t(
                  "tournament.slugHelp",
                  "Auto-generated from the title; you can edit it.",
                )}
                error={errors.urlSlug?.message}
                {...register("urlSlug", {
                  onChange: () => setSlugTouched(true),
                  onBlur: (event) => {
                    const nextSlug = slugify(event.target.value || "");
                    setValue("urlSlug", nextSlug, { shouldDirty: true });
                  },
                })}
              />

              <Textarea
                label={t("tournament.description")}
                placeholder={t("tournament.descriptionPlaceholder")}
                rows={4}
                error={errors.description?.message}
                {...register("description")}
              />

              <Input
                label={t("tournament.whatsappGroup", "WhatsApp Group Link")}
                placeholder="https://chat.whatsapp.com/your-group-code"
                helperText={t(
                  "tournament.whatsappGroupHelp",
                  "Visible to approved clubs only.",
                )}
                error={errors.whatsappGroupLink?.message}
                {...register("whatsappGroupLink")}
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <LocationAutocomplete
                    label={t("tournament.location")}
                    placeholder="Search for city or venue..."
                    displayMode="address"
                    onSelect={handleLocationSelect}
                    error={errors.location?.message}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetDeviceLocation}
                    isLoading={isGettingLocation}
                    className="whitespace-nowrap"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {t("common.useMyLocation", "Use My Location")}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("tournament.banner")}
                </label>
                {bannerFile ? (
                  <FilePreview
                    file={bannerFile}
                    onRemove={() => setBannerFile(null)}
                  />
                ) : (
                  <FileUpload
                    onFilesSelected={(files) => setBannerFile(files[0])}
                    accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
                    maxSize={5 * 1024 * 1024}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Age Categories */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("tournaments.ageGroups.title", "Age Categories")}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {t(
                  "tournaments.ageGroups.description",
                  "Define specific settings for each age category. Each category can have its own dates, fees, and game format.",
                )}
              </p>
            </CardHeader>
            <CardContent>
              <AgeGroupsManager
                ageGroups={ageGroups}
                onChange={setAgeGroups}
                tournamentLocation={watch("location")}
                disabled={isLoading}
              />
            </CardContent>
          </Card>

          {/* Rules */}
          <Card>
            <CardHeader>
              <CardTitle>{t("tournament.rules")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label={t("tournament.rulesOptional")}
                placeholder={t("tournament.rulesPlaceholder")}
                rows={6}
                error={errors.rules?.message}
                {...register("rules")}
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("tournament.regulationsFile", "Regulations File (PDF)")}
                </label>
                {regulationsFile ? (
                  <FilePreview
                    file={regulationsFile}
                    onRemove={() => setRegulationsFile(null)}
                  />
                ) : (
                  <FileUpload
                    onFilesSelected={(files) => setRegulationsFile(files[0])}
                    accept={{ "application/pdf": [".pdf"] }}
                    maxSize={10 * 1024 * 1024}
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {t(
                    "tournament.regulationsHelp",
                    "Upload tournament regulations as PDF (max 10MB)",
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("tournament.privacySettings", "Privacy Settings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("tournament.privateTournament", "Private Tournament")}
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t(
                      "tournament.privateDesc",
                      "Only teams with an invitation code can register",
                    )}
                  </p>
                </div>
                <Controller
                  name="isPrivate"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        field.value ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          field.value ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  )}
                />
              </div>

              {isPrivate && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-indigo-700">
                      {t(
                        "tournament.invitationCodeInfo",
                        "An invitation code will be generated after creation",
                      )}
                    </span>
                  </div>
                  <Input
                    label={t(
                      "tournament.codeExpirationDays",
                      "Code Expiration (days)",
                    )}
                    type="number"
                    min={1}
                    max={365}
                    placeholder="30"
                    error={errors.invitationCodeExpirationDays?.message}
                    {...register("invitationCodeExpirationDays")}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t(
                      "tournament.codeExpirationHelp",
                      "Leave empty for no expiration",
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 bg-white/95 backdrop-blur border-t border-gray-200 py-4 px-4 sm:px-0">
            <div className="flex justify-end gap-4 max-w-4xl mx-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (!shouldWarnOnLeave) {
                    router.back();
                    return;
                  }
                  openLeaveModal(() => router.back());
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                {t("tournament.createTournament")}
              </Button>
            </div>
          </div>
        </form>
      </div>
      <Modal
        isOpen={leaveModalOpen}
        onClose={closeLeaveModal}
        title={t("common.unsavedChangesTitle", "Unsaved changes")}
        description={getLeaveMessage()}
        size="sm"
        footer={
          <>
            <Button type="button" variant="danger" onClick={confirmLeave}>
              {t("common.leave", "Leave")}
            </Button>
            <Button type="button" variant="outline" onClick={closeLeaveModal}>
              {t("common.stay", "Stay")}
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-600">
          {t(
            "common.unsavedChangesDetail",
            "Changes you made may not be saved.",
          )}
        </div>
      </Modal>
      <Modal
        isOpen={!!error}
        onClose={() => setError(null)}
        title={t("common.error", "Error")}
        description={error || ""}
        size="sm"
        footer={
          <Button
            type="button"
            variant="primary"
            onClick={() => setError(null)}
          >
            {t("common.ok", "OK")}
          </Button>
        }
      >
        <div className="text-sm text-gray-600">{error}</div>
      </Modal>
    </DashboardLayout>
  );
}
