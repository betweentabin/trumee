import { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '@/app/redux/hooks';
import webSocketManager from '@/lib/websocket';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'scout' | 'application' | 'message' | 'status_update';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  // Reduxストアからユーザー情報を取得
  const user = useAppSelector(state => state.auth.user || state.authV2.user);

  // 通知を追加
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // スカウト通知ハンドラー
  const handleScoutNotification = useCallback((scout: any) => {
    const notification: Notification = {
      id: `scout_${scout.id}_${Date.now()}`,
      type: 'scout',
      title: '新しいスカウト',
      message: `${scout.company_name}からスカウトが届きました`,
      timestamp: scout.scouted_at || new Date().toISOString(),
      read: false,
      data: scout
    };
    
    addNotification(notification);
    
    // トースト通知
    toast.success(notification.message, {
      duration: 5000,
      position: 'top-right',
      icon: '💼',
    });
  }, [addNotification]);

  // 応募通知ハンドラー
  const handleApplicationNotification = useCallback((application: any) => {
    const notification: Notification = {
      id: `app_${application.id}_${Date.now()}`,
      type: 'application',
      title: '新しい応募',
      message: `${application.applicant_name}から応募が届きました`,
      timestamp: application.applied_at || new Date().toISOString(),
      read: false,
      data: application
    };
    
    addNotification(notification);
    
    // トースト通知
    toast.success(notification.message, {
      duration: 5000,
      position: 'top-right',
      icon: '📝',
    });
  }, [addNotification]);

  // メッセージ通知ハンドラー
  const handleMessageNotification = useCallback((message: any) => {
    const notification: Notification = {
      id: `msg_${message.id}_${Date.now()}`,
      type: 'message',
      title: '新しいメッセージ',
      message: `${message.sender_name}からメッセージが届きました`,
      timestamp: message.created_at || new Date().toISOString(),
      read: false,
      data: message
    };
    
    addNotification(notification);
    
    // トースト通知
    toast(notification.message, {
      duration: 5000,
      position: 'top-right',
      icon: '✉️',
    });
  }, [addNotification]);

  // 応募ステータス更新通知ハンドラー
  const handleApplicationStatusUpdate = useCallback((application: any) => {
    const notification: Notification = {
      id: `status_${application.id}_${Date.now()}`,
      type: 'status_update',
      title: '応募ステータス更新',
      message: application.message || `${application.company_name}の選考状況が更新されました`,
      timestamp: new Date().toISOString(),
      read: false,
      data: application
    };
    
    addNotification(notification);
    
    // トースト通知
    const icon = application.status === 'offered' ? '🎉' : 
                 application.status === 'rejected' ? '😔' : '📢';
    
    toast(notification.message, {
      duration: 5000,
      position: 'top-right',
      icon: icon,
    });
  }, [addNotification]);

  // 通知を既読にする
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // WebSocket経由で既読を送信
    webSocketManager.markAsRead(notificationId);
  }, []);

  // すべての通知を既読にする
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // 通知をクリア
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // WebSocket接続の設定
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    // WebSocket接続
    webSocketManager.connect(user.id, {
      onScoutNotification: handleScoutNotification,
      onApplicationNotification: handleApplicationNotification,
      onMessageNotification: handleMessageNotification,
      onApplicationStatusUpdate: handleApplicationStatusUpdate,
      onConnection: () => {
        setIsConnected(true);
        console.log('Notification WebSocket connected');
      },
      onDisconnection: () => {
        setIsConnected(false);
        console.log('Notification WebSocket disconnected');
      },
      onError: (error) => {
        console.error('Notification WebSocket error:', error);
      }
    });

    // クリーンアップ
    return () => {
      webSocketManager.disconnect();
    };
  }, [
    user?.id,
    handleScoutNotification,
    handleApplicationNotification,
    handleMessageNotification,
    handleApplicationStatusUpdate
  ]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}