'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { BracketMatch, PlayoffRound } from '@/types';
import { formatDateTime } from '@/utils/date';

function formatFieldDisplay(fieldName: string): string {
  return /^\d+$/.test(fieldName.trim()) ? `Pitch ${fieldName.trim()}` : fieldName;
}

/* ─── Layout constants ───────────────────────────────────────────────────── */

const CARD_W   = 200;   // px – match-card width
const CARD_H   = 72;    // px – match-card height (two 35px rows + 2px divider)
const ACTION_H = 40;    // px – action bar height below card (organizer)
const NODE_H   = CARD_H + ACTION_H;
const V_GAP    = 32;    // px – vertical gap between cards in first round
const H_GAP    = 64;    // px – horizontal gap (connector zone)
const PAD      = 12;    // px – canvas padding (top / left)

// Finals-specific sizes
const CARD_LABEL_H    = 22;   // px – label line above a finals card ("1st vs 2nd")
const FEATURED_ROW_H  = 42;   // px – taller team row for the championship match
const FEATURED_CARD_H = FEATURED_ROW_H * 2 + 2;          // = 86
const FEATURED_NODE_H = CARD_LABEL_H + FEATURED_CARD_H + ACTION_H; // = 148
const LABELED_NODE_H  = CARD_LABEL_H + CARD_H + ACTION_H;          // = 134

const slotH = (r: number) => (NODE_H + V_GAP) * Math.pow(2, r);

/* ─── Time options ───────────────────────────────────────────────────────── */

const HH_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MM_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/* ─── Helpers ────────────────────────────────────────────────────────────── */

export interface DoubleEliminationBracketProps {
  playoffRounds: PlayoffRound[];
  teamNames?: Map<string, string> | Record<string, string>;
  isOrganizer?: boolean;
  onAdvance?: (matchId: string, teamId: string) => void;
  onScoreUpdate?: (matchId: string, t1: number, t2: number) => void;
  onSchedule?: (matchId: string, scheduledAt: string, fieldName?: string) => void;
  savingMatchId?: string | null;
  schedulingMatchId?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t?: any;
}

function resolveName(
  id: string | undefined,
  teamNames?: Map<string, string> | Record<string, string>,
): string {
  if (!id) return 'TBD';
  if (!teamNames) return id.slice(0, 8);
  if (teamNames instanceof Map) return teamNames.get(id) ?? id.slice(0, 8);
  return (teamNames as Record<string, string>)[id] ?? id.slice(0, 8);
}

/* ─── Node data type ─────────────────────────────────────────────────────── */

interface MatchNodeData extends Record<string, unknown> {
  match: BracketMatch;
  teamNames?: Map<string, string> | Record<string, string>;
  isOrganizer?: boolean;
  onAdvance?: (matchId: string, teamId: string) => void;
  onScoreUpdate?: (matchId: string, t1: number, t2: number) => void;
  onSchedule?: (matchId: string, scheduledAt: string, fieldName?: string) => void;
  savingMatchId?: string | null;
  schedulingMatchId?: string | null;
  /** Label shown above the card in finals rounds (e.g. "1st vs 2nd") */
  cardLabel?: string;
  /** If true, renders a larger championship-style card */
  featured?: boolean;
}

type MatchFlowNode = Node<MatchNodeData, 'match'>;

/* ─── Custom React Flow node ─────────────────────────────────────────────── */

