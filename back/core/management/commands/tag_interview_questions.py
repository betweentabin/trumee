from django.core.management.base import BaseCommand, CommandParser
from typing import Dict, List, Tuple
import re

from core.models import InterviewQuestion


KEYWORD_TAG_MAP: List[Tuple[List[str], List[str]]] = [
    # Sales / Customer
    (["売上", "営業", "顧客", "受注", "提案", "クロージング", "プレゼン"], ["sales", "customer", "presentation"]),
    # Leadership / Management
    (["リーダー", "マネジメント", "部下", "育成", "OJT", "評価", "組織", "牽引", "巻き込"], ["leadership", "management"]),
    # Communication / Negotiation
    (["コミュニケーション", "交渉", "調整", "説明", "傾聴"], ["communication", "negotiation"]),
    # Problem solving / Improvement
    (["課題", "解決", "改善", "効率化", "再発防止"], ["problem_solving", "improvement"]),
    # Time / Project management
    (["納期", "スケジュール", "複数案件", "優先順位", "進捗", "管理"], ["time_management", "project_management"]),
    # Motivation / Culture / Vision
    (["モチベーション", "価値観", "企業理念", "ビジョン", "文化", "カルチャー"], ["motivation", "culture", "vision"]),
    # Flexibility / Mobility
    (["転勤", "海外勤務", "出張"], ["mobility", "global"]),
    # Career plan
    (["キャリア", "キャリアプラン", "5年後", "10年後"], ["career"]),
    # Work style / Work-life balance
    (["働き方", "ワークライフバランス", "残業", "休日"], ["workstyle", "work_life_balance"]),
    # Skills: English / IT
    (["英語", "ITスキル", "IT"] , ["english", "it"]),
    # Strategy / New Business / Competitor
    (["新規事業", "事業", "方針", "注力分野", "競合", "強み", "弱み"], ["strategy", "new_business", "competition"]),
    # Teamwork
    (["チーム", "役割", "協力"], ["teamwork"]),
    # Stress tolerance
    (["厳しい", "叱責", "怒られ", "ストレス"], ["stress_tolerance"]),
    # Reverse questions
    (["逆質問"], ["reverse"]),
    # HR conditions
    (["年収", "選考状況", "入社", "勤務開始", "勤務地", "副業", "兼業"], ["conditions", "availability"]),
]


def infer_tags(text: str) -> List[str]:
    t = text or ""
    tags: List[str] = []
    for keys, out_tags in KEYWORD_TAG_MAP:
        if any(k in t for k in keys):
            for ot in out_tags:
                if ot not in tags:
                    tags.append(ot)
    return tags


class Command(BaseCommand):
    help = "Add heuristic tags to InterviewQuestion based on Japanese keywords."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument('--type', default='interview', help='Filter by question type (default: interview)')
        parser.add_argument('--only-empty', action='store_true', help='Tag only records with empty tags')
        parser.add_argument('--dry-run', action='store_true', help='Show changes without saving')

    def handle(self, *args, **opts):
        qtype = opts['type']
        only_empty = opts['only_empty']
        dry_run = opts['dry_run']

        qs = InterviewQuestion.objects.filter(type=qtype, is_active=True)
        updated = 0
        skipped = 0
        total = qs.count()

        for q in qs.iterator():
            current = list(q.tags or [])
            if only_empty and current:
                skipped += 1
                continue
            new_tags = infer_tags(q.text)
            # Union current + new
            union = list({*current, *new_tags})
            if union != current:
                if not dry_run:
                    q.tags = union
                    q.save(update_fields=['tags', 'updated_at'])
                updated += 1
            else:
                skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f"Processed {total} items. updated={updated}, skipped={skipped}. dry_run={dry_run}"
        ))

