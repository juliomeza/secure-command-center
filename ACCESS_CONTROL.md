# Sistema de Control de Acceso

Este documento describe el modelo de control de acceso implementado en la aplicación.

## Niveles de Acceso

El acceso se controla en varios niveles jerárquicos:

1.  **Autenticación:** El usuario debe iniciar sesión correctamente (gestionado por la app `authentication`).
2.  **Autorización:** Un administrador debe marcar explícitamente al usuario como "autorizado" para usar la aplicación. Los usuarios autenticados pero no autorizados no pueden acceder a las funcionalidades principales.
3.  **Permisos Granulares:** Una vez autorizado, el acceso del usuario se restringe según:
    *   **Compañías (`Company`):** Qué compañías puede ver/gestionar el usuario.
    *   **Almacenes (`Warehouse`):** Qué almacenes puede ver/gestionar el usuario (relevante para el tab "Leaders").
    *   **Vistas/Tabs:** Qué secciones principales de la interfaz (Tabs: CEO, CIO, COO, CFO, CTO, Leaders) puede ver el usuario.

## Modelo de Datos (`access` app)

*   **`UserProfile`:**
    *   `user`: OneToOneField con `settings.AUTH_USER_MODEL`.
    *   `is_authorized`: BooleanField (default: `False`). Indica si el usuario tiene permiso para acceder a la aplicación después de iniciar sesión.
    *   `allowed_companies`: ManyToManyField con `Company`.
    *   `allowed_warehouses`: ManyToManyField con `Warehouse`.
    *   `allowed_tabs`: ManyToManyField con `Tab`. Indica las vistas/secciones principales a las que el usuario puede acceder.

*   **`Company`:**
    *   `name`: CharField (unique).
    *   *Modelo implementado en `access.models`.*

*   **`Warehouse`:**
    *   `name`: CharField (unique).
    *   `company`: ForeignKey a `Company`.
    *   *Modelo implementado en `access.models`.*

*   **`Tab`:**
    *   `id_name`: CharField (unique). Identificador interno (e.g., 'CEO', 'Leaders').
    *   `display_name`: CharField. Nombre para mostrar en la UI (e.g., 'CEO View').
    *   *Modelo implementado en `access.models` para gestionar los tabs permitidos.*

## Flujo de Acceso

1.  Usuario inicia sesión (Autenticación).
2.  Middleware verifica `UserProfile.is_authorized`.
    *   Si `False` o no existe `UserProfile`: Acceso denegado (o redirigido a página "Pendiente de Autorización").
    *   Si `True`: Continuar.
3.  Frontend solicita `/api/access/permissions/` para obtener los permisos específicos del usuario (`allowed_companies`, `allowed_warehouses`, `allowed_tabs`).
4.  Frontend renderiza la UI condicionalmente:
    *   Muestra tabs según `allowed_tabs`.
    *   Si `is_authorized` es `True` pero todos los permisos están vacíos, muestra la página "Bienvenido, contacta al admin".
    *   Filtra datos/opciones (dropdown de almacenes) según `allowed_companies` y `allowed_warehouses`.

## Gestión de Permisos

Los permisos (`is_authorized`, `allowed_companies`, `allowed_warehouses`, `allowed_tabs`) se gestionan a través del panel de administración de Django.
