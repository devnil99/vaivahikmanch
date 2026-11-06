"""
URL configuration for Vaivahik Manch project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import render


def react_app_view(request):
    """
    Renders React SPA's index.html template for production and client-side routing.
    """
    return render(request, "index.html")


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('VMApp.urls')),
    # Catch-all route to serve the React Single Page App
    re_path(r'^(?!api/|static/|media/|admin/).*$', react_app_view, name='react-app'),
]

if settings.DEBUG and not getattr(settings, 'USE_S3', False):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
