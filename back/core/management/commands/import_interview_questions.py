import csv
import hashlib
from typing import Optional

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from core.models import InterviewQuestion


class Command(BaseCommand):
    help = 'Import interview/self_pr/resume questions from a CSV file into InterviewQuestion model.'

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument('--file', required=True, help='Path to CSV file')
        parser.add_argument('--encoding', default='utf-8', help='CSV encoding (e.g., cp932, shift_jis, utf-8)')
        parser.add_argument('--type', default='interview', choices=['interview', 'self_pr', 'resume', 'motivation'], help='Default question type if CSV lacks type column')
        parser.add_argument('--locale', default='ja-JP', help='Locale')
        parser.add_argument('--dry-run', action='store_true', help='Parse and show stats without writing')

    def handle(self, *args, **options):
        path = options['file']
        encoding = options['encoding']
        default_type = options['type']
        locale = options['locale']
        dry_run = options['dry_run']

        self.stdout.write(self.style.WARNING(f'Reading CSV: {path} (encoding={encoding})'))

        with open(path, 'r', encoding=encoding, errors='ignore', newline='') as f:
            reader = csv.DictReader(f)
            headers = [h.strip() for h in (reader.fieldnames or [])]
            self.stdout.write(self.style.NOTICE(f'Headers: {headers}'))

            # Heuristics for column mapping
            def pick(*cands):
                for c in cands:
                    if c in headers:
                        return c
                return None

            col_type = pick('type', '種類', '区分')
            col_category = pick('category', 'カテゴリ', 'Category')
            col_subcategory = pick('subcategory', 'サブカテゴリ', 'Subcategory')
            col_text = pick('text', '質問', 'Question', '設問')
            col_guide = pick('answer_guide', 'ガイド', '回答ガイド', 'Tips')
            col_difficulty = pick('difficulty', '難易度', 'Level')
            col_tags = pick('tags', 'タグ', 'Tags')

            created, updated, skipped = 0, 0, 0

            @transaction.atomic
            def upsert(row) -> Optional[InterviewQuestion]:
                nonlocal created, updated, skipped
                q_type = (row.get(col_type) or default_type).strip() if col_type else default_type
                category = (row.get(col_category) or '').strip() if col_category else ''
                subcategory = (row.get(col_subcategory) or '').strip() if col_subcategory else ''
                text = (row.get(col_text) or '').strip() if col_text else ''
                if not text:
                    skipped += 1
                    return None
                answer_guide = (row.get(col_guide) or '').strip() if col_guide else ''
                difficulty = (row.get(col_difficulty) or 'medium').strip().lower()
                if difficulty not in {'easy', 'medium', 'hard'}:
                    difficulty = 'medium'
                tags_raw = (row.get(col_tags) or '').strip()
                tags = [t.strip() for t in tags_raw.split(',') if t.strip()] if tags_raw else []

                # Build a stable key (hash) to detect duplicates
                key_src = f"{q_type}|{category}|{difficulty}|{text}"
                key = hashlib.sha1(key_src.encode('utf-8')).hexdigest()

                # Try to find existing record by same hash proxy (approximate via unique text filter)
                found = InterviewQuestion.objects.filter(type=q_type, category=category, difficulty=difficulty, text=text).first()
                if found:
                    # Update guide/tags/locale/source if changed
                    changed = False
                    if answer_guide and found.answer_guide != answer_guide:
                        found.answer_guide = answer_guide
                        changed = True
                    if tags and found.tags != tags:
                        found.tags = tags
                        changed = True
                    if found.locale != locale:
                        found.locale = locale
                        changed = True
                    if found.subcategory != subcategory:
                        found.subcategory = subcategory
                        changed = True
                    if changed and not dry_run:
                        found.save()
                        updated += 1
                    else:
                        skipped += 1
                    return found

                if dry_run:
                    created += 1
                    return None

                obj = InterviewQuestion.objects.create(
                    type=q_type,
                    category=category,
                    subcategory=subcategory,
                    text=text,
                    answer_guide=answer_guide,
                    difficulty=difficulty,
                    tags=tags,
                    locale=locale,
                    source='csv',
                    is_active=True,
                )
                created += 1
                return obj

            for row in reader:
                try:
                    upsert(row)
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f'Row error: {e} | row={row}'))
                    skipped += 1

        self.stdout.write(self.style.SUCCESS(f'Imported. created={created}, updated={updated}, skipped={skipped}'))

