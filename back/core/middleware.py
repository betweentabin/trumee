from django.utils.deprecation import MiddlewareMixin

class DisableCSRFForPDFDownload(MiddlewareMixin):
    """
    Disable CSRF check for PDF download endpoints
    """
    def process_view(self, request, callback, callback_args, callback_kwargs):
        # List of paths that should bypass CSRF
        csrf_exempt_paths = [
            '/api/v2/resumes/download-pdf/',
            '/api/v2/resumes/send-pdf/',
        ]
        
        # Check if current path should bypass CSRF
        if request.path in csrf_exempt_paths:
            setattr(request, '_dont_enforce_csrf_checks', True)
        
        return None