'use client';

import { useEffect, useState } from 'react';
import { ExtendedNotification } from '@/type';
import { useAppContext } from '@/context/AppContext';
import { NotificationService } from '@/service/useCase/notification.service';
import { ReadNotificationService } from '@/service/useCase/read-notification.service';

const Notifications = () => {
  const { userId, settingChangeFlag, setSettingChangeFlag } = useAppContext();
  const [notifications, setNotifications] = useState<ExtendedNotification[]>(
    []
  );

  const fetchNotification = async () => {
    if (!userId) return;
    const { notificationsWithReadFlag } =
      await NotificationService.fetchAllNotifications(userId);
    setNotifications(notificationsWithReadFlag);
  };

  useEffect(() => {
    fetchNotification();
  }, []);

  const color = (type: string = '') => {
    switch (type) {
      case 'all':
        return 'bg-gray-400';
      case 'individual':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!userId) return;
    await ReadNotificationService.createReadNotification(userId, id);
    setSettingChangeFlag(!settingChangeFlag);
    fetchNotification();
  };

  return (
    <div className="container mx-auto py-8 max-w-screen-md">
      <h1 className="text-3xl font-bold mb-6">お知らせ一覧</h1>
      <div className="grid gap-4">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`flex justify-between p-4 rounded shadow-md text-white ${color(
              notification.type
            )}`}
          >
            {notification.message}
            <span className="text-red-500">
              {notification.isRead ? null : (
                <button
                  className="bg-blue-700 border-black text-white px-2 py-1 rounded "
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  読みました
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;