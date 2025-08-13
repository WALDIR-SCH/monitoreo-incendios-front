-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-08-2025 a las 17:43:23
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `monitoreoincendios`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `archivoincendio`
--

CREATE TABLE `archivoincendio` (
  `idArchivo` varchar(36) NOT NULL,
  `idIncendio` varchar(36) NOT NULL,
  `nombreArchivo` varchar(255) NOT NULL,
  `urlArchivo` varchar(500) NOT NULL,
  `tipoArchivo` enum('IMAGEN','VIDEO') NOT NULL,
  `tamanhoArchivo` bigint(20) DEFAULT NULL COMMENT 'Tamaño en bytes',
  `fechaSubida` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `archivoincendio`
--

INSERT INTO `archivoincendio` (`idArchivo`, `idIncendio`, `nombreArchivo`, `urlArchivo`, `tipoArchivo`, `tamanhoArchivo`, `fechaSubida`) VALUES
('453429bd-c480-4443-b1d4-4d22e683779e', 'fd3e65ce-f4c7-42ff-8a31-56aa1a30576c', 'incendio_fd3e65ce-f4c7-42ff-8a31-56aa1a30576c_0.jpg', 'https://anvdtwwhaqhhueiqrtjn.supabase.co/storage/v1/object/public/archivos-incendios/incendios/fd3e65ce-f4c7-42ff-8a31-56aa1a30576c/incendio_fd3e65ce-f4c7-42ff-8a31-56aa1a30576c_0.jpg', 'IMAGEN', 137814, '2025-07-28 14:34:06'),
('5e818226-eeda-4202-a0bf-b0583c5df3aa', '38d07149-1429-45ed-b818-48864e106b61', 'incendio_38d07149-1429-45ed-b818-48864e106b61_0.png', 'https://anvdtwwhaqhhueiqrtjn.supabase.co/storage/v1/object/public/archivos-incendios/incendios/38d07149-1429-45ed-b818-48864e106b61/incendio_38d07149-1429-45ed-b818-48864e106b61_0.png', 'IMAGEN', 89801, '2025-07-27 14:03:46'),
('f45516e3-29a5-4235-a26b-789d13f1f78f', 'adb0e50a-37ea-4707-87b9-89ca2d290b73', 'incendio_adb0e50a-37ea-4707-87b9-89ca2d290b73_0.png', 'https://anvdtwwhaqhhueiqrtjn.supabase.co/storage/v1/object/public/archivos-incendios/incendios/adb0e50a-37ea-4707-87b9-89ca2d290b73/incendio_adb0e50a-37ea-4707-87b9-89ca2d290b73_0.png', 'IMAGEN', 92286, '2025-07-27 14:20:09'),
('c82d521a-142b-4565-8c1b-770b0d03627c', 'd8632f64-2b25-4bff-a090-49620e494c5a', 'incendio_d8632f64-2b25-4bff-a090-49620e494c5a_0.jpg', 'https://anvdtwwhaqhhueiqrtjn.supabase.co/storage/v1/object/public/archivos-incendios/incendios/d8632f64-2b25-4bff-a090-49620e494c5a/incendio_d8632f64-2b25-4bff-a090-49620e494c5a_0.jpg', 'IMAGEN', 29241, '2025-08-12 15:09:49');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comentarioincendio`
--

CREATE TABLE `comentarioincendio` (
  `idComentario` varchar(36) NOT NULL,
  `idIncendio` varchar(36) NOT NULL,
  `idUsuario` varchar(36) NOT NULL COMMENT 'Usuario administrador que hace el comentario',
  `comentario` text NOT NULL,
  `accionTomada` text DEFAULT NULL,
  `fechaComentario` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `comentarioincendio`
--

INSERT INTO `comentarioincendio` (`idComentario`, `idIncendio`, `idUsuario`, `comentario`, `accionTomada`, `fechaComentario`) VALUES
('26de2ef3-0a2e-4d6a-93ad-22d516317b9f', 'adb0e50a-37ea-4707-87b9-89ca2d290b73', 'da92e6f7-6ae7-11f0-9368-40c2bab2b776', 'se extinguio por completo', 'bomberos\nfasfd\nfdsf\n', '2025-07-28 14:58:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `incendio`
--

CREATE TABLE `incendio` (
  `idIncendio` varchar(36) NOT NULL,
  `idUsuario` varchar(36) NOT NULL,
  `tipoVegetacion` enum('BOSQUE','PASTIZAL','CULTIVO','URBANO','MIXTO') NOT NULL,
  `fuenteIncendio` enum('NATURAL','HUMANO','DESCONOCIDO') NOT NULL,
  `areaAfectada` float NOT NULL COMMENT 'Área afectada en hectáreas',
  `descripcion` text DEFAULT NULL,
  `nombreCiudad` varchar(100) NOT NULL,
  `latitud` double NOT NULL,
  `longitud` double NOT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `poblacion` bigint(20) DEFAULT NULL,
  `nivelUrgencia` enum('BAJA','MEDIA','ALTA','CRITICA') NOT NULL,
  `estado` enum('REPORTADO','EN_CURSO','CONTROLADO','EXTINGUIDO') NOT NULL DEFAULT 'REPORTADO',
  `fechaReporte` timestamp NOT NULL DEFAULT current_timestamp(),
  `fechaActualizacion` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `incendio`
--

INSERT INTO `incendio` (`idIncendio`, `idUsuario`, `tipoVegetacion`, `fuenteIncendio`, `areaAfectada`, `descripcion`, `nombreCiudad`, `latitud`, `longitud`, `pais`, `region`, `poblacion`, `nivelUrgencia`, `estado`, `fechaReporte`, `fechaActualizacion`) VALUES
('38d07149-1429-45ed-b818-48864e106b61', '7d8044cc-ba0b-4d92-ae17-ffd29c3c204f', 'MIXTO', 'DESCONOCIDO', 4, 'esta es la prueba', 'Abancay', -13.647872, -72.9055232, 'PE', 'Apurímac', 72277, 'BAJA', 'EXTINGUIDO', '2025-07-27 14:03:44', '2025-07-28 14:56:54'),
('503a9980-1406-49e4-a43c-1d9e75ef13e3', '7d8044cc-ba0b-4d92-ae17-ffd29c3c204f', 'MIXTO', 'DESCONOCIDO', 4, 'esta es la prueba2', 'Abancay', -13.647872, -72.9055232, 'PE', 'Apurímac', 72277, 'BAJA', 'REPORTADO', '2025-07-27 14:08:42', NULL),
('adb0e50a-37ea-4707-87b9-89ca2d290b73', '063a127a-73b2-486c-a009-3d560665ef29', 'BOSQUE', 'HUMANO', 10, '22dddsasssss', 'Abancay', -13.647872, -72.9055232, 'PE', 'Apurímac', 72277, 'MEDIA', 'EXTINGUIDO', '2025-07-27 14:20:08', '2025-07-28 14:59:19'),
('c01745a3-acbf-41d4-90fd-e252f9fd31a7', '063a127a-73b2-486c-a009-3d560665ef29', 'URBANO', 'NATURAL', 555, 'desde andahyaulas', 'Andahuaylas', -13.6575, -73.3833, 'PE', 'Apurimac', 80000, 'CRITICA', 'REPORTADO', '2025-07-27 14:29:17', '2025-07-28 13:23:41'),
('fd3e65ce-f4c7-42ff-8a31-56aa1a30576c', '9ad6987c-6800-456c-9d85-4bab771c73d1', 'BOSQUE', 'HUMANO', 30, 'aaasdffvvvvvvvvvvvvvvvvvvdssdccccccccccccccc', 'Abancay', -13.6440034, -72.8942007, 'PE', 'Apurímac', 72277, 'MEDIA', 'REPORTADO', '2025-07-28 14:34:05', NULL),
('d8632f64-2b25-4bff-a090-49620e494c5a', 'b50b9411-54c5-403f-b63d-8b30c5d86f04', 'URBANO', 'DESCONOCIDO', 3, 'se quema unamba ', 'Abancay', -13.616794329686272, -72.86790281336386, 'PE', 'Apurímac', 72277, 'BAJA', 'REPORTADO', '2025-08-12 15:09:46', '2025-08-12 15:11:06');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificacion`
--

CREATE TABLE `notificacion` (
  `idNotificacion` varchar(36) NOT NULL,
  `idUsuario` varchar(36) NOT NULL COMMENT 'Usuario que recibe la notificación',
  `idIncendio` varchar(36) DEFAULT NULL COMMENT 'Incendio relacionado (puede ser NULL para notificaciones generales)',
  `titulo` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `tipoNotificacion` enum('NUEVO_REPORTE','CAMBIO_ESTADO','ALERTA_GENERAL','SISTEMA') NOT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `fechaCreacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fechaLectura` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notificacion`
--

INSERT INTO `notificacion` (`idNotificacion`, `idUsuario`, `idIncendio`, `titulo`, `mensaje`, `tipoNotificacion`, `leida`, `fechaCreacion`, `fechaLectura`) VALUES
('5c8e94ef-17c5-49cc-a2e8-19c702fade16', '063a127a-73b2-486c-a009-3d560665ef29', 'adb0e50a-37ea-4707-87b9-89ca2d290b73', 'Actualización de Estado de Incendio', 'El estado de su reporte de incendio en Abancay ha cambiado de REPORTADO a REPORTADO.', 'CAMBIO_ESTADO', 0, '2025-07-28 14:58:36', NULL),
('71c30894-ee5c-4b1a-b303-c0ef0e7eafd7', '7d8044cc-ba0b-4d92-ae17-ffd29c3c204f', '38d07149-1429-45ed-b818-48864e106b61', 'Actualización de Estado de Incendio', 'El estado de su reporte de incendio en Abancay ha cambiado de EN_CURSO a EXTINGUIDO.', 'CAMBIO_ESTADO', 0, '2025-07-28 14:56:54', NULL),
('7c650f94-a243-4239-b083-acb126a3eb8a', 'da92e6f7-6ae7-11f0-9368-40c2bab2b776', '503a9980-1406-49e4-a43c-1d9e75ef13e3', 'Nuevo Reporte de Incendio', 'Se ha reportado un nuevo incendio en Abancay, PE. Nivel de urgencia: BAJA. Área afectada: 4,00 hectáreas.', 'NUEVO_REPORTE', 0, '2025-07-27 14:08:42', NULL),
('7d3f22d1-0729-4733-bbae-f3cb6e67a72d', 'da92e6f7-6ae7-11f0-9368-40c2bab2b776', 'adb0e50a-37ea-4707-87b9-89ca2d290b73', 'Nuevo Reporte de Incendio', 'Se ha reportado un nuevo incendio en Abancay, PE. Nivel de urgencia: MEDIA. Área afectada: 10,00 hectáreas.', 'NUEVO_REPORTE', 0, '2025-07-27 14:20:10', NULL),
('7e228d4e-6616-4922-acdf-fb1e6206c755', '063a127a-73b2-486c-a009-3d560665ef29', 'adb0e50a-37ea-4707-87b9-89ca2d290b73', 'Actualización de Estado de Incendio', 'El estado de su reporte de incendio en Abancay ha cambiado de REPORTADO a EXTINGUIDO.', 'CAMBIO_ESTADO', 0, '2025-07-28 14:59:19', NULL),
('7f3dc873-83f5-441a-ab11-875fb2d8e046', '7d8044cc-ba0b-4d92-ae17-ffd29c3c204f', '38d07149-1429-45ed-b818-48864e106b61', 'Actualización de Estado de Incendio', 'El estado de su reporte de incendio en Abancay ha cambiado de REPORTADO a EN_CURSO.', 'CAMBIO_ESTADO', 0, '2025-07-28 14:56:32', NULL),
('818cb45e-ebfe-4e66-a56a-bc26a1766965', 'da92e6f7-6ae7-11f0-9368-40c2bab2b776', 'c01745a3-acbf-41d4-90fd-e252f9fd31a7', 'Nuevo Reporte de Incendio', 'Se ha reportado un nuevo incendio en Andahuaylas, PE. Nivel de urgencia: CRITICA. Área afectada: 555,00 hectáreas.', 'NUEVO_REPORTE', 0, '2025-07-27 14:29:17', NULL),
('c3c7b25c-563a-4dc5-82f3-aef9de171cac', 'da92e6f7-6ae7-11f0-9368-40c2bab2b776', 'fd3e65ce-f4c7-42ff-8a31-56aa1a30576c', 'Nuevo Reporte de Incendio', 'Se ha reportado un nuevo incendio en Abancay, PE. Nivel de urgencia: MEDIA. Área afectada: 30,00 hectáreas.', 'NUEVO_REPORTE', 0, '2025-07-28 14:34:06', NULL),
('c9a11a47-e5ed-4b35-aa5b-00f542dced35', 'da92e6f7-6ae7-11f0-9368-40c2bab2b776', '38d07149-1429-45ed-b818-48864e106b61', 'Nuevo Reporte de Incendio', 'Se ha reportado un nuevo incendio en Abancay, PE. Nivel de urgencia: BAJA. Área afectada: 4,00 hectáreas.', 'NUEVO_REPORTE', 0, '2025-07-27 14:03:46', NULL),
('a61d42ec-fd19-48d0-8ca6-104975a0016c', 'da92e6f7-6ae7-11f0-9368-40c2bab2b776', 'd8632f64-2b25-4bff-a090-49620e494c5a', 'Nuevo Reporte de Incendio', 'Se ha reportado un nuevo incendio en Abancay, PE. Nivel de urgencia: BAJA. Área afectada: 3,00 hectáreas.', 'NUEVO_REPORTE', 1, '2025-08-12 15:09:49', '2025-08-12 15:10:20'),
('ad7308ac-62d5-4bf5-bbc9-25665b3d5380', 'b50b9411-54c5-403f-b63d-8b30c5d86f04', 'd8632f64-2b25-4bff-a090-49620e494c5a', 'Actualización de Estado de Incendio', 'El estado de su reporte de incendio en Abancay ha cambiado de REPORTADO a REPORTADO.', 'CAMBIO_ESTADO', 0, '2025-08-12 15:11:06', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol`
--

CREATE TABLE `rol` (
  `idRol` char(36) NOT NULL,
  `tipo` enum('ADMINISTRADOR','USUARIO') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `rol`
--

INSERT INTO `rol` (`idRol`, `tipo`) VALUES
('71f3466a-6a79-11f0-8f57-40c2bab2b776', 'ADMINISTRADOR'),
('7a56555e-6a79-11f0-8f57-40c2bab2b776', 'USUARIO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `idUsuario` varchar(255) NOT NULL,
  `idRol` varchar(255) DEFAULT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `contrasenha` varchar(255) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `fechaRegistro` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`idUsuario`, `idRol`, `nombre`, `email`, `contrasenha`, `foto`, `fechaRegistro`) VALUES
('063a127a-73b2-486c-a009-3d560665ef29', '7a56555e-6a79-11f0-8f57-40c2bab2b776', 'Cristian Oner', 'oliverachavezcristian@gmail.com', NULL, 'https://anvdtwwhaqhhueiqrtjn.supabase.co/storage/v1/object/public/perfil-incendios/foto/063a127a-73b2-486c-a009-3d560665ef29.png', '2025-07-26 18:37:26.761000'),
('7d8044cc-ba0b-4d92-ae17-ffd29c3c204f', '7a56555e-6a79-11f0-8f57-40c2bab2b776', 'Cris', 'cris@gmail.com', '2mbMIAYMp6KAbJdlV7eZcw==', 'https://anvdtwwhaqhhueiqrtjn.supabase.co/storage/v1/object/public/perfil-incendios/foto/7d8044cc-ba0b-4d92-ae17-ffd29c3c204f.png', '2025-07-27 07:38:19.742000'),
('9ad6987c-6800-456c-9d85-4bab771c73d1', '7a56555e-6a79-11f0-8f57-40c2bab2b776', 'Cristian Olivera Chavez', '221181@unamba.edu.pe', NULL, 'https://anvdtwwhaqhhueiqrtjn.supabase.co/storage/v1/object/public/perfil-incendios/foto/9ad6987c-6800-456c-9d85-4bab771c73d1.png', '2025-07-28 09:33:11.563000'),
('da92e6f7-6ae7-11f0-9368-40c2bab2b776', '71f3466a-6a79-11f0-8f57-40c2bab2b776', 'Olivera Cristian', 'admin@gmail.com', '2mbMIAYMp6KAbJdlV7eZcw==', 'https://tailwindcss.com/_next/static/media/card.a1cd9cff.jpg', '2025-07-07 07:47:06.000000'),
('b50b9411-54c5-403f-b63d-8b30c5d86f04', '7a56555e-6a79-11f0-8f57-40c2bab2b776', 'Waldir Se�o Chipane', '172170@unamba.edu.pe', NULL, 'https://anvdtwwhaqhhueiqrtjn.supabase.co/storage/v1/object/public/perfil-incendios/foto/b50b9411-54c5-403f-b63d-8b30c5d86f04.png', '2025-08-12 10:08:05.984000'),
('062b1e1f-7793-11f0-9743-08bfb8d1250f', '71f3466a-6a79-11f0-8f57-40c2bab2b776', 'Waldir Seño', 'lancelot@gmail.com', '2mbMIAYMp6KAbJdlV7eZcw==', 'https://cdn.pixabay.com/photo/2021/08/04/13/06/software-developer-6521720_1280.jpg', '2025-08-12 10:42:59.000000');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `v_incendios_completos`
--

CREATE TABLE `v_incendios_completos` (
  `idIncendio` varchar(36) DEFAULT NULL,
  `idUsuario` varchar(36) DEFAULT NULL,
  `tipoVegetacion` enum('BOSQUE','PASTIZAL','CULTIVO','URBANO','MIXTO') DEFAULT NULL,
  `fuenteIncendio` enum('NATURAL','HUMANO','DESCONOCIDO') DEFAULT NULL,
  `areaAfectada` float DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `nombreCiudad` varchar(100) DEFAULT NULL,
  `latitud` double DEFAULT NULL,
  `longitud` double DEFAULT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `poblacion` bigint(20) DEFAULT NULL,
  `nivelUrgencia` enum('BAJA','MEDIA','ALTA','CRITICA') DEFAULT NULL,
  `estado` enum('REPORTADO','EN_CURSO','CONTROLADO','EXTINGUIDO') DEFAULT NULL,
  `fechaReporte` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `fechaActualizacion` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `nombre_usuario` varchar(255) DEFAULT NULL,
  `email_usuario` varchar(255) DEFAULT NULL,
  `tipo_usuario` enum('ADMINISTRADOR','USUARIO') DEFAULT NULL,
  `cantidad_archivos` bigint(21) DEFAULT NULL,
  `cantidad_comentarios` bigint(21) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
