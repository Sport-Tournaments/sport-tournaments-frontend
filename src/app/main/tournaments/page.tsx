"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Select,
  Loading,
  GeolocationFilterCompact,
  TournamentCalendar,
  TournamentMap,
} from "@/components/ui";
import { tournamentService } from "@/services";
import { formatDistance } from "@/services/location.service";
import { Tournament, TournamentStatus, GeolocationFilters } from "@/types";
import { formatDate } from "@/utils/date";
import { getTournamentPublicPath } from "@/utils/helpers";
import { useDebounce, useInfiniteScroll } from "@/hooks";

const PAGE_SIZE = 12;

type ViewMode = "list" | "calendar" | "map";

export default function TournamentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [geoFilters, setGeoFilters] = useState<GeolocationFilters>({});
  const [ageCategory, setAgeCategory] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [country, setCountry] = useState("");
  const [gameSystem, setGameSystem] = useState("");
  const [startDateFromInput, setStartDateFromInput] = useState("");
  const [startDateToInput, setStartDateToInput] = useState("");
  const [numberOfMatchesMin, setNumberOfMatchesMin] = useState("");
  const [numberOfMatchesMax, setNumberOfMatchesMax] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [hasAvailableSpots, setHasAvailableSpots] = useState(false);
  const [isPrivateFilter, setIsPrivateFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const debouncedSearch = useDebounce(search, 300);

  const dateOnlyFrom = startDateFromInput
    ? startDateFromInput.split("T")[0]
    : "";
  const dateOnlyTo = startDateToInput ? startDateToInput.split("T")[0] : "";

  const fetchTournaments = useCallback(
    async (page: number) => {
      const params: Record<string, unknown> = {
        page,
        pageSize: PAGE_SIZE,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;
      if (ageCategory) params.ageCategory = ageCategory;
      if (level) params.level = level;
      if (country) params.country = country;
      if (gameSystem) params.gameSystem = gameSystem;
      if (dateOnlyFrom) params.startDateFrom = dateOnlyFrom;
      if (dateOnlyTo) params.startDateTo = dateOnlyTo;
      if (numberOfMatchesMin)
        params.numberOfMatchesMin = Number(numberOfMatchesMin);
      if (numberOfMatchesMax)
        params.numberOfMatchesMax = Number(numberOfMatchesMax);
      if (isPremium) params.isPremium = true;
      if (isFeatured) params.isFeatured = true;
      if (hasAvailableSpots) params.hasAvailableSpots = true;
      if (isPrivateFilter) params.isPrivate = isPrivateFilter === "true";
      if (sortBy) {
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }

      // Add geolocation params
      if (geoFilters.userLatitude && geoFilters.userLongitude) {
        params.userLatitude = geoFilters.userLatitude;
        params.userLongitude = geoFilters.userLongitude;
        if (geoFilters.maxDistance) params.maxDistance = geoFilters.maxDistance;
        if (geoFilters.sortByDistance) params.sortByDistance = true;
      }

      const response = await tournamentService.getTournaments(params);
      const resData = response.data as any;

      // Handle different response structures
      let tournamentData: Tournament[] = [];
      let totalPages = 1;

      if (Array.isArray(resData)) {
        // Direct array response
        tournamentData = resData;
        totalPages = 1;
      } else if (resData?.data?.items && Array.isArray(resData.data.items)) {
        // Nested data.items structure
        tournamentData = resData.data.items;
        totalPages =
          resData.data.totalPages || resData.data.meta?.totalPages || 1;
      } else if (resData?.items && Array.isArray(resData.items)) {
        // data.items structure
        tournamentData = resData.items;
        totalPages = resData.totalPages || resData.meta?.totalPages || 1;
      } else if (resData?.data && Array.isArray(resData.data)) {
        // data.data array structure
        tournamentData = resData.data;
        totalPages = resData.totalPages || resData.meta?.totalPages || 1;
      }

      return {
        items: tournamentData,
        hasMore: page < totalPages,
        totalPages,
      };
    },
    [
      debouncedSearch,
      status,
      geoFilters,
      ageCategory,
      level,
      country,
      gameSystem,
      dateOnlyFrom,
      dateOnlyTo,
      numberOfMatchesMin,
      numberOfMatchesMax,
      isPremium,
      isFeatured,
      hasAvailableSpots,
      isPrivateFilter,
      sortBy,
      sortOrder,
    ],
  );

  const {
    items: tournaments,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    sentinelRef,
    retry,
  } = useInfiniteScroll<Tournament>({
    fetchData: fetchTournaments,
    dependencies: [
      debouncedSearch,
      status,
      geoFilters,
      ageCategory,
      level,
      country,
      gameSystem,
      dateOnlyFrom,
      dateOnlyTo,
      numberOfMatchesMin,
      numberOfMatchesMax,
      isPremium,
      isFeatured,
      hasAvailableSpots,
      isPrivateFilter,
      sortBy,
      sortOrder,
    ],
  });

  const statusOptions = [
    { value: "", label: t("common.all") },
    {
      value: "PUBLISHED" as TournamentStatus,
      label: t("tournament.status.published"),
    },
    {
      value: "ONGOING" as TournamentStatus,
      label: t("tournament.status.ongoing"),
    },
    {
      value: "COMPLETED" as TournamentStatus,
      label: t("tournament.status.completed"),
    },
    {
      value: "CANCELLED" as TournamentStatus,
      label: t("tournament.status.cancelled"),
    },
  ];

  const ageCategoryOptions = [
    { value: "", label: t("common.all") },
    { value: "U5", label: t("tournament.ageCategory.U5") },
    { value: "U6", label: t("tournament.ageCategory.U6") },
    { value: "U7", label: t("tournament.ageCategory.U7") },
    { value: "U8", label: t("tournament.ageCategory.U8") },
    { value: "U9", label: t("tournament.ageCategory.U9") },
    { value: "U10", label: t("tournament.ageCategory.U10") },
    { value: "U11", label: t("tournament.ageCategory.U11") },
    { value: "U12", label: t("tournament.ageCategory.U12") },
    { value: "U13", label: t("tournament.ageCategory.U13") },
    { value: "U14", label: t("tournament.ageCategory.U14") },
    { value: "U15", label: t("tournament.ageCategory.U15") },
    { value: "U16", label: t("tournament.ageCategory.U16") },
    { value: "U17", label: t("tournament.ageCategory.U17") },
    { value: "U18", label: t("tournament.ageCategory.U18") },
    { value: "U19", label: t("tournament.ageCategory.U19") },
    { value: "U20", label: t("tournament.ageCategory.U20") },
    { value: "U21", label: t("tournament.ageCategory.U21") },
    { value: "U22", label: t("tournament.ageCategory.U22") },
    { value: "U23", label: t("tournament.ageCategory.U23") },
    { value: "SENIOR", label: t("tournament.ageCategory.SENIOR") },
    { value: "VETERANS", label: t("tournament.ageCategory.VETERANS") },
  ];

  const levelOptions = [
    { value: "", label: t("common.all") },
    { value: "I", label: t("tournament.level.I") },
    { value: "II", label: t("tournament.level.II") },
    { value: "III", label: t("tournament.level.III") },
  ];

  const gameSystemOptions = [
    { value: "", label: t("common.all") },
    { value: "5+1", label: "5+1" },
    { value: "6+1", label: "6+1" },
    { value: "7+1", label: "7+1" },
    { value: "8+1", label: "8+1" },
    { value: "9+1", label: "9+1" },
    { value: "10+1", label: "10+1" },
    { value: "11+1", label: "11+1" },
  ];

  const privateOptions = [
    { value: "", label: t("tournament.filters.any") },
    { value: "false", label: t("tournament.filters.public") },
    { value: "true", label: t("tournament.filters.private") },
  ];

  const sortByOptions = [
    { value: "", label: t("tournament.filters.sort.default") },
    { value: "startDate", label: t("tournament.filters.sort.startDate") },
    { value: "name", label: t("tournament.filters.sort.name") },
    { value: "participationFee", label: t("tournament.filters.sort.fee") },
    { value: "maxTeams", label: t("tournament.filters.sort.maxTeams") },
    { value: "createdAt", label: t("tournament.filters.sort.createdAt") },
    { value: "distance", label: t("tournament.filters.sort.distance") },
  ];

  const sortOrderOptions = [
    { value: "ASC", label: t("common.ascending") },
    { value: "DESC", label: t("common.descending") },
  ];

  const clearAdvancedFilters = () => {
    setAgeCategory("");
    setLevel("");
    setCountry("");
    setGameSystem("");
    setStartDateFromInput("");
    setStartDateToInput("");
    setNumberOfMatchesMin("");
    setNumberOfMatchesMax("");
    setIsPremium(false);
    setIsFeatured(false);
    setHasAvailableSpots(false);
    setIsPrivateFilter("");
    setSortBy("");
    setSortOrder("ASC");
  };

  const normalizeStatus = (tournamentStatus: TournamentStatus) =>
    tournamentStatus === "DRAFT" ? "PUBLISHED" : tournamentStatus;

  const getStatusBadge = (tournamentStatus: TournamentStatus) => {
    const normalizedStatus = normalizeStatus(tournamentStatus);
    const variants: Partial<
      Record<
        TournamentStatus,
        "default" | "success" | "warning" | "danger" | "info"
      >
    > = {
      PUBLISHED: "info",
      ONGOING: "info",
      COMPLETED: "success",
      CANCELLED: "danger",
    };
    return variants[normalizedStatus] || "default";
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("tournament.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t("tournament.subtitle")}
            </p>
          </div>
          <Link href="/dashboard/tournaments/create">
            <Button variant="primary">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t("tournament.create")}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <Input
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
          <GeolocationFilterCompact
            value={geoFilters}
            onChange={setGeoFilters}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
          >
            {showAdvancedFilters
              ? t("tournament.filters.hide")
              : t("tournament.filters.more")}
          </Button>
        </div>

        {showAdvancedFilters && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {t("tournament.filters.title")}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAdvancedFilters}
              >
                {t("common.clear")}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label={t("tournament.ageCategory.label")}
                options={ageCategoryOptions}
                value={ageCategory}
                onChange={(e) => setAgeCategory(e.target.value)}
              />
              <Select
                label={t("tournament.level.label")}
                options={levelOptions}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              />
              <Input
                label={t("common.country")}
                placeholder={t("common.country")}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
              <Select
                label={t("tournament.filters.gameSystem")}
                options={gameSystemOptions}
                value={gameSystem}
                onChange={(e) => setGameSystem(e.target.value)}
              />
              <Input
                label={t("tournament.filters.startDateFrom")}
                type="date"
                value={startDateFromInput}
                onChange={(e) => setStartDateFromInput(e.target.value)}
              />
              <Input
                label={t("tournament.filters.startDateTo")}
                type="date"
                value={startDateToInput}
                onChange={(e) => setStartDateToInput(e.target.value)}
              />
              <Input
                label={t("tournament.filters.matchesMin")}
                type="number"
                min={0}
                value={numberOfMatchesMin}
                onChange={(e) => setNumberOfMatchesMin(e.target.value)}
              />
              <Input
                label={t("tournament.filters.matchesMax")}
                type="number"
                min={0}
                value={numberOfMatchesMax}
                onChange={(e) => setNumberOfMatchesMax(e.target.value)}
              />
              <Select
                label={t("tournament.filters.privacy")}
                options={privateOptions}
                value={isPrivateFilter}
                onChange={(e) => setIsPrivateFilter(e.target.value)}
              />
              <Select
                label={t("common.sortBy")}
                options={sortByOptions}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              />
              <Select
                label={t("tournament.filters.sortOrder")}
                options={sortOrderOptions}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "ASC" | "DESC")}
                disabled={!sortBy}
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  {t("tournament.filters.flags")}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={hasAvailableSpots}
                      onChange={(e) => setHasAvailableSpots(e.target.checked)}
                    />
                    {t("tournament.filters.availableSpots")}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                    />
                    {t("tournament.filters.premium")}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                    />
                    {t("tournament.filters.featured")}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle Buttons + Quick Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 mr-2">
              {t("common.view", "View")}:
            </span>
            <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title={t("tournaments.listView", "List view")}
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
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {t("common.list", "List")}
                </span>
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "calendar"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title={t("tournaments.calendarView", "Calendar view")}
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {t("common.calendar", "Calendar")}
                </span>
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "map"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title={t("tournaments.mapView", "Map view")}
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
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {t("common.map", "Map")}
                </span>
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Select
              containerClassName="w-full sm:w-48"
              options={ageCategoryOptions}
              value={ageCategory}
              onChange={(e) => setAgeCategory(e.target.value)}
              label={t("tournament.ageCategory.label")}
            />
            <Input
              containerClassName="w-full sm:w-48"
              label={t("common.country")}
              placeholder={t("common.country")}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <Input
              containerClassName="w-full sm:w-52"
              label={t("tournament.filters.startDateFrom")}
              type="datetime-local"
              value={startDateFromInput}
              onChange={(e) => setStartDateFromInput(e.target.value)}
            />
            <Input
              containerClassName="w-full sm:w-52"
              label={t("tournament.filters.startDateTo")}
              type="datetime-local"
              value={startDateToInput}
              onChange={(e) => setStartDateToInput(e.target.value)}
            />
          </div>
        </div>

        {/* Loading state */}
        {isLoading && tournaments.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : error ? (
          /* Error state */
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-red-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("common.error")}
            </h3>
            <p className="text-gray-500 mb-4">{error.message}</p>
            <Button variant="primary" onClick={retry}>
              {t("common.retry")}
            </Button>
          </div>
        ) : tournaments.length === 0 ? (
          /* Empty state */
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("tournament.noTournaments")}
            </h3>
            <p className="text-gray-500 mb-4">
              {t("tournament.noTournamentsDesc")}
            </p>
            <Link href="/dashboard/tournaments/create">
              <Button variant="primary">{t("tournament.createFirst")}</Button>
            </Link>
          </div>
        ) : viewMode === "calendar" ? (
          /* Calendar View */
          <TournamentCalendar tournaments={tournaments} />
        ) : viewMode === "map" ? (
          /* Map View */
          <TournamentMap tournaments={tournaments} />
        ) : (
          /* Tournament grid with infinite scroll */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {tournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={getTournamentPublicPath(tournament)}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    {tournament.bannerImage && (
                      <div className="relative h-40 bg-white border-b border-gray-200 rounded-t-lg overflow-hidden">
                        <img
                          src={tournament.bannerImage}
                          alt={tournament.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant={getStatusBadge(tournament.status)}>
                            {t(
                              `tournament.status.${normalizeStatus(tournament.status)}`,
                            )}
                          </Badge>
                        </div>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {tournament.name}
                        </h3>
                        {!tournament.bannerImage && (
                          <Badge variant={getStatusBadge(tournament.status)}>
                            {t(`tournament.status.${tournament.status}`)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                        {tournament.description}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
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
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {formatDate(tournament.startDate)} -{" "}
                          {formatDate(tournament.endDate)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
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
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="flex-1 truncate">
                            {tournament.location || t("common.online")}
                          </span>
                          {tournament.distance !== undefined && (
                            <Badge variant="info" className="ml-auto">
                              {formatDistance(tournament.distance)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
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
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          {tournament.registeredTeams || 0} /{" "}
                          {tournament.maxTeams} {t("common.teams")}
                        </div>
                      </div>
                      {tournament.registrationFee &&
                        tournament.registrationFee > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <span className="text-lg font-bold text-primary">
                              €{tournament.registrationFee}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">
                              / {t("common.team")}
                            </span>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Infinite scroll sentinel & loading indicator */}
            <div ref={sentinelRef} className="mt-8 flex justify-center py-4">
              {isFetchingMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loading size="sm" />
                  <span>{t("common.loading")}</span>
                </div>
              )}
              {!hasMore && tournaments.length > 0 && (
                <p className="text-gray-500 text-sm">
                  {t("common.noMoreResults")}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
