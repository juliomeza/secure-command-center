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

#### Fase 2: Implementación de Autenticación (Frontend - 3 semanas)
- [ ] **Limpieza (Frontend)**
  - [ ] Eliminar cualquier código remanente relacionado con autenticación basada en sesiones u otros métodos.

#### Fase 3: Implementación de Control de Acceso (Backend: Ya iniciado, Frontend: 3 semanas)
- [ ] **Crear nueva app `access` en Django** (Hecho)
  - [ ] Diseñar e implementar modelo de permisos granular (Backend)
  - [ ] Desarrollar API para verificación de permisos (Backend)
  - [ ] Implementar middleware de validación de acceso (Backend)
- [ ] **Integrar sistema de permisos en frontend**
  - [ ] Crear hook `usePermissions` (o similar) para obtener permisos del usuario.
  - [ ] Implementar lógica condicional en UI basada en permisos.
  - [ ] Adaptar `ProtectedRoute` o crear nuevos componentes/HOCs para proteger rutas/componentes basados en permisos específicos.

## Estructura y Organización

### Media Prioridad
- [ ] **Estandarizar patrones de importación**
- [ ] **Crear índices para exportaciones en carpetas principales**

## Mejoras de Rendimiento

### Media Prioridad
- [ ] **Implementar caché para respuestas API**
- [ ] **Optimizar carga de componentes frontend**

## Mantenibilidad y Código Limpio

### Alta Prioridad
- [ ] **Eliminar código de logging de depuración (Frontend/Backend)**

### Media Prioridad
- [ ] **Estandarizar manejo de errores**
- [ ] **Mejorar nombres de variables y funciones**

## Pruebas y Calidad

### Media Prioridad
- [ ] **Configurar herramientas de análisis estático**
- [ ] **Implementar tests e2e para flujos críticos**

## Escalabilidad

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

### Próximos Pasos Inmediatos (Sprint Actual)
- [ ] Crear e implementar hook `usePermissions` para gestionar permisos de usuario
- [ ] Refactorizar `ProtectedRoute` para utilizar permisos específicos de rutas
- [ ] Implementar validación de tipos TypeScript estricta en módulos de autenticación
