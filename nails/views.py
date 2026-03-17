from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ModeloUña, Cita, Insumo, PerfilCliente
from .serializers import ModeloUñaSerializer, CitaSerializer, InsumoSerializer, UserSerializer, PerfilClienteSerializer
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny

class ModeloUñaViewSet(viewsets.ModelViewSet):
    queryset = ModeloUña.objects.all()
    serializer_class = ModeloUñaSerializer
    permission_classes = [permissions.AllowAny]

class InsumoViewSet(viewsets.ModelViewSet):
    queryset = Insumo.objects.all()
    serializer_class = InsumoSerializer
    permission_classes = [permissions.AllowAny]

class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=['post'])
    def cotizar(self, request, pk=None):
        cita = self.get_object()
        precio_base = request.data.get('precio_base', 0)
        detalles = request.data.get('detalles', [])
        recomendacion = request.data.get('recomendacion', '')
        nueva_fecha_hora = request.data.get('fecha_hora')
        sistema_corregido = request.data.get('sistema_unas')
        hora_cambiada = request.data.get('hora_cambiada', False)
        duracion = request.data.get('duracion_estimada')

        total = float(precio_base)
        for extra in detalles:
            precio_extra = float(extra.get('precio', 0))
            cantidad_extra = int(extra.get('cantidad', 1))
            extra['cantidad_original'] = cantidad_extra 
            total += (precio_extra * cantidad_extra)

        cita.precio_base = precio_base
        cita.costo_total = total
        cita.desglose_cotizacion = detalles  
        cita.recomendacion_admin = recomendacion 
        
        if nueva_fecha_hora:
            cita.fecha_hora = nueva_fecha_hora
        if sistema_corregido:
            cita.sistema_unas = sistema_corregido
        if duracion is not None:
            cita.duracion_estimada = int(duracion)

        cita.hora_modificada = hora_cambiada
        cita.estado = 'cotizada'
        cita.save()

        return Response({'mensaje': 'Cotización guardada'})

    @action(detail=True, methods=['post'])
    def ajustar_extra(self, request, pk=None):
        cita = self.get_object()
        index = request.data.get('index')
        operacion = request.data.get('operacion') 
        
        if cita.desglose_cotizacion is not None and index is not None:
            index = int(index)
            if 0 <= index < len(cita.desglose_cotizacion):
                extra = cita.desglose_cotizacion[index]
                cantidad_actual = int(extra.get('cantidad', 0))
                cantidad_maxima = int(extra.get('cantidad_original', cantidad_actual))
                
                if operacion == 'restar' and cantidad_actual > 0:
                    extra['cantidad'] = cantidad_actual - 1
                elif operacion == 'sumar' and cantidad_actual < cantidad_maxima:
                    extra['cantidad'] = cantidad_actual + 1
        
        total = float(cita.precio_base)
        for extra in cita.desglose_cotizacion:
            total += (float(extra.get('precio', 0)) * int(extra.get('cantidad', 0)))
            
        cita.costo_total = total
        cita.save()
        return Response({'mensaje': 'Presupuesto ajustado', 'nuevo_total': total})

    @action(detail=True, methods=['post'])
    def aceptar(self, request, pk=None):
        cita = self.get_object()
        cita.estado = 'precio_aceptado'
        cita.save()
        return Response({'status': 'Precio aceptado'})

    @action(detail=True, methods=['post'])
    def solicitar_cambios(self, request, pk=None):
        cita = self.get_object()
        motivo = request.data.get('motivo', 'Solicitó cambios en la cotización.')
        cita.estado = 'pendiente'
        notas_previas = cita.notas_cliente if cita.notas_cliente else ""
        cita.notas_cliente = f"{notas_previas}\n\n⚠️ CLIENTA PIDIÓ CAMBIO: {motivo}"
        cita.save()
        return Response({'status': 'Cita devuelta'})

    @action(detail=True, methods=['post'])
    def confirmar_final(self, request, pk=None):
        cita = self.get_object()
        nueva_fecha_hora = request.data.get('fecha_hora')
        hora_cambiada = request.data.get('hora_cambiada')
        duracion = request.data.get('duracion_estimada')
        
        if nueva_fecha_hora:
            cita.fecha_hora = nueva_fecha_hora
        if hora_cambiada is not None:
            cita.hora_modificada = hora_cambiada
        if duracion is not None:
            cita.duracion_estimada = int(duracion)
            
        cita.estado = 'confirmada'
        cita.save()
        return Response({'status': 'Cita confirmada'})

    # 👇 AQUI RECIBIMOS Y GUARDAMOS QUIÉN CANCELÓ 👇
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        cita = self.get_object()
        cita.estado_anterior = cita.estado 
        cita.estado = 'cancelada'
        cita.cancelado_por = request.data.get('cancelado_por', 'desconocido')
        cita.save()
        return Response({'status': 'Cita cancelada exitosamente'})

    @action(detail=True, methods=['post'])
    def restaurar(self, request, pk=None):
        cita = self.get_object()
        cita.estado = cita.estado_anterior if cita.estado_anterior else 'pendiente'
        cita.cancelado_por = None # Limpiamos la memoria al restaurar
        cita.save()
        return Response({'status': 'Cita restaurada exitosamente'})
    
class PerfilClienteViewSet(viewsets.ModelViewSet):
    queryset = PerfilCliente.objects.all()
    serializer_class = PerfilClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

class RegistroView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'error': 'Faltan datos'}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            return Response({'error': 'Este correo ya tiene cuenta. Ve a la opción "Entrar" de abajo.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.create_user(username=email, email=email, password=password)
        return Response({'id': user.id, 'email': user.email, 'is_staff': user.is_staff}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = User.objects.filter(email=email).first()
        if user:
            if user.check_password(password):
                login(request, user)
                return Response({'id': user.id, 'email': user.email, 'is_staff': user.is_staff}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Contraseña incorrecta. Intenta de nuevo.'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({'error': 'Este correo no está registrado. Dale a "Crear Cuenta".'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET', 'PATCH'])
@authentication_classes([]) 
@permission_classes([AllowAny])
def perfil_cliente(request, usuario_id):
    perfil, created = PerfilCliente.objects.get_or_create(usuario_id=usuario_id)
    if request.method == 'GET':
        serializer = PerfilClienteSerializer(perfil)
        return Response(serializer.data)
    elif request.method == 'PATCH':
        perfil.notas_internas = request.data.get('notas_internas', perfil.notas_internas)
        perfil.save()
        return Response({'mensaje': 'Expediente guardado con éxito'})