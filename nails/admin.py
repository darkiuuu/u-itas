from django.contrib import admin
from .models import ModeloUña, Cita, Insumo, DetalleCita, PerfilCliente

@admin.register(ModeloUña)
class ModeloUñaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre') # Quitamos 'activo' y 'fecha' que daban error

@admin.register(Insumo)
class InsumoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'precio') # Quitamos 'categoria' que daba error

class DetalleCitaInline(admin.TabularInline):
    model = DetalleCita
    extra = 0

@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'fecha_hora', 'estado', 'costo_total')
    list_filter = ('estado', 'fecha_hora')
    inlines = [DetalleCitaInline]
    # Quitamos 'fecha_solicitud' que daba error

from django.contrib import admin
from .models import PerfilCliente

# 👇 Aquí le cambiamos 'usuario' por 'usuario_id' para que coincida con la tabla nueva
class PerfilClienteAdmin(admin.ModelAdmin):
    list_display = ('usuario_id', 'notas_internas')

admin.site.register(PerfilCliente, PerfilClienteAdmin)