function MatchNode({ data }: NodeProps<MatchFlowNode>) {
  const {
    match, teamNames, isOrganizer,
    onAdvance, onScoreUpdate, onSchedule,
    savingMatchId, schedulingMatchId,
  } = data;

  const { cardLabel, featured } = data;
  const t1Name = resolveName(match.team1Id, teamNames);
  const t2Name = resolveName(match.team2Id, teamNames);
  const isCompleted = match.status === 'COMPLETED';
  const isT1Win     = isCompleted && match.winnerId === match.team1Id;
  const isT2Win     = isCompleted && match.winnerId === match.team2Id;
  const hasScore    = match.team1Score != null && match.team2Score != null;
  const isSaving    = savingMatchId === match.id;
  const isScheduling = schedulingMatchId === match.id;
  const ROW_H        = featured ? FEATURED_ROW_H : (CARD_H - 2) / 2;
  const effectiveCardH = featured ? FEATURED_CARD_H : CARD_H;

  const _todayDate = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })();
  const _todayHH   = String(new Date().getHours()).padStart(2, '0');
  const existingDate = match.scheduledAt ? match.scheduledAt.slice(0, 10) : _todayDate;
  const existingHH   = match.scheduledAt ? match.scheduledAt.slice(11, 13) : _todayHH;
  const existingMM   = match.scheduledAt ? match.scheduledAt.slice(14, 16) : '00';

  const [scoreModal,   setScoreModal]   = useState({ open: false, score1: '', score2: '' });
  const [detailsModal, setDetailsModal] = useState({ open: false, date: existingDate, hh: existingHH, mm: existingMM, fieldName: match.fieldName ?? '' });

  const handleScoreSave = () => {
    if (onScoreUpdate) onScoreUpdate(match.id, Number(scoreModal.score1), Number(scoreModal.score2));
    setScoreModal(s => ({ ...s, open: false }));
  };
  const handleDetailsSave = () => {
    if (!detailsModal.date || !onSchedule) return;
    onSchedule(match.id, `${detailsModal.date}T${detailsModal.hh}:${detailsModal.mm}:00.000Z`, detailsModal.fieldName || undefined);
    setDetailsModal(s => ({ ...s, open: false }));
  };

  const handleStyle: React.CSSProperties = {
    // Centre handle on the card row area (account for optional label above the card)
    top: (cardLabel ? CARD_LABEL_H : 0) + effectiveCardH / 2,
    width: 6,
    height: 6,
    opacity: 0,
  };

  return (
    /* nopan + nodrag + z-index: sit above the react-flow__pane (z-index:1) */
    <div className="nopan nodrag" style={{ width: CARD_W, position: 'relative', zIndex: 2 }}>
      <Handle type="target" position={Position.Left}  style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />

      {/* ── Finals label (e.g. "1st vs 2nd") ── */}
      {cardLabel && (
        <div
          style={{ height: CARD_LABEL_H }}
          className={`flex items-center justify-center text-[11px] font-bold uppercase tracking-widest ${
            featured ? 'text-yellow-600' : 'text-gray-500'
          }`}
        >
          {featured && (
            <svg className="w-3 h-3 mr-1 flex-shrink-0 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
          {cardLabel}
        </div>
      )}

      {/* ── Date / field meta (above the card) ── */}
      {(match.scheduledAt || match.fieldName) && (
        <div
          className="nopan nodrag flex items-center gap-1 mb-1"
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          {match.scheduledAt && (
            <span className="text-[10px] text-gray-400 truncate flex-1 leading-none">{formatDateTime(match.scheduledAt)}</span>
          )}
          {match.fieldName && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[#e0f7ff] text-[#0090c7] rounded font-medium flex-shrink-0 leading-none">{formatFieldDisplay(match.fieldName)}</span>
          )}
        </div>
      )}

      {/* ── Card ── */}
      <div
        style={{ height: effectiveCardH }}
        className={`rounded-lg border overflow-hidden ${
          featured
            ? 'border-yellow-400 shadow-md shadow-yellow-100'
            : match.status === 'IN_PROGRESS'
            ? 'border-yellow-400 shadow-sm'
            : 'border-gray-300 shadow-sm'
        }`}
      >
        {/* Team 1 */}
        <div
          style={{ height: ROW_H }}
          onClick={() => { if (isOrganizer && match.team1Id && !isCompleted && onAdvance) onAdvance(match.id, match.team1Id!); }}
          className={`flex items-center gap-1.5 px-2.5 transition-colors ${
            isT1Win
              ? 'bg-[#1e3a5f] text-white font-semibold cursor-default'
              : match.team1Id && isOrganizer && !isCompleted
              ? 'bg-white text-gray-700 hover:bg-[#dbeafe] cursor-pointer'
              : 'bg-white text-gray-400 cursor-default'
          }`}
        >
          {isT1Win && (
            <svg className="w-3 h-3 flex-shrink-0 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
          <span className="flex-1 text-[11px] font-medium truncate leading-none">{t1Name}</span>
          {hasScore && <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${isT1Win ? 'text-white' : 'text-gray-800'}`}>{match.team1Score}</span>}
        </div>

        <div className="border-t border-gray-200" />

        {/* Team 2 */}
        <div
          style={{ height: ROW_H }}
          onClick={() => { if (isOrganizer && match.team2Id && !isCompleted && onAdvance) onAdvance(match.id, match.team2Id!); }}
          className={`flex items-center gap-1.5 px-2.5 transition-colors ${
            isT2Win
              ? 'bg-[#1e3a5f] text-white font-semibold cursor-default'
              : match.team2Id && isOrganizer && !isCompleted
              ? 'bg-white text-gray-700 hover:bg-[#dbeafe] cursor-pointer'
              : 'bg-white text-gray-400 cursor-default'
          }`}
        >
          {isT2Win && (
            <svg className="w-3 h-3 flex-shrink-0 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
          <span className="flex-1 text-[11px] font-medium truncate leading-none">{t2Name}</span>
          {hasScore && <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${isT2Win ? 'text-white' : 'text-gray-800'}`}>{match.team2Score}</span>}
        </div>
      </div>

      {/* ── Action bar (organizer only, pending/in-progress) ── */}
      {isOrganizer && !isCompleted && (
        <div
          className="nopan nodrag flex flex-col gap-1 mt-1.5"
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Buttons row */}
          <div className="flex items-center gap-1.5">
            {onScoreUpdate && (
              <button
                disabled={isSaving}
                onPointerDown={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); setScoreModal({ open: true, score1: String(match.team1Score ?? 0), score2: String(match.team2Score ?? 0) }); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#dbeafe] text-[#1e3a5f] hover:bg-blue-100 disabled:opacity-50 transition-colors border border-blue-200"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                {isSaving ? '…' : 'Score'}
              </button>
            )}
            {onSchedule && (
              <button
                disabled={isScheduling}
                onPointerDown={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); setDetailsModal({ open: true, date: existingDate, hh: existingHH, mm: existingMM, fieldName: match.fieldName ?? '' }); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#e0f7ff] text-[#0090c7] hover:bg-[#c0edf9] disabled:opacity-50 transition-colors border border-[#00a8e8]/30"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {isScheduling ? '…' : 'Details'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Score modal (portal escapes the RF transform context) ── */}
      {scoreModal.open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Enter Score</h3>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">{t1Name}</label>
                <input type="number" min="0" value={scoreModal.score1}
                  onChange={e => setScoreModal(s => ({ ...s, score1: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f]" placeholder="0" />
              </div>
              <span className="text-gray-400 font-medium mt-5">-</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">{t2Name}</label>
                <input type="number" min="0" value={scoreModal.score2}
                  onChange={e => setScoreModal(s => ({ ...s, score2: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f]" placeholder="0" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setScoreModal(s => ({ ...s, open: false }))} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleScoreSave} disabled={isSaving}
                className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#152a45] disabled:opacity-50">
                {isSaving ? 'Saving…' : 'Save Score'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── Details modal (portal escapes the RF transform context) ── */}
      {detailsModal.open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Match Details</h3>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input type="date" value={detailsModal.date}
                  onChange={e => setDetailsModal(s => ({ ...s, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Time</label>
                <div className="flex gap-2">
                  <select value={detailsModal.hh} onChange={e => setDetailsModal(s => ({ ...s, hh: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]">
                    {HH_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="self-center text-gray-500 font-medium">:</span>
                  <select value={detailsModal.mm} onChange={e => setDetailsModal(s => ({ ...s, mm: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]">
                    {MM_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Field (optional)</label>
                <input type="text" value={detailsModal.fieldName}
                  onChange={e => setDetailsModal(s => ({ ...s, fieldName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="e.g. Pitch 1" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDetailsModal(s => ({ ...s, open: false }))} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleDetailsSave} disabled={isScheduling || !detailsModal.date}
                className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#152a45] disabled:opacity-50">
                {isScheduling ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

/* nodeTypes MUST be defined outside any component to remain stable across renders */
const nodeTypes = { match: MatchNode };

/* ─── Bracket section (Winners / Losers / SE) ────────────────────────────── */

interface BracketSectionProps {
  rounds: PlayoffRound[];
  label?: string;
  accentColor: string;
  edgeColor: string;
  teamNames?: Map<string, string> | Record<string, string>;
  isOrganizer?: boolean;
  onAdvance?: (matchId: string, teamId: string) => void;
  onScoreUpdate?: (matchId: string, t1: number, t2: number) => void;
  onSchedule?: (matchId: string, scheduledAt: string, fieldName?: string) => void;
  savingMatchId?: string | null;
  schedulingMatchId?: string | null;
}

function BracketSection({
  rounds, label, accentColor, edgeColor,
  teamNames, isOrganizer, onAdvance, onScoreUpdate, onSchedule, savingMatchId, schedulingMatchId,
}: BracketSectionProps) {
  const sorted = useMemo(() => [...rounds].sort((a, b) => a.roundNumber - b.roundNumber), [rounds]);
  const numRounds = sorted.length;
  const totalW = 2 * PAD + numRounds * CARD_W + Math.max(0, numRounds - 1) * H_GAP;

  const sharedData = useMemo(() => ({
    teamNames, isOrganizer, onAdvance, onScoreUpdate, onSchedule, savingMatchId, schedulingMatchId,
  }), [teamNames, isOrganizer, onAdvance, onScoreUpdate, onSchedule, savingMatchId, schedulingMatchId]);

  // Build nodes; the slot index (used for vertical spacing) increments only when
  // match count decreases — consecutive same-count rounds (e.g. WR Final → GF →
  // 3rd/4th) all share the same slot height so the finals cards stay level.
  const { nodes, totalH } = useMemo(() => {
    const slotIdxByRound: number[] = [];
    let si = -1;
    let prevCount = Infinity;
    sorted.forEach(round => {
      if (round.matches.length < prevCount) si++;
      prevCount = round.matches.length;
      slotIdxByRound.push(si);
    });

    const built: Node[] = sorted.flatMap((round, ri) => {
      const sh = slotH(slotIdxByRound[ri]);
      const isFeatured = round.roundNumber === 9000;
      const cardLabel  = round.roundNumber === 9000 ? '1st vs 2nd'
                       : round.roundNumber === 9001 ? '3rd vs 4th'
                       : undefined;
      const nodeH = isFeatured ? FEATURED_NODE_H
                  : cardLabel  ? LABELED_NODE_H
                  : NODE_H;
      return round.matches.map((match, mi) => ({
        id: match.id,
        type: 'match',
        position: {
          x: PAD + ri * (CARD_W + H_GAP),
          y: PAD + mi * sh + (sh - nodeH) / 2,
        },
        data: { match, ...sharedData, cardLabel, featured: isFeatured } as MatchNodeData,
        draggable: false,
        selectable: false,
        style: { pointerEvents: 'all' as const },
        width: CARD_W,
        height: nodeH,
      }));
    });
    const maxBottom = built.reduce((acc, n) => Math.max(acc, n.position.y + (n.height as number)), 0);
    return { nodes: built, totalH: maxBottom + PAD };
  }, [sorted, sharedData]);

  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = [];
    for (let ri = 0; ri < sorted.length - 1; ri++) {
      const currentRound = sorted[ri];
      const nextRound    = sorted[ri + 1];
      currentRound.matches.forEach((match, mi) => {
        // Use nextMatchId if populated; otherwise compute positionally:
        //   same match count in next round → 1:1 (losers drop-in rounds)
        //   fewer matches in next round    → halving: Math.floor(i / 2)
        // Exception: skip positional edge when BOTH adjacent rounds have 1 match
        // AND this is the second-to-last round — that is the GF→3rd/4th phantom
        // edge we must suppress. (WR Final→GF is at ri = length-3, not length-2.)
        let targetId: string | undefined;
        if (match.nextMatchId) {
          targetId = match.nextMatchId;
        } else if (
          currentRound.matches.length === 1 &&
          nextRound.matches.length === 1 &&
          ri === sorted.length - 2
        ) {
          targetId = undefined; // suppress GF → 3rd/4th phantom edge
        } else {
          const targetIdx = nextRound.matches.length < currentRound.matches.length
            ? Math.floor(mi / 2)
            : mi;
          targetId = nextRound.matches[targetIdx]?.id;
        }
        if (targetId) {
          result.push({
            id: `e-${match.id}-${targetId}`,
            source: match.id,
            target: targetId,
            type: 'smoothstep',
            style: { stroke: edgeColor, strokeWidth: 1.5 },
          });
        }
      });
    }
    return result;
  }, [sorted, edgeColor]);

  const rfWrapperRef = useRef<HTMLDivElement>(null);

  // Disable pointer-events on the RF pane and renderer overlays so node
  // buttons are clickable. Both elements sit above node content in z-order
  // (pane: z-index 1 outside transform context; renderer: full-cover abs div).
  useEffect(() => {
    const root = rfWrapperRef.current;
    if (!root) return;
    (['.react-flow__pane', '.react-flow__renderer'] as const).forEach(sel => {
      const el = root.querySelector(sel) as HTMLElement | null;
      if (el) el.style.pointerEvents = 'none';
    });
  }, [nodes]);

  if (sorted.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Section label – omitted when label is empty */}
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-bold uppercase tracking-widest ${accentColor}`}>{label}</span>
          <div className="flex-1 border-t border-dashed border-gray-200" />
        </div>
      )}

      {/* x-scroll wrapper; explicit height prevents y-scrollbar */}
      <div style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%' }}>
        {/* Round-name header row (same width as canvas, stays in sync on scroll) */}
        <div style={{ display: 'flex', width: totalW, paddingLeft: PAD, paddingRight: PAD, marginBottom: 6, flexShrink: 0 }}>
          {sorted.map((round, ri) => (
            <div key={round.roundNumber} style={{ width: CARD_W, flexShrink: 0, marginRight: ri < numRounds - 1 ? H_GAP : 0 }}
              className="text-center">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                {round.roundName || `Round ${round.roundNumber}`}
              </span>
            </div>
          ))}
        </div>

        {/* React Flow canvas – sized exactly to content */}
        <div ref={rfWrapperRef} style={{ width: totalW, height: totalH, flexShrink: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            panOnScroll={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: 'transparent' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────── */

export default function DoubleEliminationBracket({
  playoffRounds, teamNames, isOrganizer, onAdvance, onScoreUpdate, onSchedule,
  savingMatchId, schedulingMatchId,
}: DoubleEliminationBracketProps) {
  const winnersRounds    = playoffRounds.filter(r => r.bracket === 'winners');
  const losersRounds     = playoffRounds.filter(r => r.bracket === 'losers');
  const grandFinalRounds = playoffRounds.filter(r => r.bracket === 'grand_final');
  const untaggedRounds   = playoffRounds.filter(r => !r.bracket);

  const sharedProps = { teamNames, isOrganizer, onAdvance, onScoreUpdate, onSchedule, savingMatchId, schedulingMatchId };

  // Build the single combined round list:
  //   [WR rounds…] + [1st/2nd Place] + [3rd/4th Place]
  // The WR final's nextMatchId already points at the grand-final match so the
  // connector line is drawn correctly; the GF→3rd/4th edge is suppressed by
  // the edge-computation guard above.
  const grandFinalMatch  = grandFinalRounds[0]?.matches[0]  ?? null;

  // 3rd/4th source: explicit third_place bracket first, then losers bracket (DE),
  // then untagged rounds whose name contains 'third' or 'bronze' (legacy SE data)
  const thirdPlaceRounds = playoffRounds.filter(r => r.bracket === 'third_place');
  const legacySEThirdPlace = untaggedRounds.find(
    r => /third|bronze/i.test(r.roundName ?? '')
  );
  const thirdPlaceSource =
    thirdPlaceRounds.length > 0
      ? thirdPlaceRounds[thirdPlaceRounds.length - 1]
      : losersRounds.length > 0
      ? losersRounds[losersRounds.length - 1]
      : legacySEThirdPlace ?? null;
  const losersFinalMatch = thirdPlaceSource
    ? { ...thirdPlaceSource.matches[0], nextMatchId: undefined }
    : null;

  const baseRounds = winnersRounds.length > 0 ? winnersRounds : untaggedRounds;
  const lastBaseRound = baseRounds[baseRounds.length - 1];
  const lastWRMatch   = lastBaseRound?.matches[0] ?? null;

  const isGFSameAsWRFinal =
    lastWRMatch != null &&
    grandFinalMatch != null &&
    lastWRMatch.id === grandFinalMatch.id;

  // 1st/2nd Place match resolution (works for both DE and SE):
  //   DE with explicit GF same as WR final → use lastWRMatch
  //   DE with separate GF                  → use grandFinalMatch
  //   SE (no GF bracket at all)            → use lastWRMatch when it's a single-match round
  const resolvedGfMatch =
    isGFSameAsWRFinal                                  ? lastWRMatch
    : grandFinalMatch != null                          ? grandFinalMatch
    : lastBaseRound?.matches.length === 1              ? lastWRMatch
    : null;

  // Strip the last WR round from display when it will appear as the finals column
  const wrRoundsForDisplay = resolvedGfMatch != null ? baseRounds.slice(0, -1) : baseRounds;

  const combinedRounds: PlayoffRound[] = [
    ...wrRoundsForDisplay,
    ...(resolvedGfMatch  ? [{ roundNumber: 9000, roundName: '1st / 2nd Place', matches: [resolvedGfMatch],  bracket: 'winners' as const }] : []),
    ...(losersFinalMatch ? [{ roundNumber: 9001, roundName: '3rd / 4th Place', matches: [losersFinalMatch], bracket: 'winners' as const }] : []),
  ];

  return (
    <div className="p-1">
      <BracketSection
        rounds={combinedRounds}
        accentColor="text-[#1e3a5f]"
        edgeColor="#60a5fa"
        {...sharedProps}
      />
    </div>
  );
}
