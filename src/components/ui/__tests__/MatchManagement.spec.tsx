import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  ReactFlow: ({ children, nodes = [], nodeTypes = {} }: { children?: React.ReactNode; nodes?: any[]; nodeTypes?: Record<string, React.ComponentType<any>> }) => (
    <div data-testid="react-flow">
      {nodes.map((node) => {
        const NodeComponent = nodeTypes[node.type];
        return NodeComponent ? <NodeComponent key={node.id} data={node.data} /> : null;
      })}
      {children}
    </div>
  ),
  Handle: () => null,
  Controls: () => <div data-testid="react-flow-controls" />,
  Position: { Left: "left", Right: "right" },
}));

vi.mock("@/services", () => ({
  groupService: {
    getMatches: vi.fn(),
    getGroups: vi.fn(),
    swapMatchTeams: vi.fn(),
  },
}));

describe("MatchManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("shows final group standings after all group scores are entered", async () => {
    vi.mocked(groupService.getMatches).mockResolvedValue({
      success: true,
      data: {
        bracketType: "GROUPS_ONLY",
        teams: [
          { id: "reg-1", name: "Alpha" },
          { id: "reg-2", name: "Bravo" },
          { id: "reg-3", name: "Charlie" },
          { id: "reg-4", name: "Delta" },
        ],
        matches: [
          {
            id: "grp_A_1",
            round: 1,
            matchNumber: 1,
            groupLetter: "A",
            team1Id: "reg-1",
            team2Id: "reg-2",
            team1Score: 3,
            team2Score: 0,
            status: "COMPLETED",
          },
          {
            id: "grp_B_1",
            round: 1,
            matchNumber: 1,
            groupLetter: "B",
            team1Id: "reg-3",
            team2Id: "reg-4",
            team1Score: 1,
            team2Score: 1,
            status: "COMPLETED",
          },
        ],
      },
    } as any);
    vi.mocked(groupService.getGroups).mockResolvedValue({
      success: true,
      data: [
        {
          id: "group-a",
          tournamentId: "tournament-1",
          groupLetter: "A",
          teams: ["reg-1", "reg-2"],
        },
        {
          id: "group-b",
          tournamentId: "tournament-1",
          groupLetter: "B",
          teams: ["reg-3", "reg-4"],
        },
      ],
    } as any);

    render(
      <MatchManagement
        tournamentId="tournament-1"
        isOrganizer
      />,
    );

    const finalStandings = await screen.findByRole("region", {
      name: /Final group standings/i,
    });

    expect(within(finalStandings).getByText("Final Group Standings")).toBeTruthy();
    expect(within(finalStandings).getByText("Alpha")).toBeTruthy();
    expect(within(finalStandings).getAllByText("Group A").length).toBeGreaterThan(0);
    expect(within(finalStandings).getByText("Charlie")).toBeTruthy();
    expect(within(finalStandings).getAllByText("Group B").length).toBeGreaterThan(0);
    expect(within(finalStandings).getByText(/All 2 group matches are completed/i)).toBeTruthy();
  });

  it("lets organizers swap provisional source slots before group matches finish", async () => {
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
                    team1Name: "A1",
                    team1SourceSlot: "A1",
                    team2Name: "B2",
                    team2SourceSlot: "B2",
                  },
                ],
              },
            ],
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
                    team1Name: "A2",
                    team1SourceSlot: "A2",
                    team2Name: "B4",
                    team2SourceSlot: "B4",
                  },
                ],
              },
            ],
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
    vi.mocked(groupService.swapMatchTeams).mockResolvedValue({
      success: true,
      data: { bracketUpdated: true },
    } as any);

    render(
      <MatchManagement
        tournamentId="tournament-1"
        isOrganizer
        ageGroupFormat="GROUPS_PLUS_KNOCKOUT"
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Swap A1" }));
    expect(screen.getByText(/Now click/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "5-8" }));
    fireEvent.click(screen.getByRole("button", { name: "Swap B4" }));

    await waitFor(() => {
      expect(groupService.swapMatchTeams).toHaveBeenCalledWith(
        "tournament-1",
        {
          sourceMatchId: "placement-1-4-r1-m1",
          sourceSlot: "team1",
          targetMatchId: "placement-5-8-r1-m1",
          targetSlot: "team2",
        },
        undefined,
      );
    });
  });

  it("lets organizers swap teams between pending placement bracket range tabs", async () => {
    vi.mocked(groupService.getMatches).mockResolvedValue({
      success: true,
      data: {
        bracketType: "GROUPS_PLUS_KNOCKOUT",
        advancingTeamsPerGroup: 1,
        teams: [
          { id: "reg-1", name: "Team 1" },
          { id: "reg-2", name: "Team 2" },
          { id: "reg-3", name: "Team 3" },
          { id: "reg-4", name: "Team 4" },
          { id: "reg-5", name: "Team 5" },
          { id: "reg-6", name: "Team 6" },
          { id: "reg-7", name: "Team 7" },
          { id: "reg-8", name: "Team 8" },
        ],
        matches: [
          {
            id: "grp_A_1",
            round: 1,
            matchNumber: 1,
            groupLetter: "A",
            team1Id: "reg-1",
            team2Id: "reg-2",
            team1Score: 1,
            team2Score: 0,
            winnerId: "reg-1",
            status: "COMPLETED",
          },
        ],
        playoffRounds: [],
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
                    team1Id: "reg-1",
                    team2Id: "reg-2",
                  },
                  {
                    id: "placement-1-4-r1-m2",
                    round: 1,
                    matchNumber: 2,
                    status: "PENDING",
                    team1Id: "reg-3",
                    team2Id: "reg-4",
                  },
                ],
              },
            ],
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
                    team1Id: "reg-5",
                    team2Id: "reg-6",
                  },
                  {
                    id: "placement-5-8-r1-m2",
                    round: 1,
                    matchNumber: 2,
                    status: "PENDING",
                    team1Id: "reg-7",
                    team2Id: "reg-8",
                  },
                ],
              },
            ],
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
          teams: ["reg-1", "reg-2", "reg-3", "reg-4", "reg-5", "reg-6", "reg-7", "reg-8"],
        },
      ],
    } as any);
    vi.mocked(groupService.swapMatchTeams).mockResolvedValue({
      success: true,
      data: { bracketUpdated: true },
    } as any);

    render(
      <MatchManagement
        tournamentId="tournament-1"
        isOrganizer
        ageGroupFormat="GROUPS_PLUS_KNOCKOUT"
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Swap Team 1" }));
    expect(screen.getByText(/Now click/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "5-8" }));
    expect(screen.getByText(/Now click/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Swap Team 8" }));

    await waitFor(() => {
      expect(groupService.swapMatchTeams).toHaveBeenCalledWith(
        "tournament-1",
        {
          sourceMatchId: "placement-1-4-r1-m1",
          sourceSlot: "team1",
          targetMatchId: "placement-5-8-r1-m2",
          targetSlot: "team2",
        },
        undefined,
      );
    });
  });

});
