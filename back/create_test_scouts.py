#!/usr/bin/env python
"""
テスト用スカウトデータを作成するスクリプト
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Django設定を読み込む
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'back.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import User, Scout

def create_test_scouts():
    """テスト用スカウトデータを作成"""
    
    print("🔍 テスト用スカウトデータを作成します...")
    
    # テストユーザーを取得
    try:
        # 求職者を取得
        seekers = User.objects.filter(role='user')
        if not seekers.exists():
            print("❌ 求職者が見つかりません。まずユーザーを作成してください。")
            return
        
        # 企業を取得
        companies = User.objects.filter(role='company')
        if not companies.exists():
            print("❌ 企業アカウントが見つかりません。まず企業を作成してください。")
            return
        
        print(f"✅ 求職者: {seekers.count()}人、企業: {companies.count()}社 見つかりました")
        
        # スカウトデータを作成
        scout_messages = [
            {
                'message': """
{name}様

はじめまして。{company_name}の採用担当です。

貴方のプロフィールを拝見し、弊社の事業に大きく貢献いただける方だと確信し、ご連絡させていただきました。

弊社では現在、新規プロジェクトの立ち上げに伴い、経験豊富なエンジニアを募集しております。
以下のような環境でお仕事をしていただきます：

・最新技術を活用した開発環境
・フレキシブルな勤務体制（リモート可）
・充実した福利厚生
・年収600万円〜（経験・スキルによる）

ぜひ一度、カジュアル面談でお話しさせていただければ幸いです。
ご検討のほど、よろしくお願いいたします。
                """,
                'status': 'sent'
            },
            {
                'message': """
{name}様

お世話になっております。{company_name}人事部です。

貴方のご経歴を拝見し、弊社のマネージャーポジションに最適な方だと感じ、スカウトをお送りさせていただきました。

【募集ポジション】
・エンジニアリングマネージャー
・プロジェクトマネージャー
・テクニカルリード

【待遇】
・年収700万円〜1000万円
・ストックオプション有り
・役職手当
・各種手当充実

ご興味がございましたら、ぜひ詳細についてお話しさせてください。
お返事お待ちしております。
                """,
                'status': 'viewed'
            },
            {
                'message': """
{name}様

突然のご連絡失礼いたします。
{company_name}でCTOを務めております。

貴方のスキルセットと経験が、まさに弊社が求めている人材像と合致しており、
ぜひお話しの機会をいただければと思い、ご連絡いたしました。

弊社は急成長中のスタートアップで、以下のような環境です：

・少数精鋭のチーム（現在15名）
・技術選定の自由度が高い
・プロダクト開発に集中できる環境
・フルリモートOK

まずはカジュアルにお茶でもしながら、お互いのことを知る機会を作れればと思います。
ご検討よろしくお願いいたします。
                """,
                'status': 'responded'
            }
        ]
        
        scouts_created = 0
        
        for seeker in seekers[:3]:  # 最初の3人の求職者にスカウトを送る
            for i, company in enumerate(companies[:3]):  # 最初の3社から
                if i < len(scout_messages):
                    scout_data = scout_messages[i]
                    
                    # 既存のスカウトをチェック
                    existing_scout = Scout.objects.filter(
                        company=company,
                        seeker=seeker
                    ).first()
                    
                    if existing_scout:
                        print(f"⏭️ {company.company_name} → {seeker.full_name}: 既に存在します")
                        continue
                    
                    # スカウトを作成
                    scout = Scout.objects.create(
                        company=company,
                        seeker=seeker,
                        scout_message=scout_data['message'].format(
                            name=seeker.full_name,
                            company_name=company.company_name
                        ),
                        status=scout_data['status']
                    )
                    
                    # ステータスに応じて日時を設定
                    if scout_data['status'] == 'viewed':
                        scout.viewed_at = datetime.now() - timedelta(hours=12)
                    elif scout_data['status'] == 'responded':
                        scout.viewed_at = datetime.now() - timedelta(days=1)
                        scout.responded_at = datetime.now() - timedelta(hours=6)
                    
                    scout.save()
                    scouts_created += 1
                    print(f"✅ スカウト作成: {company.company_name} → {seeker.full_name} ({scout_data['status']})")
        
        print(f"\n🎉 {scouts_created}件のスカウトを作成しました！")
        
        # 統計情報を表示
        total_scouts = Scout.objects.count()
        sent_scouts = Scout.objects.filter(status='sent').count()
        viewed_scouts = Scout.objects.filter(status='viewed').count()
        responded_scouts = Scout.objects.filter(status='responded').count()
        
        print(f"\n📊 スカウト統計:")
        print(f"  総数: {total_scouts}件")
        print(f"  未読: {sent_scouts}件")
        print(f"  既読: {viewed_scouts}件")
        print(f"  返信済み: {responded_scouts}件")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_test_scouts()