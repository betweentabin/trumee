from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.urls import path
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from .models import (
    User, SeekerProfile, Resume, Experience,
    Application, Scout, Message, Payment,
    ActivityLog, MLModel, MLPrediction,
    InterviewQuestion, PromptTemplate,
)
from .utils_templates import render_prompt_with_resume
from .models import Resume


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """カスタムユーザー管理"""
    list_display = ['email', 'full_name', 'role', 'is_active', 'is_premium', 'created_at']
    list_filter = ['role', 'is_active', 'is_premium', 'gender']
    search_fields = ['email', 'full_name', 'company_name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('個人情報', {'fields': ('full_name', 'kana', 'gender', 'phone')}),
        ('企業情報', {'fields': ('company_name', 'capital', 'company_url')}),
        ('権限', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
        ('プレミアム', {'fields': ('is_premium', 'premium_expiry')}),
        ('日付', {'fields': ('created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'full_name', 'role'),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SeekerProfile)
class SeekerProfileAdmin(admin.ModelAdmin):
    """求職者プロフィール管理"""
    list_display = ['user', 'birthday', 'prefecture', 'desired_salary', 'updated_at']
    list_filter = ['prefecture', 'graduation_year']
    search_fields = ['user__email', 'user__full_name', 'first_name', 'last_name']
    raw_id_fields = ['user']
    readonly_fields = ['updated_at']


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    """履歴書管理"""
    list_display = ['user', 'submitted_at', 'is_active', 'match_score', 'created_at']
    list_filter = ['is_active', 'submitted_at']
    search_fields = ['user__email', 'user__full_name', 'desired_job', 'skills']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('user', 'submitted_at', 'is_active')}),
        ('希望条件', {'fields': ('desired_job', 'desired_industries', 'desired_locations')}),
        ('スキル・PR', {'fields': ('skills', 'self_pr')}),
        ('スコア', {'fields': ('match_score',)}),
        ('日付', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    """職歴管理"""
    list_display = ['resume', 'company', 'position', 'period_from', 'period_to', 'order']
    list_filter = ['employment_type', 'industry']
    search_fields = ['company', 'position', 'tasks']
    raw_id_fields = ['resume']
    ordering = ['resume', 'order']


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    """応募管理"""
    list_display = ['applicant', 'company', 'status', 'applied_at']
    list_filter = ['status', 'applied_at']
    search_fields = ['applicant__email', 'applicant__full_name', 'company__company_name']
    raw_id_fields = ['applicant', 'company', 'resume']
    readonly_fields = ['applied_at']
    
    actions = ['mark_as_viewed', 'mark_as_accepted', 'mark_as_rejected']
    
    def mark_as_viewed(self, request, queryset):
        queryset.update(status='viewed')
        self.message_user(request, f"{queryset.count()}件の応募を閲覧済みにしました。")
    mark_as_viewed.short_description = "選択した応募を閲覧済みにする"
    
    def mark_as_accepted(self, request, queryset):
        queryset.update(status='accepted')
        self.message_user(request, f"{queryset.count()}件の応募を採用にしました。")
    mark_as_accepted.short_description = "選択した応募を採用にする"
    
    def mark_as_rejected(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, f"{queryset.count()}件の応募を不採用にしました。")
    mark_as_rejected.short_description = "選択した応募を不採用にする"


@admin.register(Scout)
class ScoutAdmin(admin.ModelAdmin):
    """スカウト管理"""
    list_display = ['company', 'seeker', 'status', 'scouted_at']
    list_filter = ['status', 'scouted_at']
    search_fields = ['company__company_name', 'seeker__email', 'seeker__full_name', 'scout_message']
    raw_id_fields = ['company', 'seeker']
    readonly_fields = ['scouted_at', 'viewed_at', 'responded_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """メッセージ管理"""
    list_display = ['sender', 'receiver', 'subject', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['sender__email', 'receiver__email', 'subject', 'content']
    raw_id_fields = ['sender', 'receiver', 'application', 'scout']
    readonly_fields = ['created_at', 'read_at']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """決済管理"""
    list_display = ['user', 'payment_method', 'card_brand', 'is_default', 'created_at']
    list_filter = ['payment_method', 'card_brand', 'is_default', 'created_at']
    search_fields = ['user__email', 'user__full_name', 'card_token']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('user', 'payment_method', 'is_default')}),
        ('カード情報', {'fields': ('card_token', 'card_last4', 'card_brand')}),
        ('銀行情報', {'fields': ('bank_name', 'branch_name', 'account_type', 'account_number', 'account_holder')}),
        ('日付', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    """活動ログ管理"""
    list_display = ['user', 'action', 'target_user', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['user__email', 'action', 'details']
    raw_id_fields = ['user', 'target_user']
    readonly_fields = ['created_at']


@admin.register(MLModel)
class MLModelAdmin(admin.ModelAdmin):
    """機械学習モデル管理"""
    list_display = ['name', 'model_type', 'version', 'is_active', 'accuracy', 'created_at']
    list_filter = ['model_type', 'is_active', 'created_at']
    search_fields = ['name', 'model_type']
    readonly_fields = ['created_at']


@admin.register(MLPrediction)
class MLPredictionAdmin(admin.ModelAdmin):
    """予測結果管理"""
    list_display = ['model', 'user', 'prediction_type', 'prediction_value', 'confidence', 'created_at']
    list_filter = ['prediction_type', 'created_at']
    search_fields = ['user__email', 'prediction_type']
    raw_id_fields = ['model', 'user']
    readonly_fields = ['created_at']


# サイトのカスタマイズ
admin.site.site_header = "Resume Truemee 管理画面"
admin.site.site_title = "Resume Truemee Admin"
admin.site.index_title = "管理メニュー"


@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    """質問マスタ管理"""
    list_display = ['type', 'category', 'difficulty', 'locale', 'is_active', 'updated_at']
    list_filter = ['type', 'category', 'difficulty', 'locale', 'is_active']
    search_fields = ['text', 'answer_guide']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PromptTemplate)
class PromptTemplateAdmin(admin.ModelAdmin):
    """テンプレート管理"""
    list_display = ['name', 'target', 'is_active', 'updated_at']
    list_filter = ['target', 'is_active']
    search_fields = ['name', 'template_text', 'description']
    readonly_fields = ['created_at', 'updated_at']

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                '<path:pk>/preview/',
                self.admin_site.admin_view(self.preview_view),
                name='core_prompttemplate_preview',
            ),
        ]
        return custom + urls

    def preview_view(self, request, pk=None, *args, **kwargs):
        """Simple preview: ?resume_id=<uuid> required. Renders plain text."""
        tmpl = get_object_or_404(PromptTemplate, pk=pk)
        resume_id = request.GET.get('resume_id')
        if not resume_id:
            return HttpResponse(
                '<h2>テンプレート プレビュー</h2>'
                '<p>クエリに <code>?resume_id=&lt;UUID&gt;</code> を付けてアクセスしてください。</p>',
                content_type='text/html; charset=utf-8'
            )
        r = get_object_or_404(Resume, pk=resume_id)
        rendered = render_prompt_with_resume(tmpl, r)
        html = f"""
            <h2>テンプレート プレビュー: {tmpl.name}</h2>
            <p>Resume: {r.user.email} / {r.title}</p>
            <hr/>
            <pre style="white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;">{rendered}</pre>
        """
        return HttpResponse(html, content_type='text/html; charset=utf-8')
