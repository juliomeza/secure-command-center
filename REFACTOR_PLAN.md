# Plan de Refactorización para Secure Command Center (Revisión 2025-05-01)

Este documento describe las áreas de mejora identificadas y propone un plan estructurado para refactorizar el proyecto Secure Command Center, enfocándose en la modularidad, mantenibilidad y extensibilidad.

## Índice
1. [Backend: Estructura y Configuración](#backend-estructura-y-configuración)
2. [Backend: Lógica de Negocio y API](#backend-lógica-de-negocio-y-api)
3. [Frontend: Estructura y Componentes](#frontend-estructura-y-componentes)
4. [Frontend: Manejo de Estado y API](#frontend-manejo-de-estado-y-api)
5. [Calidad del Código y Mantenibilidad (General)](#calidad-del-código-y-mantenibilidad-general)
6. [Pruebas](#pruebas)
7. [Rendimiento](#rendimiento)
8. [Seguridad](#seguridad)

---

## Backend: Estructura y Configuración

### Media Prioridad
- [ ] **Revisar y Simplificar Configuración de Cookies:** Asegurar que la lógica en `settings.py` para `SESSION_COOKIE_*` y `CSRF_COOKIE_*` sea clara, esté actualizada y los comentarios sean precisos. Eliminar configuraciones o comentarios obsoletos.
- [x] **Reestructurar Modelos de Control de Acceso:** Implementar un sistema robusto de control de acceso con modelos dedicados para Compañías, Almacenes y Tabs.

---

## Backend: Lógica de Negocio y API

### Alta Prioridad (Próximos pasos recomendados)
- [ ] **Implementar Capa de Servicios:** En las apps (`authentication`, `access`), extraer la lógica de negocio compleja de las vistas (`views.py`) y modelos (`models.py`) a módulos `services.py` para mejorar la reutilización, testeabilidad y mantener las vistas delgadas.
- [x] **Refinar Responsabilidades de Apps:** Asegurar que las apps `authentication` y `access` tengan responsabilidades claramente definidas y no haya superposición innecesaria.
- [ ] **Documentar API Endpoints:** Añadir documentación clara para todos los endpoints de la API, especialmente los relacionados con permisos de acceso, utilizando Swagger/OpenAPI.

### Media Prioridad
- [ ] **Extender Validaciones de UserProfile:** Mejorar las validaciones en el modelo UserProfile para manejar casos borde y posibles inconsistencias de datos, especialmente en la vinculación de usuarios pre-configurados.
- [ ] **Optimizar Consultas a la Base de Datos:** Revisar y optimizar consultas complejas, especialmente en las relaciones many-to-many de los permisos de usuario.

---

## Frontend: Estructura y Componentes

### Alta Prioridad (Próximos pasos recomendados)
- [ ] **Descomponer Componentes Grandes:** Revisar componentes como `ExecutiveDashboard.tsx` y vistas en `src/views/` para identificar oportunidades de dividirlos en subcomponentes más pequeños, reutilizables y enfocados.
- [ ] **Adoptar CSS Modular:** Considerar migrar de CSS global (`App.css`, `index.css`) a una solución como CSS Modules, Styled Components, Emotion o Tailwind CSS para mejorar la encapsulación de estilos y evitar colisiones.
- [ ] **Crear Índices de Exportación (`index.ts`):** Añadir archivos `index.ts` en directorios clave (ej. `components/common`, `hooks`, `services`) para simplificar las importaciones.
- [x] **Implementar Gestión de Permisos UI:** Desarrollar componentes para mostrar u ocultar elementos basados en los permisos del usuario (tabs/paneles).

---

## Frontend: Manejo de Estado y API

### Media Prioridad
- [ ] **Evaluar Biblioteca de Estado Global:** Si la complejidad del estado crece, evaluar la migración de `AuthContext` a una solución como Zustand o Jotai para una gestión más robusta y escalable.
- [x] **Formalizar Capa de Servicios API:** Crear servicios específicos para manejar las peticiones relacionadas con la autenticación y los permisos de usuario.

### Baja Prioridad
- [ ] **Implementar Caché Client-Side para Permisos:** Optimizar las peticiones de permisos para reducir llamadas redundantes al backend.

---

## Calidad del Código y Mantenibilidad (General)

### Alta Prioridad (Próximos pasos recomendados)
- [ ] **Estandarizar Manejo de Errores:** Definir y aplicar un patrón consistente para el manejo y reporte de errores en el backend (vistas, servicios) y frontend (llamadas API, componentes).
- [ ] **Mejorar Nombres:** Revisar nombres de variables, funciones, clases y componentes para asegurar que sean descriptivos y sigan convenciones consistentes (snake_case en Python, camelCase/PascalCase en TS/React).
- [x] **Configurar Linters/Formatters:** Asegurar que linters (ESLint, Flake8) y formatters (Prettier, Black) estén configurados y se usen consistentemente en ambos proyectos para mantener un estilo de código uniforme.
- [x] **Añadir Documentación:** Incorporar docstrings (Python) y comentarios claros para modelos, vistas y funciones complejas.

### Media Prioridad
- [ ] **Revisar y Consolidar Constantes:** Identificar valores "mágicos" y moverlos a módulos de constantes o archivos de configuración.

---

## Pruebas

### Media Prioridad
- [x] **Incrementar Cobertura de Pruebas Unitarias:** Añadir más pruebas unitarias para lógica de negocio, especialmente para el sistema de control de acceso.
- [ ] **Implementar Pruebas de Integración/E2E:** Añadir pruebas de integración para flujos clave (ej. autenticación completa) y considerar pruebas E2E (con Cypress o Playwright) para verificar la interacción del usuario.

---

## Rendimiento

### Media Prioridad
- [ ] **Optimizar Carga de Componentes Frontend:** Investigar y aplicar técnicas como `React.lazy` y `Suspense` para la carga diferida (code-splitting) de componentes/rutas pesadas.
- [ ] **Implementar Caché API (Backend):** Identificar endpoints de API que devuelvan datos que cambian con poca frecuencia y considerar implementar estrategias de caché (ej. con `django-cachops` o caché de Django a nivel de vista/template).

---

## Seguridad

### Alta Prioridad
- [x] **Implementar Sistema Robusto de Control de Acceso:** Desarrollar un sistema multi-nivel de permisos para controlar el acceso a funcionalidades y datos basado en el perfil del usuario.

### Revisión Continua
- [ ] **Mantener Dependencias Actualizadas:** Revisar y actualizar regularmente las dependencias (Python y Node.js) para parchear vulnerabilidades conocidas.
- [ ] **Revisar Configuraciones de Seguridad:** Periódicamente revisar las configuraciones de seguridad en `settings.py` (SSL, HSTS, CORS, CSRF, JWT) para asegurar que siguen las mejores prácticas.
