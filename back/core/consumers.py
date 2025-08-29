import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocketコンシューマー - リアルタイム通知用
    """
    
    async def connect(self):
        """WebSocket接続時の処理"""
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'notifications_{self.user_id}'
        
        # ユーザーを通知グループに追加
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # 接続成功メッセージを送信
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'WebSocket connection established'
        }))
    
    async def disconnect(self, close_code):
        """WebSocket切断時の処理"""
        # ユーザーを通知グループから削除
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """クライアントからメッセージを受信した時の処理"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Ping-Pong for keeping connection alive
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            elif message_type == 'mark_read':
                # 通知を既読にする
                notification_id = data.get('notification_id')
                await self.mark_notification_read(notification_id)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
    
    # グループからメッセージを受信
    async def notification_message(self, event):
        """グループメッセージを処理してクライアントに送信"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
    
    async def scout_notification(self, event):
        """スカウト通知"""
        await self.send(text_data=json.dumps({
            'type': 'scout_notification',
            'scout': event['scout']
        }))
    
    async def application_notification(self, event):
        """応募通知"""
        await self.send(text_data=json.dumps({
            'type': 'application_notification',
            'application': event['application']
        }))
    
    async def message_notification(self, event):
        """メッセージ通知"""
        await self.send(text_data=json.dumps({
            'type': 'message_notification',
            'message': event['message']
        }))
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """通知を既読にする（データベース操作）"""
        # 実際の通知モデルがある場合はここで更新
        pass