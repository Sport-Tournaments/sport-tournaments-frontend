import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StandingsTable from '../StandingsTable';
import type { BracketMatch } from '@/types';

function mkMatch(t1: string, s1: number, t2: string, s2: number): BracketMatch {
  return {
    id: `m-${t1}-${t2}`,
    round: 1,
    matchNumber: 1,
    status: 'COMPLETED',
    team1Id: t1,
    team1Name: t1,
    team2Id: t2,
    team2Name: t2,
    team1Score: s1,
    team2Score: s2,
  };
}

describe('StandingsTable', () => {
  it('renders computed standings when no tiebreakOrder is provided', () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
      mkMatch('beta', 0, 'gamma', 0),
      mkMatch('alpha', 2, 'gamma', 2),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
      ['gamma', 'Gamma City'],
    ]);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        canEdit={false}
      />
    );

    const rows = screen.getAllByRole('row');
    const dataRows = rows.slice(1);
    expect(dataRows[0]).toHaveTextContent('Alpha FC');
    expect(dataRows[0]).toHaveTextContent('4');
    expect(dataRows[2]).toHaveTextContent('Beta Utd');
    expect(dataRows[2]).toHaveTextContent('1');
  });

  it('reorders teams via cascading shift when a dropdown is changed', async () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
      mkMatch('beta', 0, 'gamma', 0),
      mkMatch('alpha', 2, 'gamma', 2),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
      ['gamma', 'Gamma City'],
    ]);

    const onTiebreakerSet = vi.fn().mockResolvedValue(undefined);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        canEdit={true}
        onTiebreakerSet={onTiebreakerSet}
        tiebreakOrder={['alpha', 'beta', 'gamma']}
      />
    );

    // Enter edit mode
    fireEvent.click(screen.getByTestId('toggle-edit-mode'));

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(3);

    fireEvent.change(selects[2], { target: { value: '1' } });

    await waitFor(() => expect(onTiebreakerSet).toHaveBeenCalledOnce());

    const newOrder = onTiebreakerSet.mock.calls[0][0];
    expect(newOrder).toEqual(['gamma', 'alpha', 'beta']);
  });

  it('reorders with proper cascading when moving a team down multiple positions', async () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
      mkMatch('beta', 0, 'gamma', 0),
      mkMatch('alpha', 2, 'gamma', 2),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
      ['gamma', 'Gamma City'],
    ]);

    const onTiebreakerSet = vi.fn().mockResolvedValue(undefined);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        canEdit={true}
        onTiebreakerSet={onTiebreakerSet}
        tiebreakOrder={['gamma', 'alpha', 'beta']}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-edit-mode'));

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '3' } });

    await waitFor(() => expect(onTiebreakerSet).toHaveBeenCalledOnce());

    const newOrder = onTiebreakerSet.mock.calls[0][0];
    expect(newOrder).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('does not call onTiebreakerSet when selecting the same position', async () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
    ]);

    const onTiebreakerSet = vi.fn().mockResolvedValue(undefined);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        canEdit={true}
        onTiebreakerSet={onTiebreakerSet}
        tiebreakOrder={['alpha', 'beta']}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-edit-mode'));

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1' } });

    await waitFor(() => expect(onTiebreakerSet).not.toHaveBeenCalled());
  });

  it('marks advancing spots with green dot when highlightTopN is set', () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
      mkMatch('beta', 0, 'gamma', 0),
      mkMatch('alpha', 2, 'gamma', 2),
      mkMatch('delta', 1, 'epsilon', 0),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
      ['gamma', 'Gamma City'],
      ['delta', 'Delta SC'],
      ['epsilon', 'Epsilon XI'],
    ]);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        highlightTopN={2}
        canEdit={false}
      />
    );

    const dots = screen.getAllByTitle('Advancing spot');
    expect(dots.length).toBe(2);
  });

  it('shows no standings message when there are no matches', () => {
    render(
      <StandingsTable
        matches={[]}
        teamNames={new Map()}
        canEdit={false}
      />
    );

    expect(
      screen.getByText(/No standings data yet/i)
    ).toBeInTheDocument();
  });

  it('position dropdowns are hidden until edit mode is toggled', () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
    ]);
    const onTiebreakerSet = vi.fn().mockResolvedValue(undefined);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        canEdit={true}
        onTiebreakerSet={onTiebreakerSet}
        tiebreakOrder={['alpha', 'beta']}
      />
    );

    // Dropdowns should not be visible before clicking edit
    expect(screen.queryAllByRole('combobox').length).toBe(0);
    // Rank badges rendered as inline-flex rounded-full spans
    const rankBadgeEls = document.querySelectorAll<HTMLElement>('td span.inline-flex.rounded-full');
    expect(rankBadgeEls.length).toBe(2);
    const badgeTexts = Array.from(rankBadgeEls).map((el) => el.textContent?.trim());
    expect(badgeTexts).toContain('1');
    expect(badgeTexts).toContain('2');

    // Click edit button
    fireEvent.click(screen.getByTestId('toggle-edit-mode'));

    // Now dropdowns should appear
    expect(screen.getAllByRole('combobox').length).toBe(2);
  });

  it('move up button triggers cascading reorder', async () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
      mkMatch('beta', 0, 'gamma', 0),
      mkMatch('alpha', 2, 'gamma', 2),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
      ['gamma', 'Gamma City'],
    ]);

    const onTiebreakerSet = vi.fn().mockResolvedValue(undefined);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        canEdit={true}
        onTiebreakerSet={onTiebreakerSet}
        tiebreakOrder={['alpha', 'beta', 'gamma']}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-edit-mode'));

    // Move beta (position 2) up → should become [beta, alpha, gamma]
    fireEvent.click(screen.getByTestId('move-up-2'));

    await waitFor(() => expect(onTiebreakerSet).toHaveBeenCalledOnce());
    expect(onTiebreakerSet.mock.calls[0][0]).toEqual(['beta', 'alpha', 'gamma']);
  });

  it('move down button triggers cascading reorder', async () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
      mkMatch('beta', 0, 'gamma', 0),
      mkMatch('alpha', 2, 'gamma', 2),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
      ['gamma', 'Gamma City'],
    ]);

    const onTiebreakerSet = vi.fn().mockResolvedValue(undefined);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        canEdit={true}
        onTiebreakerSet={onTiebreakerSet}
        tiebreakOrder={['alpha', 'beta', 'gamma']}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-edit-mode'));

    // Move alpha (position 1) down → should become [beta, alpha, gamma]
    fireEvent.click(screen.getByTestId('move-down-1'));

    await waitFor(() => expect(onTiebreakerSet).toHaveBeenCalledOnce());
    expect(onTiebreakerSet.mock.calls[0][0]).toEqual(['beta', 'alpha', 'gamma']);
  });

  it('move up is disabled for first position and move down for last', () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
      mkMatch('beta', 0, 'gamma', 0),
      mkMatch('alpha', 2, 'gamma', 2),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
      ['gamma', 'Gamma City'],
    ]);
    const onTiebreakerSet = vi.fn().mockResolvedValue(undefined);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        canEdit={true}
        onTiebreakerSet={onTiebreakerSet}
        tiebreakOrder={['alpha', 'beta', 'gamma']}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-edit-mode'));

    expect(screen.getByTestId('move-up-1')).toBeDisabled();
    expect(screen.getByTestId('move-down-3')).toBeDisabled();
    expect(screen.getByTestId('move-down-2')).not.toBeDisabled();
  });

  it('reset button calls onTiebreakerSet with empty array', async () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
    ]);
    const onTiebreakerSet = vi.fn().mockResolvedValue(undefined);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        canEdit={true}
        onTiebreakerSet={onTiebreakerSet}
        tiebreakOrder={['alpha', 'beta']}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-edit-mode'));

    expect(screen.getByTestId('reset-override')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('reset-override'));

    await waitFor(() => expect(onTiebreakerSet).toHaveBeenCalledOnce());
    expect(onTiebreakerSet.mock.calls[0][0]).toEqual([]);
  });

  it('override badge is visible when tiebreakOrder is active', () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
    ]);
    const onTiebreakerSet = vi.fn().mockResolvedValue(undefined);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        canEdit={true}
        onTiebreakerSet={onTiebreakerSet}
        tiebreakOrder={['alpha', 'beta']}
      />
    );

    expect(screen.getByTestId('override-badge')).toBeInTheDocument();
    expect(screen.getByTestId('override-badge')).toHaveTextContent('Manual override');
  });

  it('override badge is hidden when no tiebreakOrder is set', () => {
    const matches: BracketMatch[] = [
      mkMatch('alpha', 3, 'beta', 1),
    ];
    const teamNames = new Map([
      ['alpha', 'Alpha FC'],
      ['beta', 'Beta Utd'],
    ]);
    const onTiebreakerSet = vi.fn().mockResolvedValue(undefined);

    render(
      <StandingsTable
        matches={matches}
        teamNames={teamNames}
        canEdit={true}
        onTiebreakerSet={onTiebreakerSet}
      />
    );

    expect(screen.queryByTestId('override-badge')).not.toBeInTheDocument();
  });
});
