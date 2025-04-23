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
El sistema de autenticación mezcla varios enfoques (sesiones Django, JWT, cookies) creando complejidad innecesaria. El código en `frontend/src/components/AuthProvider.tsx` (357 líneas) contiene abundante lógica de negocio, logging de depuración y múltiples responsabilidades.

### Problemas Identificados
- Demasiada responsabilidad en `frontend/src/components/AuthProvider.tsx`
- Dependencia excesiva de `sessionStorage` para manejo de tokens
- Logging de debugging en código de producción
- Mezcla de autenticación con autorización
- Configuración redundante en `backend/project/settings.py`

### Arquitectura Objetivo
- **Backend**: Implementar una arquitectura API-first con JWT
  - App `authentication`: Gestión de identidad y tokens
  - App `access`: Control de acceso basado en roles y permisos
- **Frontend**: Arquitectura orientada a servicios
  - Módulo `src/auth` para lógica de autenticación
  - Servicios separados para API, tokens y estado de usuario

### Plan de Refactorización (Alta Prioridad)

#### Fase 1: Preparación y Tests (2 semanas)
- [ ] **Ampliar cobertura de tests**
  - [ ] Completar tests unitarios para `authService`
  - [ ] Mejorar tests para `useAuth` y `AuthProvider`
  - [ ] Implementar tests de integración para flujo completo
- [ ] **Crear nueva app `authentication` en Django**
  - [ ] Migrar y consolidar modelos de usuario
  - [ ] Implementar serializers específicos
  - [ ] Crear endpoints dedicados de autenticación
- [ ] **Reestructurar frontend**
  - [ ] Crear estructura base `src/auth/`
  - [ ] Migrar y refactorizar hooks y utilidades

#### Fase 2: Implementación de Autenticación (3 semanas)
- [ ] **Simplificar backend**
  - [ ] Eliminar dependencia de sesiones Django
  - [ ] Consolidar autenticación exclusivamente con JWT
  - [ ] Limpiar configuración redundante en `backend/project/settings.py`
- [ ] **Refactorizar componentes frontend**
  - [ ] Extraer lógica de negocio de `AuthProvider` a servicios
  - [ ] Implementar `TokenService` separado
  - [ ] Reducir complejidad de `useAuth`
  - [ ] Separar lógica de manejo de OAuth

#### Fase 3: Implementación de Control de Acceso (3 semanas)
- [ ] **Crear nueva app `access` en Django**
  - [ ] Diseñar e implementar modelo de permisos granular
  - [ ] Desarrollar API para verificación de permisos
  - [ ] Implementar middleware de validación de acceso
- [ ] **Integrar sistema de permisos en frontend**
  - [ ] Crear hook `usePermissions` separado
  - [ ] Implementar componentes condicionales basados en permisos
  - [ ] Desarrollar HOCs para proteger componentes

## Estructura y Organización

### Alta Prioridad
- [ ] **Reorganizar estructura frontend**
  - [ ] Implementar arquitectura por características vs por tipos
  - [ ] Mover componentes de autenticación a carpeta dedicada
  - [ ] Separar servicios API de lógica de componentes

### Media Prioridad
- [ ] **Estandarizar patrones de importación**
- [ ] **Crear índices para exportaciones en carpetas principales**

## Mejoras de Rendimiento

### Alta Prioridad
- [ ] **Optimizar manejo de tokens JWT**
  - [ ] Implementar expiración y renovación adecuada
  - [ ] Reducir tamaño de payload

### Media Prioridad
- [ ] **Implementar caché para respuestas API**
- [ ] **Optimizar carga de componentes frontend**

## Mantenibilidad y Código Limpio

### Alta Prioridad
- [ ] **Reducir complejidad ciclomática en componentes clave**
  - [ ] Refactorizar `frontend/src/components/AuthProvider.tsx` (actualmente >350 líneas)
  - [ ] Simplificar lógica condicional en `frontend/src/components/ProtectedRoute.tsx`
- [ ] **Implementar servicios API estructurados**
  - [ ] Crear clients API específicos por dominio

### Media Prioridad
- [ ] **Eliminar código de logging de depuración**
- [ ] **Estandarizar manejo de errores**
- [ ] **Mejorar nombres de variables y funciones**

## Pruebas y Calidad

### Alta Prioridad
- [ ] **Ampliar cobertura de tests**
  - [ ] Tests unitarios para servicios de autenticación
  - [ ] Tests de integración para flujos de autenticación y autorización
- [ ] **Implementar validación de tipos TypeScript estricta**

### Media Prioridad
- [ ] **Configurar herramientas de análisis estático**
- [ ] **Implementar tests e2e para flujos críticos**

## Escalabilidad

### Alta Prioridad
- [ ] **Separar responsabilidades en servicios backend**

### Media Prioridad
- [ ] **Implementar paginación consistente**
- [ ] **Mejorar gestión de estado en frontend**

## Accesibilidad

### Media Prioridad
- [ ] **Agregar etiquetas ARIA a componentes de autenticación**
- [ ] **Implementar manejo de errores accesible en formularios**
- [ ] **Mejorar contraste y navegación por teclado**

## Plan de Acción por Fases

### Fase 1: Estructura y Tests Previos (3-4 semanas)
- [ ] Preparar estructura para módulo de autenticación
- [ ] Completar tests unitarios para servicios y hooks principales
- [ ] Implementar tests de integración para flujos críticos
- [ ] Configurar herramientas de calidad de código

### Fase 2: Refactorización del Sistema de Autenticación (4-5 semanas)
- [ ] Crear app `authentication` en Django
- [ ] Implementar servicios de tokens en frontend
- [ ] Reducir y simplificar componentes principales
- [ ] Migrar a arquitectura basada en JWT consistente

### Fase 3: Implementación de Control de Acceso (3-4 semanas)
- [ ] Crear app `access` en Django
- [ ] Desarrollar sistema de permisos granular
- [ ] Implementar componentes basados en permisos en frontend
- [ ] Validar cobertura de tests para nuevos componentes

### Fase 4: Optimización y Refinamiento (2-3 semanas)
- [ ] Mejorar rendimiento de componentes críticos
- [ ] Implementar mejoras de accesibilidad
- [ ] Refinar documentación técnica
- [ ] Revisar y actualizar dependencias

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