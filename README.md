# Sistema de Monitoreo de Incendios Backend y Frontend

## Descripción
Este sistema permite a los usuarios reportar incendios forestales y a los administradores gestionar y monitorear estos reportes. Incluye funcionalidades de notificaciones, exportación de datos y seguimiento del estado de los incendios.

## Características Principales

### 🔥 **Gestión de Incendios**
- Reporte de incendios con ubicación GPS automática
- Adjuntar múltiples fotos y videos
- Clasificación automática del nivel de urgencia
- Estados: REPORTADO → EN_CURSO → CONTROLADO → EXTINGUIDO

### 👥 **Tipos de Usuario**
- **Usuarios**: Pueden reportar incendios
- **Administradores**: Pueden actualizar estados, agregar comentarios y gestionar reportes

### 📊 **Funcionalidades de Monitoreo**
- Filtros avanzados por fecha, ubicación, estado, etc.
- Historial completo de incendios
- Áreas que necesitan restauración
- Alertas de incendios recientes

### 🔔 **Sistema de Notificaciones**
- Notificaciones automáticas a administradores sobre nuevos reportes
- Alertas de cambio de estado
- Notificaciones generales del sistema

### 📋 **Exportación de Datos**
- Exportar en formato JSON, CSV y Excel
- Reportes personalizables con filtros

## Endpoints de la API

## Nivel de Urgencia Automático

El sistema calcula automáticamente el nivel de urgencia basado en el área afectada:

- **BAJA**: < 10 hectáreas
- **MEDIA**: 10-49 hectáreas
- **ALTA**: 50-99 hectáreas
- **CRÍTICA**: ≥ 100 hectáreas

## Seguridad

- Validación de permisos por rol
- Solo administradores pueden actualizar estados
- Validación de propiedad de recursos
- Sanitización de datos de entrada

## Estados del Ciclo de Vida

```
REPORTADO → EN_CURSO → CONTROLADO → EXTINGUIDO
    ↑                                    ↓
    └── (Puede volver a estados anteriores) ←┘
```
