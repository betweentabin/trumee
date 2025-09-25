from typing import Any

from .models import PromptTemplate, Resume


class _SafeDict(dict):
    def __missing__(self, key):  # type: ignore[override]
        return ''


def render_prompt_with_resume(t: PromptTemplate, r: Resume) -> str:
    exps = [
        {
            'company': e.company,
            'position': e.position or '',
            'achievements': e.achievements or '',
        }
        for e in r.experiences.all().order_by('order')
    ]
    ctx = _SafeDict(
        resume_title=r.title,
        resume_description=r.description,
        objective=r.objective,
        skills=r.skills,
        self_pr=r.self_pr,
        desired_job=r.desired_job,
        desired_industries=", ".join(r.desired_industries or []),
        desired_locations=", ".join(r.desired_locations or []),
        experiences="\n".join([f"{x['company']} / {x['position']} / {x['achievements'][:100]}" for x in exps])
    )
    try:
        return t.template_text.format_map(ctx)
    except Exception:
        return t.template_text

