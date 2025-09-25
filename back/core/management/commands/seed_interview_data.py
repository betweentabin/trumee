from django.core.management.base import BaseCommand
from core.models import InterviewQuestion, PromptTemplate


INTERVIEW_QUESTIONS = [
    # basic
    {"type": "interview", "category": "basic", "text": "自己紹介をお願いします。", "difficulty": "easy", "answer_guide": "名前/経歴/現在/志望理由につながる要素を1-2分で。"},
    # motivation
    {"type": "interview", "category": "motivation", "text": "なぜ弊社を志望されたのですか？", "difficulty": "medium", "answer_guide": "企業研究の成果、価値観の合致、具体理由を3点程度。"},
    # personality
    {"type": "interview", "category": "personality", "text": "あなたの強みと弱みを教えてください。", "difficulty": "medium", "answer_guide": "強みは具体例とセット、弱みは改善努力も説明。"},
    # teamwork
    {"type": "interview", "category": "teamwork", "text": "チームで働く際に重視することは何ですか？", "difficulty": "medium", "answer_guide": "コミュニケーション/相互理解/具体的経験。"},
    # future
    {"type": "interview", "category": "future", "text": "5年後のキャリアビジョンを教えてください。", "difficulty": "hard", "answer_guide": "現実的かつ具体、成長プロセスと貢献を述べる。"},
    # stress
    {"type": "interview", "category": "stress", "text": "ストレスが高い状況でどのように対処しますか？", "difficulty": "medium", "answer_guide": "具体状況→対処→成果の順で。"},
    # experience (resume-related)
    {"type": "interview", "category": "experience", "text": "直近のプロジェクトでの役割と主な成果を教えてください。", "difficulty": "medium", "answer_guide": "STARで簡潔に。数値/具体例/学び。"},
    {"type": "interview", "category": "experience", "text": "最も困難だった課題とその解決方法は？", "difficulty": "medium", "answer_guide": "背景→課題→対応→結果。再現可能性も。"},
    # resume type (career sheet)
    {"type": "resume", "category": "summary", "text": "職務経歴の中で最も誇れる実績は何ですか？数値や具体例を交えて説明してください。", "difficulty": "medium"},
    {"type": "resume", "category": "skills", "text": "履歴書のスキル欄で強調したいスキルは何ですか？裏付けとなる事例は？", "difficulty": "medium"},
    {"type": "resume", "category": "challenge", "text": "これまでに直面した最大の課題と、それをどう乗り越えたかを教えてください。", "difficulty": "medium"},
    # self_pr type
    {"type": "self_pr", "category": "summary", "text": "あなたの強みを仕事の事例とともに1分で説明してください。", "difficulty": "medium"},
]


PROMPT_TEMPLATES = [
    {
        "name": "apply_reason_default_v1",
        "target": "apply_reason",
        "template_text": (
            "{resume_title}\n\n志望理由:\n"
            "1) 事業への共感: 貴社の事業/提供価値に共感した点\n"
            "2) スキルの活用: {skills} を活かし、{desired_job} として貢献可能な点\n"
            "3) 成長機会: 入社後に挑戦したい領域\n"
            "入社後の貢献: {experiences}\n"
        ),
        "description": "志望理由（1-2ページ）の叩き台。format_mapで埋め込み。",
        "is_active": True,
    },
    {
        "name": "self_pr_default_v1",
        "target": "self_pr",
        "template_text": (
            "自己PR:\n強み: {skills}\n実績: {experiences}\n今後の貢献: {desired_job} でのバリュー創出\n"
        ),
        "description": "自己PRの叩き台。",
        "is_active": True,
    },
]


class Command(BaseCommand):
    help = "Seed default interview questions and prompt templates (idempotent)"

    def handle(self, *args, **options):
        created_q, skipped_q = 0, 0
        for q in INTERVIEW_QUESTIONS:
            obj, was_created = InterviewQuestion.objects.get_or_create(
                type=q["type"], category=q.get("category", ""), text=q["text"],
                defaults={
                    "difficulty": q.get("difficulty", "medium"),
                    "answer_guide": q.get("answer_guide", ""),
                    "tags": q.get("tags", []),
                    "locale": q.get("locale", "ja-JP"),
                    "source": "seed",
                    "is_active": True,
                },
            )
            if was_created:
                created_q += 1
            else:
                skipped_q += 1

        created_t, skipped_t = 0, 0
        for t in PROMPT_TEMPLATES:
            obj, was_created = PromptTemplate.objects.get_or_create(
                name=t["name"],
                defaults={
                    "target": t["target"],
                    "template_text": t["template_text"],
                    "description": t.get("description", ""),
                    "is_active": t.get("is_active", True),
                },
            )
            if was_created:
                created_t += 1
            else:
                skipped_t += 1

        self.stdout.write(self.style.SUCCESS(
            f"Questions: created={created_q}, skipped={skipped_q}; Templates: created={created_t}, skipped={skipped_t}"
        ))

