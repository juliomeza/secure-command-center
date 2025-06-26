from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError # Importar ValidationError

# Placeholder model for Companies
class Company(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # Add other relevant fields later if needed for access control itself

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Companies"

# Placeholder model for Warehouses
class Warehouse(models.Model):
    name = models.CharField(max_length=100, unique=True)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE, # Or models.PROTECT, models.SET_NULL depending on desired behavior
        related_name='warehouses',
        null=True, # Allow null temporarily for migration
        blank=True # Allow blank temporarily for migration
    )
    # Add other relevant fields later if needed for access control itself

    def __str__(self):
        # Optionally include company name in string representation
        if self.company:
            return f"{self.name} ({self.company.name})"
        return self.name

# Model for Tabs/Views
class Tab(models.Model):
    id_name = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique identifier for the tab (e.g., CEO, Leaders, Testing). Used internally."
    )
    display_name = models.CharField(
        max_length=100,
        help_text="User-friendly name for the tab (e.g., CEO View, Leaders View, Testing View)."
    )
    # Add other fields if needed, like description, icon, order, etc.

    def __str__(self):
        return self.display_name

    class Meta:
        ordering = ['display_name'] # Optional: order tabs alphabetically by default

# User Profile to store access permissions
class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='access_profile',
        null=True,  # Permitir nulo para crear perfil antes que el usuario
        blank=True  # Permitir vacío en formularios/admin
    )
    # Añadir campo email para búsqueda de pre-configuración
    email = models.EmailField(
        max_length=254,
        # unique=True, # La unicidad se maneja en clean() para ser condicional
        null=True, # Permitir nulo
        blank=True, # Permitir vacío
        db_index=True, # Indexar para búsquedas rápidas
        help_text="Email para pre-configurar acceso antes del primer login. Se vuelve redundante una vez que el usuario está vinculado."
    )
    is_authorized = models.BooleanField(
        default=False,
        help_text="Designa si el usuario está autorizado para acceder a la aplicación."
    )
    allowed_companies = models.ManyToManyField(
        Company,
        blank=True,
        help_text="Compañías a las que este usuario puede ver datos."
    )
    allowed_warehouses = models.ManyToManyField(
        Warehouse,
        blank=True,
        help_text="Almacenes (pestaña Leaders) a los que este usuario puede ver datos."
    )
    allowed_tabs = models.ManyToManyField(
        Tab,
        blank=True,
        help_text="Pestañas/Vistas a las que este usuario puede acceder."
    )

    def __str__(self):
        if self.user:
            return f"Perfil de Acceso de {self.user.username}"
        elif self.email:
            return f"Perfil Pre-configurado para {self.email}"
        else:
            # Fallback si ambos son nulos (no debería ocurrir con la validación)
            return f"UserProfile object (ID: {self.pk})"

    def clean(self):
        """
        Validaciones personalizadas para UserProfile:
        - Asegura que 'user' o 'email' esté establecido.
        - Asegura la unicidad del 'email' para perfiles pre-configurados (user=None).
        - Asegura que si 'user' está establecido, el 'email' coincida (si se proporciona).
        """
        super().clean() # Llama a la validación del modelo base primero

        if not self.user and not self.email:
            raise ValidationError("Se debe proporcionar 'user' o 'email' para un UserProfile.")

        # Normalizar email a minúsculas para comparación insensible a mayúsculas/minúsculas
        if self.email:
            self.email = self.email.lower().strip()

        # Validación de unicidad para emails en perfiles pre-configurados
        if not self.user and self.email:
            # Busca otros perfiles sin usuario y con el mismo email (excluyendo el actual si ya existe)
            query = UserProfile.objects.filter(email__iexact=self.email, user__isnull=True)
            if self.pk: # Si el objeto ya existe en la BD, excluirlo de la búsqueda
                query = query.exclude(pk=self.pk)
            if query.exists():
                raise ValidationError({'email': 'Ya existe un perfil pre-configurado con este email.'})

        # Validación opcional: Si el usuario está vinculado, asegurar que el email coincida
        # if self.user and self.email and self.user.email.lower() != self.email.lower():
        #     raise ValidationError({'email': f"El email del perfil ({self.email}) no coincide con el email del usuario vinculado ({self.user.email})."})


    def save(self, *args, **kwargs):
        """
        Sobrescribe save para asegurar que se llame a full_clean y
        opcionalmente poblar el email desde el usuario si está vacío.
        """
        # Normalizar email a minúsculas antes de guardar
        if self.email:
            self.email = self.email.lower().strip()

        # Opcional: Poblar email desde user si user existe y email está vacío
        if self.user and not self.email:
             # Asegúrate de que el modelo User tenga un campo 'email'
             if hasattr(self.user, 'email') and self.user.email:
                 # Normalizar también el email del usuario
                 user_email_normalized = self.user.email.lower().strip()
                 # Verificar si ya existe un perfil preconfigurado con ese email
                 existing_preconf = UserProfile.objects.filter(email__iexact=user_email_normalized, user__isnull=True).first()
                 if existing_preconf and existing_preconf.pk != self.pk:
                     # Podrías decidir fusionar o lanzar un error aquí
                     # Por ahora, simplemente asignamos el email
                     self.email = user_email_normalized
                 else:
                     self.email = user_email_normalized
             else:
                 # Manejar caso donde el usuario no tiene email (podría ser problemático)
                 # Podrías lanzar un error o dejar el email nulo si es aceptable
                 pass # Dejar email como None/Blank si el usuario no tiene email

        # Siempre llama a full_clean para ejecutar las validaciones de clean()
        # antes de intentar guardar en la base de datos.
        # Nota: full_clean puede fallar si el usuario no tiene email y se requiere
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        # Opcional: Añadir constraint para unicidad condicional a nivel de BD si es soportado
        # constraints = [
        #     models.UniqueConstraint(fields=['email'], condition=models.Q(user__isnull=True), name='unique_email_if_user_isnull')
        # ]
        verbose_name = "User Access Profile"
        verbose_name_plural = "User Access Profiles"
