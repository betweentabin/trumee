"""
通知システムユーティリティ
WebSocketとメール通知を統合管理
"""

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """統合通知サービス"""
    
    @staticmethod
    def send_scout_notification(scout):
        """
        スカウト通知を送信
        
        Args:
            scout: Scout モデルインスタンス
        """
        # WebSocket通知
        NotificationService._send_websocket_notification(
            user_id=str(scout.seeker.id),
            notification_type='scout_notification',
            data={
                'scout': {
                    'id': str(scout.id),
                    'company_name': scout.company.company_name,
                    'message': scout.scout_message[:100],  # 最初の100文字
                    'scouted_at': scout.scouted_at.isoformat(),
                }
            }
        )
        
        # メール通知
        if scout.seeker.email:
            NotificationService._send_email_notification(
                recipient=scout.seeker.email,
                subject=f'{scout.company.company_name}からスカウトが届きました',
                template='emails/scout_notification.html',
                context={
                    'user_name': scout.seeker.full_name or scout.seeker.username,
                    'company_name': scout.company.company_name,
                    'scout_message': scout.scout_message,
                    'scout_url': f'{settings.FRONTEND_URL}/scouts/{scout.id}'
                }
            )
    
    @staticmethod
    def send_application_notification(application):
        """
        応募通知を送信（企業向け）
        
        Args:
            application: Application モデルインスタンス
        """
        # WebSocket通知
        NotificationService._send_websocket_notification(
            user_id=str(application.company.id),
            notification_type='application_notification',
            data={
                'application': {
                    'id': str(application.id),
                    'applicant_name': application.applicant.full_name or application.applicant.username,
                    'applied_at': application.applied_at.isoformat(),
                    'status': application.status,
                }
            }
        )
        
        # メール通知
        if application.company.email:
            NotificationService._send_email_notification(
                recipient=application.company.email,
                subject='新しい応募が届きました',
                template='emails/application_notification.html',
                context={
                    'company_name': application.company.company_name,
                    'applicant_name': application.applicant.full_name or application.applicant.username,
                    'application_url': f'{settings.FRONTEND_URL}/company/seekers-applied/{application.id}'
                }
            )
    
    @staticmethod
    def send_application_status_update(application):
        """
        応募ステータス更新通知（求職者向け）
        
        Args:
            application: Application モデルインスタンス
        """
        status_messages = {
            'viewed': '企業があなたの応募を確認しました',
            'accepted': '書類選考を通過しました',
            'interview': '面接が決定しました',
            'offered': '内定が出ました',
            'rejected': '選考結果のお知らせ',
            'hired': '採用が決定しました',
        }
        
        # WebSocket通知
        NotificationService._send_websocket_notification(
            user_id=str(application.applicant.id),
            notification_type='application_status_update',
            data={
                'application': {
                    'id': str(application.id),
                    'company_name': application.company.company_name,
                    'status': application.status,
                    'message': status_messages.get(application.status, '応募ステータスが更新されました'),
                }
            }
        )
        
        # メール通知
        if application.applicant.email:
            NotificationService._send_email_notification(
                recipient=application.applicant.email,
                subject=f'{application.company.company_name} - {status_messages.get(application.status, "応募ステータス更新")}',
                template='emails/application_status_update.html',
                context={
                    'user_name': application.applicant.full_name or application.applicant.username,
                    'company_name': application.company.company_name,
                    'status': application.get_status_display(),
                    'message': status_messages.get(application.status),
                    'application_url': f'{settings.FRONTEND_URL}/applications/{application.id}'
                }
            )
    
    @staticmethod
    def send_message_notification(message):
        """
        メッセージ通知を送信
        
        Args:
            message: Message モデルインスタンス
        """
        # WebSocket通知
        NotificationService._send_websocket_notification(
            user_id=str(message.receiver.id),
            notification_type='message_notification',
            data={
                'message': {
                    'id': str(message.id),
                    'sender_name': message.sender.full_name or message.sender.company_name or message.sender.username,
                    'subject': message.subject or 'メッセージ',
                    'content': message.content[:100],  # 最初の100文字
                    'created_at': message.created_at.isoformat(),
                }
            }
        )
        
        # メール通知
        if message.receiver.email:
            NotificationService._send_email_notification(
                recipient=message.receiver.email,
                subject=f'新しいメッセージ: {message.subject or "メッセージが届きました"}',
                template='emails/message_notification.html',
                context={
                    'receiver_name': message.receiver.full_name or message.receiver.company_name or message.receiver.username,
                    'sender_name': message.sender.full_name or message.sender.company_name or message.sender.username,
                    'subject': message.subject,
                    'content': message.content,
                    'message_url': f'{settings.FRONTEND_URL}/messages/{message.id}'
                }
            )
    
    @staticmethod
    def _send_websocket_notification(user_id, notification_type, data):
        """
        WebSocket経由で通知を送信
        
        Args:
            user_id: 通知を受け取るユーザーのID
            notification_type: 通知タイプ
            data: 通知データ
        """
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{user_id}',
                    {
                        'type': notification_type,
                        **data
                    }
                )
                logger.info(f'WebSocket notification sent to user {user_id}: {notification_type}')
            except Exception as e:
                logger.error(f'Failed to send WebSocket notification: {e}')
    
    @staticmethod
    def _send_email_notification(recipient, subject, template, context):
        """
        メール通知を送信
        
        Args:
            recipient: 受信者のメールアドレス
            subject: メールの件名
            template: メールテンプレートのパス
            context: テンプレートコンテキスト
        """
        try:
            # HTMLメールの内容を生成
            html_message = render_to_string(template, context)
            plain_message = strip_tags(html_message)
            
            # メール送信
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@trumeee.com',
                recipient_list=[recipient],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f'Email notification sent to {recipient}: {subject}')
        except Exception as e:
            logger.error(f'Failed to send email notification: {e}')


# 簡易的な通知送信関数（既存コードとの互換性のため）
def send_scout_notification(scout):
    """スカウト通知を送信"""
    NotificationService.send_scout_notification(scout)


def send_application_notification(application):
    """応募通知を送信"""
    NotificationService.send_application_notification(application)


def send_application_status_update(application):
    """応募ステータス更新通知を送信"""
    NotificationService.send_application_status_update(application)


def send_message_notification(message):
    """メッセージ通知を送信"""
    NotificationService.send_message_notification(message)