"""
URL configuration for Vaivahik Manch project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse


def react_app_view(request):
    """
    Renders React SPA's index.html for production and client-side routing.
    """
    index_file = settings.BASE_DIR.parent / 'Frontend' / 'build' / 'index.html'
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponse(
        "<h2>Vaivahik Manch Matrimonial Backend API Active</h2>"
        "<p>React build not found. Run: <code>npm --prefix Frontend run build</code></p>",
        content_type='text/html'
    )


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('VMApp.urls')),
    # Catch-all route to serve the React Single Page App
    re_path(r'^(?!api/|static/|media/|admin/).*$', react_app_view, name='react-app'),
]

if settings.DEBUG and not getattr(settings, 'USE_S3', False):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
