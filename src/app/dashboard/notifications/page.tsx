'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Badge, Loading } from '@/components/ui';
import { notificationService } from '@/services';
import { Notification } from '@/types';
import { formatRelativeTime } from '@/utils/date';
import { useInfiniteScroll } from '@/hooks';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async (page: number) => {
    const response = await notificationService.getNotifications({ page, pageSize: PAGE_SIZE });
    const resData = response.data as Record<string, unknown>;
    
    let notificationData: Notification[] = [];
    let totalPages = 1;
    let hasMoreData = false;
    
    if (Array.isArray(resData)) {
      notificationData = resData;
    } else if (resData?.data && Array.isArray(resData.data)) {
      notificationData = resData.data as Notification[];
      totalPages = (resData.totalPages as number) || 1;
    } else if (resData?.items && Array.isArray(resData.items)) {
      notificationData = resData.items as Notification[];
      hasMoreData = (resData.hasMore as boolean) || (resData.page as number) < (resData.totalPages as number);
      totalPages = (resData.totalPages as number) || 1;
    } else if (typeof resData?.data === 'object' && resData.data !== null) {
      const nestedData = resData.data as Record<string, unknown>;
      if (nestedData.items && Array.isArray(nestedData.items)) {
        notificationData = nestedData.items as Notification[];
        hasMoreData = (nestedData.hasMore as boolean) || (nestedData.page as number) < (nestedData.totalPages as number);
        totalPages = (nestedData.totalPages as number) || 1;
      }
    }
    
    return {
      items: notificationData,
      hasMore: hasMoreData || page < totalPages,
      totalPages,
    };
  }, []);

  const {
    items: notifications,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    sentinelRef,
    retry,
    reset,
  } = useInfiniteScroll<Notification>({
    fetchData: fetchNotifications,
  });

  // Merge local changes with hook items
  const mergedNotifications = notifications.map(n => {
    const local = localNotifications.find(l => l.id === n.id);
    return local || n;
  });

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setLocalNotifications(prev => {
        const existing = prev.find(n => n.id === id);
        if (existing) {
          return prev.map(n => n.id === id ? { ...n, isRead: true } : n);
        }
        const original = notifications.find(n => n.id === id);
        if (original) {
          return [...prev, { ...original, isRead: true }];
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setLocalNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      reset();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'SUCCESS':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'WARNING':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'ERROR':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'TOURNAMENT':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        );
      case 'REGISTRATION':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'INVITATION':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const unreadCount = mergedNotifications.filter(n => !n.isRead).length;

  if (isLoading && notifications.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('common.error')}
            </h3>
            <p className="text-gray-500 mb-4">{error.message}</p>
            <Button variant="primary" onClick={retry}>
              {t('common.retry')}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('notifications.title')}
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                {t('notifications.unread', { count: unreadCount })}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead} className="self-start sm:self-auto">
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {mergedNotifications.length > 0 ? (
          <div className="space-y-4">
            {mergedNotifications.map((notification) => (
              <Card 
                key={notification.id}
                className={!notification.isRead ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
              >
                <CardContent className="py-4">
                  <div className="flex gap-4">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <Badge variant="info" size="sm">
                              {t('notifications.new', 'New')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            {t('notifications.markRead', 'Mark as read')}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                          onClick={() => handleDelete(notification.id)}
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div 
                ref={sentinelRef} 
                className="flex justify-center py-8"
              >
                {isFetchingMore && <Loading size="md" />}
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('notifications.noNotifications')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t('notifications.noNotificationsDesc', 'You\'re all caught up!')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
