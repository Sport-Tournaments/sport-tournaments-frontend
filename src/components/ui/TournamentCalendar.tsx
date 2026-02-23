'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
  eachHourOfInterval,
  startOfDay,
  endOfDay,
  getHours
} from 'date-fns';
import { Tournament } from '@/types';
import { getTournamentPublicPath } from '@/utils/helpers';
import Badge from './Badge';

type CalendarView = 'month' | 'week' | 'day';

interface TournamentCalendarProps {
  tournaments: Tournament[];
  className?: string;
}

export function TournamentCalendar({ tournaments, className }: TournamentCalendarProps) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>('month');
  const hasInitializedFromData = useRef(false);

  // Helper to safely parse ISO date strings
  const safeParseDateString = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    try {
      const parsed = parseISO(dateString);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (hasInitializedFromData.current || tournaments.length === 0) return;

    const validStartDates = tournaments
      .map((tournament) => {
        const start = tournament.startDate
          ?? tournament.ageGroups?.map(ag => ag.startDate).filter(Boolean).sort()[0]
          ?? null;
        return safeParseDateString(start);
      })
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (validStartDates.length === 0) return;

    const today = new Date();
    const nextOrCurrent = validStartDates.find((date) => date.getTime() >= today.getTime());
    const initialDate = nextOrCurrent ?? validStartDates[0];

    setCurrentDate(initialDate);
    setSelectedDate(initialDate);
    hasInitializedFromData.current = true;
  }, [tournaments]);

  // Get days for month view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Get days for week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  // Get hours for day view
  const dayHours = useMemo(() => {
    return eachHourOfInterval({ 
      start: startOfDay(currentDate), 
      end: endOfDay(currentDate) 
    });
  }, [currentDate]);

  const getEffectiveDates = (tournament: { startDate?: string | null; endDate?: string | null; ageGroups?: { startDate?: string | null; endDate?: string | null }[] }) => {
    const start = tournament.startDate
      ?? tournament.ageGroups?.map(ag => ag.startDate).filter(Boolean).sort()[0]
      ?? null;
    const end = tournament.endDate
      ?? tournament.ageGroups?.map(ag => ag.endDate).filter(Boolean).sort().reverse()[0]
      ?? start;
    return { start, end };
  };

  const getTournamentsForDate = (date: Date) => {
    return tournaments.filter((tournament) => {
      const { start, end } = getEffectiveDates(tournament);
      const startDate = safeParseDateString(start);
      const endDate = safeParseDateString(end || start);

      if (!startDate || !endDate) {
        return false;
      }

      return date >= startOfDay(startDate) && date <= endOfDay(endDate);
    });
  };

  const selectedDateTournaments = selectedDate 
    ? getTournamentsForDate(selectedDate) 
    : [];

  // Navigation handlers
  const handlePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Get header text based on view
  const getHeaderText = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  return (
    <div className={className}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {getHeaderText()}
        </h2>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border border-[var(--uefa-blue)] rounded-lg overflow-hidden mr-2 bg-white">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'month' 
                  ? 'bg-[var(--uefa-blue)] text-white' 
                  : 'bg-white text-[var(--uefa-blue)] hover:bg-[var(--uefa-blue)]/10'
              }`}
            >
              {t('calendar.month', 'Month')}
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm font-medium border-l border-[var(--uefa-blue)] transition-colors ${
                view === 'week' 
                  ? 'bg-[var(--uefa-blue)] text-white' 
                  : 'bg-white text-[var(--uefa-blue)] hover:bg-[var(--uefa-blue)]/10'
              }`}
            >
              {t('calendar.week', 'Week')}
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 text-sm font-medium border-l border-[var(--uefa-blue)] transition-colors ${
                view === 'day' 
                  ? 'bg-[var(--uefa-blue)] text-white' 
                  : 'bg-white text-[var(--uefa-blue)] hover:bg-[var(--uefa-blue)]/10'
              }`}
            >
              {t('calendar.day', 'Day')}
            </button>
          </div>

          <button
            onClick={handlePrev}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.previous', 'Previous')}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common.today', 'Today')}
          </button>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.next', 'Next')}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {monthDays.map((day, dayIdx) => {
              const dayTournaments = getTournamentsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isDayToday = isToday(day);

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative min-h-[80px] p-2 border-b border-r border-gray-200 text-left
                    transition-colors hover:bg-blue-50
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                    ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}
                    ${dayIdx % 7 === 6 ? 'border-r-0' : ''}
                  `}
                >
                  <time
                    dateTime={format(day, 'yyyy-MM-dd')}
                    className={`
                      flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                      ${isDayToday ? 'bg-blue-600 text-white' : ''}
                      ${isSelected && !isDayToday ? 'bg-gray-900 text-white' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </time>
                  
                  {dayTournaments.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayTournaments.slice(0, 2).map((tournament) => (
                        <div
                          key={tournament.id}
                          className="truncate text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded"
                          title={tournament.name}
                        >
                          {tournament.name}
                        </div>
                      ))}
                      {dayTournaments.length > 2 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayTournaments.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {weekDays.map((day) => {
              const isDayToday = isToday(day);
              return (
                <div key={day.toString()} className="py-3 text-center border-r border-gray-200 last:border-r-0">
                  <div className="text-xs font-semibold text-gray-500 uppercase">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`
                    mt-1 w-8 h-8 mx-auto flex items-center justify-center text-sm font-medium rounded-full
                    ${isDayToday ? 'bg-blue-600 text-white' : 'text-gray-900'}
                  `}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week grid */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDays.map((day) => {
              const dayTournaments = getTournamentsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    p-2 border-r border-gray-200 last:border-r-0 text-left
                    transition-colors hover:bg-blue-50 align-top
                    ${isSelected ? 'bg-blue-50' : 'bg-white'}
                  `}
                >
                  {dayTournaments.length > 0 ? (
                    <div className="space-y-2">
                      {dayTournaments.map((tournament) => (
                        <div
                          key={tournament.id}
                          className="p-2 bg-blue-100 text-blue-800 rounded text-xs"
                          title={tournament.name}
                        >
                          <div className="font-medium truncate">{tournament.name}</div>
                          <div className="text-blue-600 mt-0.5">{tournament.location}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-8">
                      {t('calendar.noEvents', 'No events')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Day header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className={`
              inline-flex items-center justify-center w-12 h-12 text-lg font-semibold rounded-full
              ${isToday(currentDate) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'}
            `}>
              {format(currentDate, 'd')}
            </div>
            <span className="ml-3 text-gray-600">{format(currentDate, 'EEEE')}</span>
          </div>

          {/* Day tournaments */}
          <div className="p-4 min-h-[400px] bg-white">
            {(() => {
              const dayTournaments = getTournamentsForDate(currentDate);
              if (dayTournaments.length === 0) {
                return (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>{t('calendar.noEventsToday', 'No tournaments scheduled for this day')}</p>
                    </div>
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  {dayTournaments.map((tournament) => (
                    <Link
                      key={tournament.id}
                      href={getTournamentPublicPath(tournament)}
                      className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {tournament.startDate && tournament.endDate ? (
                              <>{format(safeParseDateString(tournament.startDate)!, 'MMM d')} - {format(safeParseDateString(tournament.endDate)!, 'MMM d, yyyy')}</>
                            ) : (
                              <span className="text-gray-400">Date TBD</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {tournament.location}
                          </p>
                        </div>
                        <Badge variant={tournament.status === 'PUBLISHED' ? 'info' : 'default'}>
                          {tournament.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Selected date tournaments (for month and week views) */}
      {selectedDate && view !== 'day' && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {t('tournaments.eventsOn', 'Tournaments on')} {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          
          {selectedDateTournaments.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
              {t('tournaments.noTournamentsOnDate', 'No tournaments on this date')}
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={getTournamentPublicPath(tournament)}
                  className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {tournament.startDate && tournament.endDate ? (
                          <>{format(safeParseDateString(tournament.startDate)!, 'MMM d')} - {format(safeParseDateString(tournament.endDate)!, 'MMM d, yyyy')}</>
                        ) : (
                          <span className="text-gray-400">Date TBD</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {tournament.location}
                      </p>
                    </div>
                    <Badge variant={tournament.status === 'PUBLISHED' ? 'info' : 'default'}>
                      {tournament.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TournamentCalendar;
