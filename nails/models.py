import random
import string
from django.db import models
from django.contrib.auth.models import User

def generar_codigo():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))

class ModeloUña(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True, default="")
    imagen = models.ImageField(upload_to='catalogo/')
    def __str__(self):
        return self.nombre

class Insumo(models.Model):
    nombre = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    def __str__(self):
        return f"{self.nombre} - S/ {self.precio}"

class Cita(models.Model):
    ESTADOS_CITA = [
        ('pendiente', 'Pendiente de Evaluación'),
        ('cotizada', 'Esperando Confirmación de Clienta'),
        ('precio_aceptado', 'Clienta Aceptó (Por Confirmar)'),
        ('confirmada', 'Confirmada y Agendada'),
        ('cancelada', 'Cancelada'),
    ]

    cliente = models.ForeignKey(User, on_delete=models.CASCADE)
    fecha_hora = models.DateTimeField()
    foto_diseno = models.ImageField(upload_to='citas/disenos/')
    foto_perfil_una = models.ImageField(upload_to='citas/perfiles/')
    notas_cliente = models.TextField(blank=True, null=True)
    sistema_unas = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_CITA, default='pendiente')
    estado_anterior = models.CharField(max_length=20, blank=True, null=True)
    
    # 👇 ESTE ES EL NUEVO CAJÓN QUE GUARDA QUIÉN CANCELÓ 👇
    cancelado_por = models.CharField(max_length=20, blank=True, null=True)
    
    precio_base = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    costo_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    desglose_cotizacion = models.JSONField(default=list, blank=True, null=True)
    
    edad = models.IntegerField(null=True, blank=True)
    recomendacion_admin = models.TextField(blank=True, null=True)
    hora_modificada = models.BooleanField(default=False)
    duracion_estimada = models.IntegerField(default=120, null=True, blank=True) 
    
    codigo_pago = models.CharField(max_length=10, blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.codigo_pago:
            self.codigo_pago = generar_codigo()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Reserva {self.codigo_pago} - {self.cliente.email}"

    @property
    def estado_display(self):
        return dict(self.ESTADOS_CITA).get(self.estado, self.estado)

class DetalleCita(models.Model):
    cita = models.ForeignKey(Cita, related_name='detalles', on_delete=models.CASCADE)
    insumo = models.ForeignKey(Insumo, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    def __str__(self):
        return f"{self.cantidad}x {self.insumo.nombre} para Cita #{self.cita.id}"

class PerfilCliente(models.Model):
    usuario_id = models.IntegerField(unique=True)
    notas_internas = models.TextField(blank=True, null=True)
    def __str__(self):
        return f"Perfil ID: {self.usuario_id}"