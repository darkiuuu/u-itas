from django.contrib import admin
from django.urls import path, include # <--- Asegúrate de que diga "include" aquí
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('nails.urls')), # <--- El mapa hacia tu API
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)