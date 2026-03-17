from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'catalogo', views.ModeloUñaViewSet)
router.register(r'insumos', views.InsumoViewSet)
router.register(r'citas', views.CitaViewSet)
router.register(r'clientes', views.PerfilClienteViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # 👇 Aquí está la magia: conectamos el login y registro correctamente
    path('registro/', views.RegistroView.as_view(), name='registro'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('clientes/<int:usuario_id>/perfil/', views.perfil_cliente),
]