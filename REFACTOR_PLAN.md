# Plan de Refactorización para Secure Command Center (Actualizado)

Este documento recopila las principales áreas de mejora identificadas en el proyecto Secure Command Center y propone un plan estructurado para abordarlas progresivamente.

## Índice
1. [Sistema de Autenticación](#sistema-de-autenticación)
2. [Estructura y Organización](#estructura-y-organización)
3. [Mejoras de Rendimiento](#mejoras-de-rendimiento)
4. [Mantenibilidad y Código Limpio](#mantenibilidad-y-código-limpio)
5. [Pruebas y Calidad](#pruebas-y-calidad)
6. [Escalabilidad](#escalabilidad)
7. [Accesibilidad](#accesibilidad)
8. [Plan de Acción por Fases](#plan-de-acción-por-fases)

## Sistema de Autenticación

### Diagnóstico Actual
Históricamente, el sistema mezclaba enfoques (sesiones Django, JWT, cookies), creando complejidad. El objetivo es consolidar en **JWT + OAuth**. El código en `frontend/src/components/AuthProvider.tsx` y `frontend/src/services/authService.ts` maneja la lógica de autenticación del lado del cliente (estado, llamadas API, manejo de tokens JWT vía `sessionStorage`, interceptores para refresco).

### Problemas Identificados
- **Frontend:**
  - Alta complejidad y responsabilidades en `AuthProvider.tsx`.
  - Dependencia de `sessionStorage` para tokens JWT (requiere revisión de seguridad/persistencia).
  - Lógica de manejo de redirect OAuth y obtención inicial de JWT dispersa.
  - Logging de depuración presente.
  - Potencial mejora en manejo de errores y robustez de `AuthService` (especialmente ciclo de vida JWT).
- **Backend:** (En progreso con app `authentication`)
  - Eliminar completamente la dependencia de sesiones Django para la autenticación API.
  - Asegurar que solo se use JWT + OAuth.

### Arquitectura Objetivo
- **Backend**: (En progreso) API-first con **JWT + OAuth exclusivamente**.
  - App `authentication`: Gestión de identidad y tokens JWT.
  - App `access`: Control de acceso basado en roles/permisos (desacoplado de auth).
- **Frontend**: Arquitectura orientada a servicios dentro de `src/auth`.
  - `AuthProvider`: Gestor de estado de autenticación (simplificado, basado en JWT).
  - `AuthService`: Encapsula llamadas API y **ciclo de vida completo de tokens JWT** (obtención post-OAuth, almacenamiento, refresco, eliminación).
  - Hooks (`useAuth`, otros): Para consumir estado y lógica encapsulada.
  - Componentes (`LoginPage`, `ProtectedRoute`): Enfocados en UI y flujo (dependientes del estado JWT).

### Plan de Refactorización (Alta Prioridad)

#### Fase 1: Preparación y Tests (Frontend - 2 semanas)
- [x] **Ampliar cobertura de tests (Frontend)**  *(Iniciado/En progreso)*
  - [ ] Refinar/completar tests unitarios para `AuthService` (ciclo JWT), `AuthProvider`, `useAuth`.
  - [ ] Implementar tests de integración para flujo JWT completo (Login OAuth -> Recepción/Almacenamiento JWT -> Acceso Protegido -> Refresco JWT -> Logout).
- [x] **Reestructurar frontend (`src/auth/`)**
  - [x] Confirmar y aplicar estructura: `components/`, `services/`, `hooks/`, `types/`, `utils/`.
  - [x] Mover archivos relevantes a la nueva estructura.

#### Fase 2: Implementación de Autenticación (Frontend - 3 semanas)
- [ ] **Consolidar y Asegurar Manejo de Tokens JWT (Frontend)**
  - [ ] Confirmar estrategia de almacenamiento (`sessionStorage` por ahora, revisar seguridad).
  - [ ] Asegurar que `AuthService` es el **único** responsable del almacenamiento/recuperación de JWTs.
  - [ ] Centralizar lógica de obtención/almacenamiento de JWT post-OAuth redirect en `AuthService` o un hook dedicado.
  - [ ] Limpiar parámetros URL (jwt_access, jwt_refresh) después de leer tokens.
- [ ] **Refactorizar `AuthProvider` y `useAuth` (Frontend)**
  - [ ] Extraer lógica compleja (orquestación de llamadas iniciales, validaciones) a `AuthService` o hooks/utils en `src/auth/`.
  - [ ] Enfocar `AuthProvider` en gestión de estado (basado en JWT) y provisión de contexto.
  - [ ] Asegurar que `checkAuth` dependa únicamente de la validación de JWTs vía `AuthService`.
- [ ] **Fortalecer `AuthService` (Frontend)**
  - [ ] Implementar manejo de errores robusto y estandarizado (especialmente en flujo JWT).
  - [ ] Eliminar logging de depuración, usar logging controlado si es necesario.
  - [ ] Revisar y robustecer interceptor de refresco JWT (manejo de casos límite).
- [ ] **Limpieza (Frontend)**
  - [ ] Eliminar flag `USE_NEW_AUTH_API` y código asociado cuando la nueva API backend (JWT-only) sea estable.
  - [ ] Eliminar cualquier código remanente relacionado con autenticación basada en sesiones u otros métodos.

#### Fase 3: Implementación de Control de Acceso (Backend: Ya iniciado, Frontend: 3 semanas)
- [x] **Crear nueva app `access` en Django** (Hecho)
  - [ ] Diseñar e implementar modelo de permisos granular (Backend)
  - [ ] Desarrollar API para verificación de permisos (Backend)
  - [ ] Implementar middleware de validación de acceso (Backend)
- [ ] **Integrar sistema de permisos en frontend**
  - [ ] Crear hook `usePermissions` (o similar) para obtener permisos del usuario.
  - [ ] Implementar lógica condicional en UI basada en permisos.
  - [ ] Adaptar `ProtectedRoute` o crear nuevos componentes/HOCs para proteger rutas/componentes basados en permisos específicos.

## Estructura y Organización

### Alta Prioridad
- [ ] **Reorganizar estructura frontend**
  - [ ] Implementar arquitectura por características (ej. `src/auth`, `src/dashboard`, etc.) vs por tipos (`components`, `services`). (En progreso con `src/auth`).
  - [ ] Mover componentes/lógica de autenticación a `src/auth/`.
  - [ ] Separar servicios API (`AuthService`) de lógica de componentes (`AuthProvider`).

### Media Prioridad
- [ ] **Estandarizar patrones de importación**
- [ ] **Crear índices para exportaciones en carpetas principales**

## Mejoras de Rendimiento

### Alta Prioridad
- [x] **Optimizar manejo de tokens JWT**
  - [x] Implementar expiración y renovación adecuada
  - [x] Reducir tamaño de payload

### Media Prioridad
- [ ] **Implementar caché para respuestas API**
- [ ] **Optimizar carga de componentes frontend**

## Mantenibilidad y Código Limpio

### Alta Prioridad
- [ ] **Reducir complejidad ciclomática en componentes clave (Frontend)**
  - [ ] Refactorizar `frontend/src/components/AuthProvider.tsx` (reducir tamaño y responsabilidades).
  - [ ] Simplificar lógica condicional en `frontend/src/components/ProtectedRoute.tsx`.
- [ ] **Implementar servicios API estructurados (Frontend)**
  - [ ] Asegurar que `AuthService` siga principios SOLID. Considerar dividir si crece demasiado.
- [ ] **Eliminar código de logging de depuración (Frontend/Backend)**

### Media Prioridad
- [ ] **Estandarizar manejo de errores**
- [ ] **Mejorar nombres de variables y funciones**

## Pruebas y Calidad

### Alta Prioridad
- [ ] **Ampliar cobertura de tests (Frontend)**
  - [ ] Tests unitarios para servicios (`AuthService` - ciclo JWT), hooks (`useAuth`, nuevos) y utilidades de autenticación.
  - [ ] Tests de integración para flujos de autenticación JWT y autorización (Login OAuth, Recepción/Almacenamiento JWT, Refresco, Logout, Acceso basado en permisos).
- [ ] **Implementar validación de tipos TypeScript estricta (Frontend)**

### Media Prioridad
- [ ] **Configurar herramientas de análisis estático**
- [ ] **Implementar tests e2e para flujos críticos**

## Escalabilidad

### Alta Prioridad
- [x] **Separar responsabilidades en servicios backend**

### Media Prioridad
- [ ] **Implementar paginación consistente**
- [ ] **Mejorar gestión de estado en frontend**

## Accesibilidad

### Media Prioridad
- [ ] **Agregar etiquetas ARIA a componentes de autenticación**
- [ ] **Implementar manejo de errores accesible en formularios**
- [ ] **Mejorar contraste y navegación por teclado**

## Plan de Acción por Fases

### Estrategia de Migración Segura

Para garantizar una migración sin interrupciones y minimizar riesgos, se seguirá una estrategia de "parallel implementation":

1. **Mantener código existente como referencia**
   - El código actual en `core` y `project` permanecerá intacto durante el desarrollo
   - Servirá como documentación viva y referencia de la implementación funcional
   - Nos permitirá comparar comportamientos y resultados

2. **Desarrollo paralelo y gradual**
   - Implementar nueva funcionalidad en `authentication` sin modificar el código existente
   - Mantener ambas implementaciones funcionando en paralelo
   - Usar el código existente como guía para replicar comportamientos críticos
   - Facilita rollback en caso de problemas

3. **Validación y switch**
   - Validar exhaustivamente la nueva implementación
   - Realizar pruebas A/B si es necesario
   - Solo eliminar código antiguo cuando el nuevo esté 100% probado y funcional

Esta estrategia nos permite:
- Mantener el sistema actual funcionando sin interrupciones
- Usar el código existente como documentación y referencia
- Reducir riesgos y frustración en el desarrollo
- Tener siempre un fallback funcional
- Hacer la migración de manera controlada y segura

### Fase 1: Estructura y Tests Previos (Frontend - 3-4 semanas)
- [x] Preparar estructura `src/auth/`.
- [x] Completar tests unitarios para servicios y hooks principales de autenticación.
- [x] Implementar tests de integración para flujos críticos de autenticación.
- [ ] Configurar herramientas de calidad de código (linters, formatters).

### Fase 2: Refactorización del Sistema de Autenticación (Frontend - 4-5 semanas)
- [x] Implementar manejo de tokens JWT consolidado y seguro (`AuthService`).
- [x] Refactorizar `AuthProvider` extrayendo lógica, basándose en estado JWT.
- [x] Fortalecer `AuthService` (errores, logs, interceptor de refresco JWT).
- [x] Validar exhaustivamente con tests (flujo JWT) antes de eliminar código antiguo o flags.
- [ ] Eliminar flag `USE_NEW_AUTH_API` y código no JWT cuando sea apropiado.

### Fase 3: Implementación de Control de Acceso (Frontend - 3-4 semanas)
- [ ] Implementar hook `usePermissions`.
- [ ] Integrar lógica de permisos en UI y `ProtectedRoute`.
- [ ] Validar cobertura de tests para nuevos componentes/lógica de permisos.

### Fase 4: Optimización y Refinamiento (2-3 semanas)
- [ ] Mejorar rendimiento de componentes críticos
- [ ] Implementar mejoras de accesibilidad
- [ ] Refinar documentación técnica
- [ ] Eliminar código legacy una vez validado el nuevo sistema
- [ ] Realizar limpieza final de imports y dependencias no usadas

### Resultado Final Esperado
- **Backend**: 
  - Arquitectura clara con separación de responsabilidades
  - Sistema de autenticación y autorización desacoplados
  - API documentada y fácil de mantener
  
- **Frontend**:
  - Estructura modular con servicios especializados
  - Componentes más pequeños y mantenibles
  - Separación clara entre autenticación y autorización
  - Experiencia de usuario mejorada y accesible