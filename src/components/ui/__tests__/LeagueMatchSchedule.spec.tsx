import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LeagueMatchSchedule from '../LeagueMatchSchedule';
import type { BracketMatch } from '@/types';

const completedMatch: BracketMatch = {
  id: 'match-1',
  round: 1,
  matchNumber: 1,
  team1Id: 'team-1',
  team2Id: 'team-2',
  team1Score: 2,
  team2Score: 1,
  scheduledAt: '2026-06-24T10:00:00.000Z',
  fieldName: '1',
  status: 'COMPLETED',
};

describe('LeagueMatchSchedule', () => {
  it('keeps score and detail editing available after a score was saved', async () => {
    const user = userEvent.setup();
    const onScoreUpdate = vi.fn();
    const onSchedule = vi.fn();

    render(
      <LeagueMatchSchedule
        matches={[completedMatch]}
        teamNames={new Map([
          ['team-1', 'Team One'],
          ['team-2', 'Team Two'],
        ])}
        isOrganizer
        onScoreUpdate={onScoreUpdate}
        onSchedule={onSchedule}
      />,
    );

    await user.click(screen.getByRole('button', { name: /edit score/i }));
    const [teamOneScore] = screen.getAllByRole('spinbutton');
    await user.clear(teamOneScore);
    await user.type(teamOneScore, '3');
    await user.click(screen.getByRole('button', { name: /save score/i }));

    expect(onScoreUpdate).toHaveBeenCalledWith(
      'match-1',
      3,
      1,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    await user.click(screen.getByRole('button', { name: /edit details/i }));
    await user.clear(screen.getByPlaceholderText(/Field A/i));
    await user.type(screen.getByPlaceholderText(/Field A/i), 'Pitch 2');
    await user.click(screen.getByRole('button', { name: /save details/i }));

    expect(onSchedule).toHaveBeenCalledWith(
      'match-1',
      expect.any(String),
      'Pitch 2',
    );
  });
});
