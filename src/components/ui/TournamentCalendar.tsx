'use client';

import { useMemo, useState } from 'react';
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
  parseISO
} from 'date-fns';
import { Tournament } from '@/types';
import Badge from './Badge';

interface TournamentCalendarProps {
  tournaments: Tournament[];
  className?: string;
}

export function TournamentCalendar({ tournaments, className }: TournamentCalendarProps) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getTournamentsForDate = (date: Date) => {
    return tournaments.filter((tournament) => {
      const startDate = parseISO(tournament.startDate);
      const endDate = parseISO(tournament.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  const selectedDateTournaments = selectedDate 
    ? getTournamentsForDate(selectedDate) 
    : [];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className={className}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.previousMonth', 'Previous month')}
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
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.nextMonth', 'Next month')}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
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
          {days.map((day, dayIdx) => {
            const dayTournaments = getTournamentsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
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

      {/* Selected date tournaments */}
      {selectedDate && (
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
                  href={`/main/tournaments/${tournament.id}`}
                  className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(parseISO(tournament.startDate), 'MMM d')} - {format(parseISO(tournament.endDate), 'MMM d, yyyy')}
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
