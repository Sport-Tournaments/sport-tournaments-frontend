import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MatchManagement from "../MatchManagement";
import { groupService } from "@/services";

const stableT = vi.hoisted(
  () => (key: string, fallback?: string) => fallback ?? key,
);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: stableT,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  Handle: () => null,
  Controls: () => <div data-testid="react-flow-controls" />,
  Position: { Left: "left", Right: "right" },
}));

vi.mock("@/services", () => ({
  groupService: {
    getMatches: vi.fn(),
    getGroups: vi.fn(),
  },
}));

describe("MatchManagement", () => {
  it("lets organizers create the provisional knockout shell before groups finish", async () => {
    vi.mocked(groupService.getMatches).mockResolvedValue({
      success: true,
      data: {
        bracketType: "GROUPS_PLUS_KNOCKOUT",
        advancingTeamsPerGroup: 1,
        teams: [
          { id: "reg-1", name: "Team 1" },
          { id: "reg-2", name: "Team 2" },
        ],
        matches: [
          {
            id: "grp_A_1",
            round: 1,
            matchNumber: 1,
            groupLetter: "A",
            team1Id: "reg-1",
            team2Id: "reg-2",
            status: "PENDING",
          },
        ],
        playoffRounds: [],
      },
    } as any);
    vi.mocked(groupService.getGroups).mockResolvedValue({
      success: true,
      data: [
        {
          id: "group-1",
          tournamentId: "tournament-1",
          groupLetter: "A",
          teams: ["reg-1", "reg-2"],
        },
      ],
    } as any);

    render(
      <MatchManagement
        tournamentId="tournament-1"
        isOrganizer
        ageGroupFormat="GROUPS_PLUS_KNOCKOUT"
      />,
    );

    const createButton = await screen.findByRole("button", {
      name: /Create Provisional Knockout Bracket/i,
    });
    expect(createButton).not.toBeDisabled();
    expect(screen.queryByText(/Complete all group stage matches/i)).toBeNull();
  });

  it("shows a schedulable provisional knockout bracket before group matches finish", async () => {
    vi.mocked(groupService.getMatches).mockResolvedValue({
      success: true,
      data: {
        bracketType: "GROUPS_PLUS_KNOCKOUT",
        advancingTeamsPerGroup: 1,
        teams: [
          { id: "reg-1", name: "Team 1" },
          { id: "reg-2", name: "Team 2" },
        ],
        matches: [
          {
            id: "grp_A_1",
            round: 1,
            matchNumber: 1,
            groupLetter: "A",
            team1Id: "reg-1",
            team2Id: "reg-2",
            status: "PENDING",
          },
        ],
        playoffRounds: [
          {
            roundNumber: 1,
            roundName: "Semi-Finals",
            matches: [
              {
                id: "ko-1",
                round: 1,
                matchNumber: 1,
                status: "PENDING",
              },
              {
                id: "ko-2",
                round: 1,
                matchNumber: 1,
                status: "PENDING",
              },
            ],
          },
        ],
        placementBrackets: [
          {
            key: "placement-1-4",
            label: "1-4",
            rangeStart: 1,
            rangeEnd: 4,
            playoffRounds: [
              {
                roundNumber: 1,
                roundName: "1-4",
                matches: [
                  {
                    id: "placement-1-4-r1-m1",
                    round: 1,
                    matchNumber: 1,
                    status: "PENDING",
                    team1SourceSlot: "A1",
                    team2SourceSlot: "B2",
                  },
                ],
              },
            ],
            children: {
              winners: {
                key: "placement-1-2",
                label: "1-2",
                rangeStart: 1,
                rangeEnd: 2,
                playoffRounds: [
                  {
                    roundNumber: 1,
                    roundName: "1-2",
                    matches: [
                      {
                        id: "placement-1-2-r1-m1",
                        round: 1,
                        matchNumber: 1,
                        status: "PENDING",
                      },
                    ],
                  },
                ],
              },
              losers: {
                key: "placement-3-4",
                label: "3-4",
                rangeStart: 3,
                rangeEnd: 4,
                playoffRounds: [
                  {
                    roundNumber: 1,
                    roundName: "3-4",
                    matches: [
                      {
                        id: "placement-3-4-r1-m1",
                        round: 1,
                        matchNumber: 1,
                        status: "PENDING",
                      },
                    ],
                  },
                ],
              },
            },
          },
          {
            key: "placement-5-8",
            label: "5-8",
            rangeStart: 5,
            rangeEnd: 8,
            playoffRounds: [
              {
                roundNumber: 1,
                roundName: "5-8",
                matches: [
                  {
                    id: "placement-5-8-r1-m1",
                    round: 1,
                    matchNumber: 1,
                    status: "PENDING",
                    team1SourceSlot: "A2",
                    team2SourceSlot: "B4",
                  },
                ],
              },
            ],
            children: {
              winners: {
                key: "placement-5-6",
                label: "5-6",
                rangeStart: 5,
                rangeEnd: 6,
                playoffRounds: [
                  {
                    roundNumber: 1,
                    roundName: "5-6",
                    matches: [
                      {
                        id: "placement-5-6-r1-m1",
                        round: 1,
                        matchNumber: 1,
                        status: "PENDING",
                      },
                    ],
                  },
                ],
              },
              losers: {
                key: "placement-7-8",
                label: "7-8",
                rangeStart: 7,
                rangeEnd: 8,
                playoffRounds: [
                  {
                    roundNumber: 1,
                    roundName: "7-8",
                    matches: [
                      {
                        id: "placement-7-8-r1-m1",
                        round: 1,
                        matchNumber: 1,
                        status: "PENDING",
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      },
    } as any);
    vi.mocked(groupService.getGroups).mockResolvedValue({
      success: true,
      data: [
        {
          id: "group-1",
          tournamentId: "tournament-1",
          groupLetter: "A",
          teams: ["reg-1", "reg-2"],
        },
      ],
    } as any);

    render(
      <MatchManagement
        tournamentId="tournament-1"
        isOrganizer
        ageGroupFormat="GROUPS_PLUS_KNOCKOUT"
        matchPeriodType="TWO_HALVES"
        halfDurationMinutes={20}
        halfTimePauseMinutes={5}
        pauseBetweenMatchesMinutes={10}
        fieldsCount={1}
      />,
    );

    expect(await screen.findByText(/Provisional bracket/i)).toBeTruthy();
    expect(screen.getByText("Bracket Ranges")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "1-4" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "5-8" })).toBeTruthy();
    expect(screen.getByText("Places 1-4")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "1-2" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "3-4" })).toBeTruthy();
    expect(screen.queryByText("Semi-Finals")).toBeNull();
    expect(screen.getByText("0 / 1 group matches completed")).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: /Auto Schedule/i }),
    ).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Zoom in" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Zoom out" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Fit view" })).toHaveLength(2);
  });
});
