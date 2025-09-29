from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    ListFlowable,
    ListItem,
    HRFlowable,
    Table,
    TableStyle,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from io import BytesIO
import json
from datetime import datetime
from django.core.cache import cache
from django.utils.html import escape

# Register Japanese font
pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))


def _format_multiline(text: str) -> str:
    """
    Escape user-provided text and preserve line breaks for ReportLab paragraphs.
    """
    if not text:
        return ''
    return escape(text).replace('\n', '<br/>')


def _draw_page_frame(canvas, doc):
    """Draw a light border frame on each page."""
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#DDDDDD'))
    canvas.setLineWidth(0.7)
    # Rectangle covering the content area
    x = doc.leftMargin - 6
    y = doc.bottomMargin - 6
    w = doc.width + 12
    h = doc.height + 12
    canvas.rect(x, y, w, h)
    canvas.restoreState()


def _render_resume_pdf(resume_data: dict) -> bytes:
    """
    Build the resume PDF according to the required layout.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    section_heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='HeiseiMin-W3',
        fontSize=14,
        textColor=colors.HexColor('#333333'),
        spaceBefore=18,
        spaceAfter=8,
    )
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['BodyText'],
        fontName='HeiseiMin-W3',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#333333'),
        spaceAfter=6,
    )
    meta_style = ParagraphStyle(
        'MetaText',
        parent=body_style,
        fontSize=9,
        textColor=colors.HexColor('#888888'),
        spaceAfter=4,
    )
    subheading_style = ParagraphStyle(
        'SubHeading',
        parent=styles['Heading3'],
        fontName='HeiseiMin-W3',
        fontSize=11,
        textColor=colors.HexColor('#333333'),
        spaceBefore=8,
        spaceAfter=4,
    )

    elements = []

    step5 = (resume_data or {}).get('step5', {}) or {}
    self_pr = step5.get('selfPR', '') or ''
    job_summary = step5.get('jobSummary', '') or ''
    summary_text = job_summary or self_pr

    if summary_text:
        elements.append(Paragraph('職務要約', section_heading_style))
        elements.append(HRFlowable(width='100%', thickness=0.6, color=colors.HexColor('#E5E5E5')))
        # Wrap summary in a bordered table to add ruled lines
        summary_tbl = Table(
            [[Paragraph(_format_multiline(summary_text), body_style)]],
            colWidths=[doc.width],
        )
        summary_tbl.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.7, colors.HexColor('#CCCCCC')),
            ('INNERGRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#E5E5E5')),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(summary_tbl)

    experiences = (resume_data or {}).get('step3', {}).get('experience') or []
    if experiences:
        elements.append(Paragraph('会社の経歴・実績', section_heading_style))
        elements.append(HRFlowable(width='100%', thickness=0.6, color=colors.HexColor('#E5E5E5')))
        for index, exp in enumerate(experiences):
            if index > 0:
                elements.append(Spacer(1, 6))

            company = (exp or {}).get('company', '') or ''
            position = (exp or {}).get('position', '') or ''
            start = (exp or {}).get('startDate', '') or ''
            end = (exp or {}).get('endDate', '') or ''
            description = (exp or {}).get('description', '') or ''
            achievements = [a for a in (exp or {}).get('achievements', []) or [] if a]

            header_parts = []
            if company:
                header_parts.append(f"<b>{escape(company)}</b>")
            if position:
                header_parts.append(escape(position))
            if header_parts:
                elements.append(Paragraph(' / '.join(header_parts), body_style))

            # Build a 2-column table with ruled lines: 期間 | 職務内容
            headers = [
                Paragraph('<b>期間</b>', body_style),
                Paragraph('<b>職務内容</b>', body_style),
            ]
            if start or end:
                if start and end:
                    period_text = f'{start}〜{end}'
                elif start and not end:
                    period_text = f'{start}〜現在'
                elif end and not start:
                    period_text = f'〜{end}'
                else:
                    period_text = ''
            else:
                period_text = ''

            period_para = Paragraph(escape(period_text) if period_text else '—', body_style)
            description_para = Paragraph(_format_multiline(description or ''), body_style)

            exp_tbl = Table(
                [headers, [period_para, description_para]],
                colWidths=[doc.width * 0.35, doc.width * 0.65],
            )
            exp_tbl.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.6, colors.HexColor('#CCCCCC')),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F5F5F5')),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elements.append(exp_tbl)

            if achievements:
                elements.append(Paragraph('実績', subheading_style))
                list_items = [
                    ListItem(
                        Paragraph(_format_multiline(item), body_style),
                        leftIndent=0,
                    )
                    for item in achievements
                ]
                elements.append(
                    ListFlowable(
                        list_items,
                        bulletType='bullet',
                        start='disc',
                        leftIndent=12,
                        bulletFontName='HeiseiMin-W3',
                        bulletFontSize=10,
                    )
                )

    if self_pr:
        elements.append(Paragraph('自己PR', section_heading_style))
        elements.append(HRFlowable(width='100%', thickness=0.6, color=colors.HexColor('#E5E5E5')))
        pr_tbl = Table(
            [[Paragraph(_format_multiline(self_pr), body_style)]],
            colWidths=[doc.width],
        )
        pr_tbl.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.7, colors.HexColor('#CCCCCC')),
            ('INNERGRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#E5E5E5')),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(pr_tbl)

    if not elements:
        elements.append(Paragraph('表示できる内容がありません。', body_style))

    doc.build(elements, onFirstPage=_draw_page_frame, onLaterPages=_draw_page_frame)
    pdf_content = buffer.getvalue()
    buffer.close()
    return pdf_content


def _rate_limit(request, key: str, limit: int, window_seconds: int) -> bool:
    """Simple IP+path-based rate limiter using Django cache.
    Returns True if within limit, False if over.
    """
    ip = request.META.get('REMOTE_ADDR') or 'unknown'
    cache_key = f"rl:{ip}:{key}"
    # First hit: set with TTL
    added = cache.add(cache_key, 1, timeout=window_seconds)
    if added:
        return True
    try:
        current = cache.incr(cache_key)
    except ValueError:
        # Key expired between add/incr; reset
        cache.set(cache_key, 1, timeout=window_seconds)
        return True
    return current <= limit


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow both authenticated and anonymous users
def download_resume_pdf(request):
    """
    Generate and download resume as PDF
    """
    try:
        # Rate limit: up to 10 downloads per minute per IP
        if not _rate_limit(request, 'download_resume_pdf', limit=10, window_seconds=60):
            return Response({'error': 'リクエストが多すぎます。しばらくしてからお試しください。'}, status=429)

        resume_data = request.data.get('resumeData', {})
        pdf_content = _render_resume_pdf(resume_data)

        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="resume_{datetime.now().strftime("%Y%m%d")}.pdf"'
        )
        return response

    except Exception as e:
        return Response(
            {'error': f'PDF生成中にエラーが発生しました: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def send_resume_pdf(request):
    """
    Send resume PDF via email
    """
    try:
        from django.core.mail import EmailMessage
        from django.conf import settings
        
        # Rate limit: up to 5 emails per 10 minutes per IP
        if not _rate_limit(request, 'send_resume_pdf', limit=5, window_seconds=600):
            return Response({'error': 'メール送信の試行回数が多すぎます。しばらくしてからお試しください。'}, status=429)

        resume_data = request.data.get('resumeData', {}) or {}
        email = (resume_data.get('step1', {}) or {}).get('email')
        
        if not email:
            return Response(
                {'error': 'メールアドレスが設定されていません'},
                status=status.HTTP_400_BAD_REQUEST
            )
        pdf_content = _render_resume_pdf(resume_data)

        email_message = EmailMessage(
            subject='職務経歴書PDFの送付',
            body='職務経歴書のPDFを添付いたしました。\n\nご確認ください。',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email]
        )
        
        # Attach PDF
        email_message.attach(
            f'resume_{datetime.now().strftime("%Y%m%d")}.pdf',
            pdf_content,
            'application/pdf'
        )
        
        # Send email
        email_message.send()
        
        return Response(
            {'message': 'PDFをメールで送信しました'},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': f'メール送信中にエラーが発生しました: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
