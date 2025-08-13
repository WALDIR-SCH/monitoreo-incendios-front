-- Script SQL para crear las tablas del sistema de monitoreo de incendios

-- Tabla de incendios
CREATE TABLE IF NOT EXISTS incendio (
    idIncendio VARCHAR(36) PRIMARY KEY,
    idUsuario VARCHAR(36) NOT NULL,
    tipoVegetacion ENUM('BOSQUE', 'PASTIZAL', 'CULTIVO', 'URBANO', 'MIXTO') NOT NULL,
    fuenteIncendio ENUM('NATURAL', 'HUMANO', 'DESCONOCIDO') NOT NULL,
    areaAfectada FLOAT NOT NULL COMMENT 'Área afectada en hectáreas',
    descripcion TEXT,
    nombreCiudad VARCHAR(100) NOT NULL,
    latitud DOUBLE NOT NULL,
    longitud DOUBLE NOT NULL,
    pais VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    poblacion BIGINT,
    nivelUrgencia ENUM('BAJA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL,
    estado ENUM('REPORTADO', 'EN_CURSO', 'CONTROLADO', 'EXTINGUIDO') NOT NULL DEFAULT 'REPORTADO',
    fechaReporte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion TIMESTAMP NULL,
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario) ON DELETE CASCADE,
    INDEX idx_estado (estado),
    INDEX idx_fecha_reporte (fechaReporte),
    INDEX idx_ubicacion (pais, region, nombreCiudad),
    INDEX idx_nivel_urgencia (nivelUrgencia),
    INDEX idx_area_afectada (areaAfectada)
);

-- Tabla de archivos de incendios (fotos y videos)
CREATE TABLE IF NOT EXISTS archivoincendio (
    idArchivo VARCHAR(36) PRIMARY KEY,
    idIncendio VARCHAR(36) NOT NULL,
    nombreArchivo VARCHAR(255) NOT NULL,
    urlArchivo VARCHAR(500) NOT NULL,
    tipoArchivo ENUM('IMAGEN', 'VIDEO') NOT NULL,
    tamanhoArchivo BIGINT COMMENT 'Tamaño en bytes',
    fechaSubida TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idIncendio) REFERENCES incendio(idIncendio) ON DELETE CASCADE,
    INDEX idx_tipo_archivo (tipoArchivo),
    INDEX idx_fecha_subida (fechaSubida)
);

-- Tabla de comentarios y acciones de administradores
CREATE TABLE IF NOT EXISTS comentarioincendio (
    idComentario VARCHAR(36) PRIMARY KEY,
    idIncendio VARCHAR(36) NOT NULL,
    idUsuario VARCHAR(36) NOT NULL COMMENT 'Usuario administrador que hace el comentario',
    comentario TEXT NOT NULL,
    accionTomada TEXT,
    fechaComentario TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idIncendio) REFERENCES incendio(idIncendio) ON DELETE CASCADE,
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario) ON DELETE CASCADE,
    INDEX idx_fecha_comentario (fechaComentario)
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificacion (
    idNotificacion VARCHAR(36) PRIMARY KEY,
    idUsuario VARCHAR(36) NOT NULL COMMENT 'Usuario que recibe la notificación',
    idIncendio VARCHAR(36) NULL COMMENT 'Incendio relacionado (puede ser NULL para notificaciones generales)',
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipoNotificacion ENUM('NUEVO_REPORTE', 'CAMBIO_ESTADO', 'ALERTA_GENERAL', 'SISTEMA') NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fechaCreacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechaLectura TIMESTAMP NULL,
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario) ON DELETE CASCADE,
    FOREIGN KEY (idIncendio) REFERENCES incendio(idIncendio) ON DELETE CASCADE,
    INDEX idx_usuario_leida (idUsuario, leida),
    INDEX idx_fecha_creacion (fechaCreacion),
    INDEX idx_tipo_notificacion (tipoNotificacion)
);

-- Insertar roles si no existen (asumiendo que la tabla 'rol' ya existe)
-- INSERT IGNORE INTO rol (idRol, tipo) VALUES
-- ('UUID-ADMIN', 'ADMINISTRADOR'),
-- ('UUID-USER', 'USUARIO');

-- Crear índices adicionales para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_incendio_usuario ON incendio(idUsuario);
CREATE INDEX IF NOT EXISTS idx_incendio_fecha_estado ON incendio(fechaReporte, estado);
CREATE INDEX IF NOT EXISTS idx_archivo_incendio ON archivoincendio(idIncendio);
CREATE INDEX IF NOT EXISTS idx_comentario_incendio ON comentarioincendio(idIncendio);
CREATE INDEX IF NOT EXISTS idx_notificacion_usuario_fecha ON notificacion(idUsuario, fechaCreacion);

-- Crear vista para estadísticas rápidas
CREATE OR REPLACE VIEW v_estadisticas_incendios AS
SELECT
    COUNT(*) as total_incendios,
    COUNT(CASE WHEN estado = 'REPORTADO' THEN 1 END) as reportados,
    COUNT(CASE WHEN estado = 'EN_CURSO' THEN 1 END) as en_curso,
    COUNT(CASE WHEN estado = 'CONTROLADO' THEN 1 END) as controlados,
    COUNT(CASE WHEN estado = 'EXTINGUIDO' THEN 1 END) as extinguidos,
    COUNT(CASE WHEN nivelUrgencia = 'CRITICA' THEN 1 END) as urgencia_critica,
    COUNT(CASE WHEN nivelUrgencia = 'ALTA' THEN 1 END) as urgencia_alta,
    AVG(areaAfectada) as area_promedio,
    SUM(areaAfectada) as area_total_afectada,
    COUNT(CASE WHEN fechaReporte >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as incendios_ultimas_24h,
    COUNT(CASE WHEN fechaReporte >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as incendios_ultima_semana
FROM incendio;

-- Crear vista para incendios con información de usuario
CREATE OR REPLACE VIEW v_incendios_completos AS
SELECT
    i.*,
    u.nombre as nombre_usuario,
    u.email as email_usuario,
    r.tipo as tipo_usuario,
    (SELECT COUNT(*) FROM archivoincendio a WHERE a.idIncendio = i.idIncendio) as cantidad_archivos,
    (SELECT COUNT(*) FROM comentarioincendio c WHERE c.idIncendio = i.idIncendio) as cantidad_comentarios
FROM incendio i
JOIN usuario u ON i.idUsuario = u.idUsuario
JOIN rol r ON u.idRol = r.idRol;

COMMIT;
