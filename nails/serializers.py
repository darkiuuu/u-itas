from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ModeloUña, Cita, Insumo, PerfilCliente

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class ModeloUñaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModeloUña
        fields = '__all__'

class InsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insumo
        fields = '__all__'

class CitaSerializer(serializers.ModelSerializer):
    estado_display = serializers.ReadOnlyField()

    class Meta:
        model = Cita
        # 👇 ESTA ES LA PALABRA MÁGICA: Le dice que acepte TODO lo del modelo
        fields = '__all__' 

class PerfilClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilCliente
        fields = '__all__'