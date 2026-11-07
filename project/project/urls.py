"""
URL configuration for Vaivahik Manch project.
"""
import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import render
from django.http import FileResponse, Http404


def react_app_view(request):
    """
    Renders React SPA's index.html template for production and client-side routing.
    """
    return render(request, "index.html")


def serve_root_asset(filename, content_type=None):
    """
    Serves root PWA assets (service-worker.js, manifest.json, logo icons) with exact MIME types.
    """
    def view(request):
        candidates = []
        if getattr(settings, 'STATIC_ROOT', None):
            candidates.append(settings.STATIC_ROOT)
        if getattr(settings, 'BASE_DIR', None):
            candidates.append(settings.BASE_DIR / 'static')
        for base in candidates:
            if base:
                fpath = os.path.join(str(base), filename)
                if os.path.exists(fpath):
                    return FileResponse(open(fpath, 'rb'), content_type=content_type)
        raise Http404(f"{filename} not found")
    return view


urlpatterns = [
    path('admin/', admin.site.urls),
    # Root PWA files served with strict MIME types
    path('manifest.json', serve_root_asset('manifest.json', 'application/manifest+json')),
    path('service-worker.js', serve_root_asset('service-worker.js', 'application/javascript')),
    path('logo192.png', serve_root_asset('logo192.png', 'image/png')),
    path('logo512.png', serve_root_asset('logo512.png', 'image/png')),
    path('', include('VMApp.urls')),
    # Catch-all route to serve the React Single Page App
    re_path(r'^(?!api/|static/|media/|admin/).*$', react_app_view, name='react-app'),
]

if settings.DEBUG and not getattr(settings, 'USE_S3', False):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

