# Plan de Refactorización para Secure Command Center

Este documento recopila las principales áreas de mejora identificadas en el proyecto Secure Command Center y propone un plan estructurado para abordarlas progresivamente.

## Índice
1. [Mejoras de Rendimiento](#mejoras-de-rendimiento)
2. [Mantenibilidad y Código Limpio](#mantenibilidad-y-código-limpio)
3. [Escalabilidad](#escalabilidad)
4. [Accesibilidad](#accesibilidad)
5. [Pruebas y Calidad](#pruebas-y-calidad)
6. [Sistema de Autenticación](#sistema-de-autenticacion)
7. [Plan de Acción por Fases](#plan-de-acción-por-fases)

## Mejoras de Rendimiento

### Media Prioridad

- [ ] **Implementar caché para respuestas API**
- [ ] **Optimizar carga de componentes frontend**

## Mantenibilidad y Código Limpio

### Alta Prioridad

- [ ] **Estructurar llamadas API en frontend**
- [ ] **Aumentar documentación de API**

### Media Prioridad

- [ ] **Refactorizar datos mock**
- [ ] **Mejorar manejo de excepciones**

## Escalabilidad

### Media Prioridad

- [ ] **Implementar paginación**
- [ ] **Mejorar gestión de estado**

## Pruebas y Calidad

### Alta Prioridad

- [ ] **Implementar tests unitarios**

## Sistema de Autenticación

### Diagnóstico
El sistema de autenticación actual mezcla varios enfoques (sesiones Django, JWT, cookies) creando complejidad innecesaria y puntos de fallo. La refactorización debe simplificar el flujo, separar responsabilidades y establecer un modelo consistente.

### Arquitectura Objetivo
- **Backend**: Sistema basado exclusivamente en JWT para API con OAuth para proveedores externos
- **Frontend**: Gestión centralizada de tokens con separación clara de responsabilidades
- **Nueva App `authentication`**: Centralizar toda la lógica de autenticación
- **Nueva App `access`**: Gestión de permisos y control de acceso granular al dashboard

### Plan de Refactorización (Alta Prioridad)

#### Fase 1: Preparación y Tests (1-2 semanas)
- [ ] **Escribir tests unitarios e integración para:**
  - authService (mocks de apiClient)
  - useAuth / AuthProvider
  - LoginPage y ProtectedRoute
- [ ] **Crear nueva app `authentication`**
  - [ ] Migrar vistas de autenticación desde `core`
  - [ ] Simplificar pipelines de OAuth
  - [ ] Crear serializadores específicos para autenticación
- [ ] **Preparar estructura frontend**
  - [ ] Crear módulo `src/auth` para centralizar servicios, hooks y utils

#### Fase 2: Implementación del Núcleo (2-3 semanas)
- [ ] **Simplificar sistema de autenticación backend**
  - [ ] Eliminar dependencias de sesión Django
  - [ ] Consolidar flujo exclusivamente con JWT
  - [ ] Limpiar configuración redundante en settings.py
- [ ] **Refactorizar frontend**
  - [ ] Reestructurar AuthProvider para enfoque basado en JWT
  - [ ] Simplificar flujo de login y redirecciones
  - [ ] Implementar manejo consistente de tokens

#### Fase 3: Sistema de Control de Acceso (2-3 semanas)
- [ ] **Crear nueva app `access`**
  - [ ] Implementar modelo de permisos granulares
  - [ ] Crear API para verificación de permisos
  - [ ] Desarrollar middlewares para validación de acceso
- [ ] **Integrar con frontend**
  - [ ] Implementar componentes condicionales basados en permisos
  - [ ] Crear HOC para protección de componentes por permisos

### Enfoque Recomendado
Se recomienda una **refactorización progresiva** con estas consideraciones:

1. **No hacer todo de una vez** - El sistema actual funciona aunque sea complejo
2. **Implementar por capas** - Empezar por el backend, luego frontend
3. **Usar feature flags** - Permitir cambios graduales sin afectar producción
4. **Implementar tests antes de refactorizar** - Garantizar que no se rompe funcionalidad existente

### Resultado Final
- **Backend**: 
  - Apps separadas: `authentication` (login/registro) y `access` (permisos)
  - API REST clara con endpoints enfocados en responsabilidades específicas
  - Flujo OAuth simplificado que genera tokens JWT

- **Frontend**:
  - Módulo `src/auth` con hooks y contextos especializados
  - Separación entre autenticación (¿quién eres?) y autorización (¿qué puedes ver?)
  - Componentes reutilizables para control de acceso

- **Seguridad mejorada**:
  - Mejor manejo de tokens
  - Validación consistente de permisos
  - Logging de eventos de seguridad

## Plan de Acción por Fases

### Fase 1: Estructura, Mantenibilidad y Tests (Semana 3-4)
- [ ] Escribir tests unitarios para authService, useAuth, ProtectedRoute y LoginPage
- [ ] Escribir tests E2E (Cypress/Playwright) para flujo login → dashboard y logout
- [ ] Crear estructura de servicios API en frontend
- [ ] Implementar sistema de documentación API (OpenAPI / README)
- [ ] Centralizar manejo de errores en servicios
- [ ] Refactorizar sistema de mocks para tests y desarrollo

### Fase 2: Rendimiento y Escalabilidad (Semana 5-6)
- [ ] Implementar sistema de caché
- [ ] Añadir paginación en endpoints
- [ ] Optimizar imágenes Docker
- [ ] Mejorar gestión de estado en frontend

### Fase 3: Pruebas y CI/CD (Semana 7-8)
- [ ] Implementar tests básicos
- [ ] Configurar pipeline CI/CD
- [ ] Mejorar configuración de linting
- [ ] Implementar logging estructurado

### Fase 4: Accesibilidad y Refinamiento (Semana 9-10)
- [ ] Añadir atributos ARIA a componentes críticos
- [ ] Mejorar contraste de colores
- [ ] Implementar monitoreo de errores
- [ ] Revisar y actualizar dependencias