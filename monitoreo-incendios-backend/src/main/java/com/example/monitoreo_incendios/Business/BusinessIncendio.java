package com.example.monitoreo_incendios.Business;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.Sheet;

import com.example.monitoreo_incendios.Dto.DtoActualizarEstadoIncendio;
import com.example.monitoreo_incendios.Dto.DtoArchivoIncendio;
import com.example.monitoreo_incendios.Dto.DtoComentarioIncendio;
import com.example.monitoreo_incendios.Dto.DtoFiltroIncendio;
import com.example.monitoreo_incendios.Dto.DtoReporteIncendio;
import com.example.monitoreo_incendios.Entity.TArchivoIncendio;
import com.example.monitoreo_incendios.Entity.TComentarioIncendio;
import com.example.monitoreo_incendios.Entity.TIncendio;
import com.example.monitoreo_incendios.Entity.TUser;
import com.example.monitoreo_incendios.Repository.RepoArchivoIncendio;
import com.example.monitoreo_incendios.Repository.RepoComentarioIncendio;
import com.example.monitoreo_incendios.Repository.RepoIncendio;
import com.example.monitoreo_incendios.Repository.RepoUser;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.transaction.Transactional;

@Service
public class BusinessIncendio {

  @Autowired
  private RepoIncendio repoIncendio;

  @Autowired
  private RepoUser repoUser;

  @Autowired
  private RepoArchivoIncendio repoArchivoIncendio;

  @Autowired
  private RepoComentarioIncendio repoComentarioIncendio;

  @Autowired
  private SupabaseStorageService supabaseStorageService;

  @Autowired
  private BusinessNotificacion businessNotificacion;

  @Transactional
  public DtoReporteIncendio crearReporteIncendio(DtoReporteIncendio dto) throws Exception {
    // Validar que el usuario existe
    Optional<TUser> usuarioOpt = repoUser.findById(dto.getIdUsuario());
    if (!usuarioOpt.isPresent()) {
      throw new RuntimeException("Usuario no encontrado");
    }

    TUser usuario = usuarioOpt.get();

    // Crear el incendio
    TIncendio incendio = new TIncendio();
    incendio.setIdIncendio(UUID.randomUUID().toString());
    incendio.setUsuario(usuario);
    incendio.setTipoVegetacion(TIncendio.TipoVegetacion.valueOf(dto.getTipoVegetacion()));
    incendio.setFuenteIncendio(TIncendio.FuenteIncendio.valueOf(dto.getFuenteIncendio()));
    incendio.setAreaAfectada(dto.getAreaAfectada());
    incendio.setDescripcion(dto.getDescripcion());
    incendio.setNombreCiudad(dto.getNombreCiudad());
    incendio.setLatitud(dto.getLatitud());
    incendio.setLongitud(dto.getLongitud());
    incendio.setPais(dto.getPais());
    incendio.setRegion(dto.getRegion());
    incendio.setPoblacion(dto.getPoblacion());

    // Calcular nivel de urgencia automáticamente
    incendio.setNivelUrgencia(calcularNivelUrgencia(dto.getAreaAfectada()));

    incendio.setEstado(TIncendio.EstadoIncendio.REPORTADO);
    incendio.setFechaReporte(new Timestamp(System.currentTimeMillis()));

    // Guardar el incendio
    incendio = repoIncendio.save(incendio);

    // Subir archivos si existen
    List<DtoArchivoIncendio> archivosSubidos = new ArrayList<>();
    if (dto.getArchivos() != null && !dto.getArchivos().isEmpty()) {
      archivosSubidos = subirArchivos(incendio.getIdIncendio(), dto.getArchivos());
    }

    // Crear notificaciones para administradores
    businessNotificacion.crearNotificacionNuevoReporte(incendio);

    // Mapear a DTO para respuesta
    dto.setIdIncendio(incendio.getIdIncendio());
    dto.setNivelUrgencia(incendio.getNivelUrgencia().name());
    dto.setEstado(incendio.getEstado().name());
    dto.setFechaReporte(incendio.getFechaReporte());
    dto.setArchivosSubidos(archivosSubidos);

    return dto;
  }

  private TIncendio.NivelUrgencia calcularNivelUrgencia(Float areaAfectada) {
    if (areaAfectada == null) {
      return TIncendio.NivelUrgencia.BAJA;
    }

    if (areaAfectada >= 100.0f) {
      return TIncendio.NivelUrgencia.CRITICA;
    } else if (areaAfectada >= 50.0f) {
      return TIncendio.NivelUrgencia.ALTA;
    } else if (areaAfectada >= 10.0f) {
      return TIncendio.NivelUrgencia.MEDIA;
    } else {
      return TIncendio.NivelUrgencia.BAJA;
    }
  }

  private List<DtoArchivoIncendio> subirArchivos(String idIncendio, List<MultipartFile> archivos) throws Exception {
    List<DtoArchivoIncendio> archivosSubidos = new ArrayList<>();

    for (int i = 0; i < archivos.size(); i++) {
      MultipartFile archivo = archivos.get(i);
      if (archivo.isEmpty())
        continue;

      // Determinar tipo de archivo
      String contentType = archivo.getContentType();
      TArchivoIncendio.TipoArchivo tipoArchivo;

      if (contentType != null && contentType.startsWith("image/")) {
        tipoArchivo = TArchivoIncendio.TipoArchivo.IMAGEN;
      } else if (contentType != null && contentType.startsWith("video/")) {
        tipoArchivo = TArchivoIncendio.TipoArchivo.VIDEO;
      } else {
        throw new RuntimeException("Tipo de archivo no soportado: " + contentType);
      }

      // Generar nombre único para el archivo
      String extension = obtenerExtension(archivo.getOriginalFilename());
      String nombreArchivo = "incendio_" + idIncendio + "_" + i + extension;
      String rutaArchivo = "incendios/" + idIncendio + "/" + nombreArchivo;

      // Subir a Supabase
      String urlArchivo = supabaseStorageService.uploadFileToBucket2(
          archivo.getBytes(),
          rutaArchivo,
          contentType);

      // Guardar en base de datos
      TArchivoIncendio tArchivo = new TArchivoIncendio();
      tArchivo.setIdArchivo(UUID.randomUUID().toString());
      tArchivo.setIncendio(repoIncendio.findById(idIncendio).get());
      tArchivo.setNombreArchivo(nombreArchivo);
      tArchivo.setUrlArchivo(urlArchivo);
      tArchivo.setTipoArchivo(tipoArchivo);
      tArchivo.setTamanhoArchivo(archivo.getSize());
      tArchivo.setFechaSubida(new Timestamp(System.currentTimeMillis()));

      tArchivo = repoArchivoIncendio.save(tArchivo);

      // Mapear a DTO
      DtoArchivoIncendio dtoArchivo = new DtoArchivoIncendio();
      dtoArchivo.setIdArchivo(tArchivo.getIdArchivo());
      dtoArchivo.setIdIncendio(idIncendio);
      dtoArchivo.setNombreArchivo(tArchivo.getNombreArchivo());
      dtoArchivo.setUrlArchivo(tArchivo.getUrlArchivo());
      dtoArchivo.setTipoArchivo(tArchivo.getTipoArchivo().name());
      dtoArchivo.setTamanhoArchivo(tArchivo.getTamanhoArchivo());
      dtoArchivo.setFechaSubida(tArchivo.getFechaSubida());

      archivosSubidos.add(dtoArchivo);
    }

    return archivosSubidos;
  }

  private String obtenerExtension(String nombreArchivo) {
    if (nombreArchivo != null && nombreArchivo.contains(".")) {
      return nombreArchivo.substring(nombreArchivo.lastIndexOf("."));
    }
    return "";
  }

  public Page<DtoReporteIncendio> obtenerIncendiosConFiltros(DtoFiltroIncendio filtro) {
    // Configurar paginación y ordenamiento
    Sort sort = Sort.by(Sort.Direction.fromString(filtro.getSortDirection()), filtro.getSortBy());
    Pageable pageable = PageRequest.of(filtro.getPage(), filtro.getSize(), sort);

    // Convertir filtros de string a enum cuando sea necesario
    TIncendio.EstadoIncendio estado = null;
    if (filtro.getEstado() != null && !filtro.getEstado().isEmpty()) {
      estado = TIncendio.EstadoIncendio.valueOf(filtro.getEstado());
    }

    TIncendio.NivelUrgencia nivelUrgencia = null;
    if (filtro.getNivelUrgencia() != null && !filtro.getNivelUrgencia().isEmpty()) {
      nivelUrgencia = TIncendio.NivelUrgencia.valueOf(filtro.getNivelUrgencia());
    }

    // Convertir fechas
    Timestamp fechaInicio = null;
    Timestamp fechaFin = null;
    if (filtro.getFechaInicio() != null && !filtro.getFechaInicio().isEmpty()) {
      fechaInicio = Timestamp.valueOf(filtro.getFechaInicio() + " 00:00:00");
    }
    if (filtro.getFechaFin() != null && !filtro.getFechaFin().isEmpty()) {
      fechaFin = Timestamp.valueOf(filtro.getFechaFin() + " 23:59:59");
    }

    // Buscar con filtros
    Page<TIncendio> pageIncendios = repoIncendio.findWithFilters(
        estado, fechaInicio, fechaFin, filtro.getPais(), filtro.getRegion(),
        filtro.getNombreCiudad(), nivelUrgencia, filtro.getAreaMinima(),
        filtro.getAreaMaxima(), pageable);

    return pageIncendios.map(this::convertirADto);
  }

  public DtoReporteIncendio obtenerIncendioPorId(String idIncendio) {
    Optional<TIncendio> incendioOpt = repoIncendio.findById(idIncendio);
    if (!incendioOpt.isPresent()) {
      throw new RuntimeException("Incendio no encontrado");
    }

    return convertirADtoCompleto(incendioOpt.get());
  }

  @Transactional
  public DtoReporteIncendio actualizarEstadoIncendio(DtoActualizarEstadoIncendio dto) throws Exception {
    // Validar que el incendio existe
    Optional<TIncendio> incendioOpt = repoIncendio.findById(dto.getIdIncendio());
    if (!incendioOpt.isPresent()) {
      throw new RuntimeException("Incendio no encontrado");
    }

    // Validar que el usuario es administrador
    Optional<TUser> adminOpt = repoUser.findById(dto.getIdUsuarioAdmin());
    if (!adminOpt.isPresent()) {
      throw new RuntimeException("Usuario administrador no encontrado");
    }

    TUser admin = adminOpt.get();
    if (!"ADMINISTRADOR".equals(admin.getRol().getTipo().name())) {
      throw new RuntimeException("Solo los administradores pueden actualizar el estado de incendios");
    }

    TIncendio incendio = incendioOpt.get();
    TIncendio.EstadoIncendio estadoAnterior = incendio.getEstado();

    // Actualizar estado
    incendio.setEstado(TIncendio.EstadoIncendio.valueOf(dto.getNuevoEstado()));
    incendio.setFechaActualizacion(new Timestamp(System.currentTimeMillis()));

    incendio = repoIncendio.save(incendio);

    // Agregar comentario si existe
    if (dto.getComentario() != null && !dto.getComentario().isEmpty()) {
      TComentarioIncendio comentario = new TComentarioIncendio();
      comentario.setIdComentario(UUID.randomUUID().toString());
      comentario.setIncendio(incendio);
      comentario.setUsuario(admin);
      comentario.setComentario(dto.getComentario());
      comentario.setAccionTomada(dto.getAccionTomada());
      comentario.setFechaComentario(new Timestamp(System.currentTimeMillis()));

      repoComentarioIncendio.save(comentario);
    }

    // Crear notificación de cambio de estado
    businessNotificacion.crearNotificacionCambioEstado(incendio, estadoAnterior, admin);

    return convertirADtoCompleto(incendio);
  }

  public List<DtoReporteIncendio> obtenerIncendiosRecientes() {
    // Obtener incendios de las últimas 48 horas
    Timestamp hace48Horas = new Timestamp(System.currentTimeMillis() - (48L * 60 * 60 * 1000));
    List<TIncendio> incendiosRecientes = repoIncendio.findIncendiosRecientes(hace48Horas);

    return incendiosRecientes.stream()
        .map(this::convertirADto)
        .toList();
  }

 public List<DtoReporteIncendio> obtenerIncendiosRecientesMes() {
    // Obtener incendios del último mes
    Timestamp haceUnMes = Timestamp.valueOf(LocalDateTime.now().minusMonths(1));
    List<TIncendio> incendiosRecientes = repoIncendio.findIncendiosRecientes(haceUnMes);

    return incendiosRecientes.stream()
        .map(this::convertirADtoCompleto)
        .toList();
}

  public List<DtoReporteIncendio> obtenerIncendiosActivos() {
    List<TIncendio> incendiosActivos = repoIncendio.findIncendiosActivos();

    return incendiosActivos.stream()
        .map(this::convertirADto)
        .toList();
  }

  public List<DtoReporteIncendio> obtenerIncendiosParaRestauracion(Float areaMinima) {
    if (areaMinima == null) {
      areaMinima = 5.0f; // Área mínima por defecto
    }

    List<TIncendio> incendiosParaRestauracion = repoIncendio.findIncendiosParaRestauracion(areaMinima);

    return incendiosParaRestauracion.stream()
        .map(this::convertirADto)
        .toList();
  }

  // Métodos para gestión de incendios por usuario
  public Page<DtoReporteIncendio> obtenerIncendiosPorUsuario(String idUsuario, DtoFiltroIncendio filtro) {
    // Validar que el usuario existe
    Optional<TUser> usuarioOpt = repoUser.findById(idUsuario);
    if (!usuarioOpt.isPresent()) {
      throw new RuntimeException("Usuario no encontrado");
    }

    // Configurar paginación y ordenamiento
    Sort sort = Sort.by(Sort.Direction.fromString(filtro.getSortDirection()), filtro.getSortBy());
    Pageable pageable = PageRequest.of(filtro.getPage(), filtro.getSize(), sort);

    // Convertir filtros de string a enum cuando sea necesario
    TIncendio.EstadoIncendio estado = null;
    if (filtro.getEstado() != null && !filtro.getEstado().isEmpty()) {
      estado = TIncendio.EstadoIncendio.valueOf(filtro.getEstado());
    }

    TIncendio.NivelUrgencia nivelUrgencia = null;
    if (filtro.getNivelUrgencia() != null && !filtro.getNivelUrgencia().isEmpty()) {
      nivelUrgencia = TIncendio.NivelUrgencia.valueOf(filtro.getNivelUrgencia());
    }

    // Convertir fechas
    Timestamp fechaInicio = null;
    Timestamp fechaFin = null;
    if (filtro.getFechaInicio() != null && !filtro.getFechaInicio().isEmpty()) {
      fechaInicio = Timestamp.valueOf(filtro.getFechaInicio() + " 00:00:00");
    }
    if (filtro.getFechaFin() != null && !filtro.getFechaFin().isEmpty()) {
      fechaFin = Timestamp.valueOf(filtro.getFechaFin() + " 23:59:59");
    }

    // Buscar incendios del usuario específico con filtros
    Page<TIncendio> pageIncendios = repoIncendio.findByUsuarioWithFilters(
        idUsuario, estado, fechaInicio, fechaFin, filtro.getPais(), filtro.getRegion(),
        filtro.getNombreCiudad(), nivelUrgencia, filtro.getAreaMinima(),
        filtro.getAreaMaxima(), pageable);

    // Convertir a DTO
    return pageIncendios.map(this::convertirADtoCompleto);
  }

  public DtoReporteIncendio obtenerIncendioDeUsuario(String idIncendio, String idUsuario) {
    Optional<TIncendio> incendioOpt = repoIncendio.findById(idIncendio);
    if (!incendioOpt.isPresent()) {
      throw new RuntimeException("Incendio no encontrado");
    }

    TIncendio incendio = incendioOpt.get();

    // Verificar que el incendio pertenece al usuario
    if (!incendio.getUsuario().getIdUsuario().equals(idUsuario)) {
      throw new RuntimeException("No tienes permisos para ver este incendio");
    }

    return convertirADtoCompleto(incendio);
  }

  @Transactional
  public DtoReporteIncendio editarIncendioDeUsuario(String idIncendio, String idUsuario,
      DtoReporteIncendio dtoActualizado) throws Exception {
    Optional<TIncendio> incendioOpt = repoIncendio.findById(idIncendio);
    if (!incendioOpt.isPresent()) {
      throw new RuntimeException("Incendio no encontrado");
    }

    TIncendio incendio = incendioOpt.get();

    // Verificar que el incendio pertenece al usuario
    if (!incendio.getUsuario().getIdUsuario().equals(idUsuario)) {
      throw new RuntimeException("No tienes permisos para editar este incendio");
    }

    // Solo permitir edición si el incendio está en estado REPORTADO
    if (incendio.getEstado() != TIncendio.EstadoIncendio.REPORTADO) {
      throw new RuntimeException(
          "Solo puedes editar incendios en estado REPORTADO. Estado actual: " + incendio.getEstado().name());
    }

    // Actualizar campos editables
    if (dtoActualizado.getTipoVegetacion() != null) {
      incendio.setTipoVegetacion(TIncendio.TipoVegetacion.valueOf(dtoActualizado.getTipoVegetacion()));
    }
    if (dtoActualizado.getFuenteIncendio() != null) {
      incendio.setFuenteIncendio(TIncendio.FuenteIncendio.valueOf(dtoActualizado.getFuenteIncendio()));
    }
    if (dtoActualizado.getAreaAfectada() != null) {
      incendio.setAreaAfectada(dtoActualizado.getAreaAfectada());
      // Recalcular nivel de urgencia
      incendio.setNivelUrgencia(calcularNivelUrgencia(dtoActualizado.getAreaAfectada()));
    }
    if (dtoActualizado.getDescripcion() != null && !dtoActualizado.getDescripcion().trim().isEmpty()) {
      incendio.setDescripcion(dtoActualizado.getDescripcion());
    }
    if (dtoActualizado.getNombreCiudad() != null) {
      incendio.setNombreCiudad(dtoActualizado.getNombreCiudad());
    }
    if (dtoActualizado.getLatitud() != null) {
      incendio.setLatitud(dtoActualizado.getLatitud());
    }
    if (dtoActualizado.getLongitud() != null) {
      incendio.setLongitud(dtoActualizado.getLongitud());
    }
    if (dtoActualizado.getPais() != null) {
      incendio.setPais(dtoActualizado.getPais());
    }
    if (dtoActualizado.getRegion() != null) {
      incendio.setRegion(dtoActualizado.getRegion());
    }
    if (dtoActualizado.getPoblacion() != null) {
      incendio.setPoblacion(dtoActualizado.getPoblacion());
    }

    incendio.setFechaActualizacion(new Timestamp(System.currentTimeMillis()));

    // Guardar cambios
    incendio = repoIncendio.save(incendio);

    // Manejar archivos nuevos si existen
    List<DtoArchivoIncendio> archivosSubidos = new ArrayList<>();
    if (dtoActualizado.getArchivos() != null && !dtoActualizado.getArchivos().isEmpty()) {
      archivosSubidos = subirArchivos(incendio.getIdIncendio(), dtoActualizado.getArchivos());
    }

    return convertirADtoCompleto(incendio);
  }

  @Transactional
  public void eliminarIncendioDeUsuario(String idIncendio, String idUsuario) throws Exception {
    Optional<TIncendio> incendioOpt = repoIncendio.findById(idIncendio);
    if (!incendioOpt.isPresent()) {
      throw new RuntimeException("Incendio no encontrado");
    }

    TIncendio incendio = incendioOpt.get();

    // Verificar que el incendio pertenece al usuario
    if (!incendio.getUsuario().getIdUsuario().equals(idUsuario)) {
      throw new RuntimeException("No tienes permisos para eliminar este incendio");
    }

    // Solo permitir eliminación si el incendio está en estado REPORTADO
    if (incendio.getEstado() != TIncendio.EstadoIncendio.REPORTADO) {
      throw new RuntimeException(
          "Solo puedes eliminar incendios en estado REPORTADO. Estado actual: " + incendio.getEstado().name());
    }

    // Eliminar archivos de Supabase
    List<TArchivoIncendio> archivos = repoArchivoIncendio.findByIncendioIdIncendio(idIncendio);
    for (TArchivoIncendio archivo : archivos) {
      try {
        // Extraer la ruta del archivo de la URL
        String rutaArchivo = extraerRutaDeUrl(archivo.getUrlArchivo());
        supabaseStorageService.deleteFileFromBucket(rutaArchivo);
      } catch (Exception e) {
        System.err.println("Error al eliminar archivo de Supabase: " + e.getMessage());
        // Continúa con la eliminación de la base de datos aunque falle Supabase
      }
    }

    repoComentarioIncendio.deleteByIncendioIdIncendio(idIncendio);

    repoArchivoIncendio.deleteByIncendioIdIncendio(idIncendio);

    repoIncendio.delete(incendio);
  }

  @Transactional
  public void eliminarArchivoDeIncendio(String idArchivo, String idUsuario) throws Exception {
    Optional<TArchivoIncendio> archivoOpt = repoArchivoIncendio.findById(idArchivo);
    if (!archivoOpt.isPresent()) {
      throw new RuntimeException("Archivo no encontrado");
    }

    TArchivoIncendio archivo = archivoOpt.get();

    // Verificar que el incendio asociado pertenece al usuario
    if (!archivo.getIncendio().getUsuario().getIdUsuario().equals(idUsuario)) {
      throw new RuntimeException("No tienes permisos para eliminar este archivo");
    }

    // Solo permitir eliminación si el incendio está en estado REPORTADO
    if (archivo.getIncendio().getEstado() != TIncendio.EstadoIncendio.REPORTADO) {
      throw new RuntimeException("Solo puedes eliminar archivos de incendios en estado REPORTADO");
    }

    // Eliminar archivo de Supabase
    try {
      String rutaArchivo = extraerRutaDeUrl(archivo.getUrlArchivo());
      supabaseStorageService.deleteFileFromBucket(rutaArchivo);
    } catch (Exception e) {
      System.err.println("Error al eliminar archivo de Supabase: " + e.getMessage());
      // Continúa con la eliminación de la base de datos aunque falle Supabase
    }

    repoArchivoIncendio.delete(archivo);
  }

  public List<DtoReporteIncendio> obtenerResumenIncendiosUsuario(String idUsuario) {
    // Validar que el usuario existe
    Optional<TUser> usuarioOpt = repoUser.findById(idUsuario);
    if (!usuarioOpt.isPresent()) {
      throw new RuntimeException("Usuario no encontrado");
    }

    // Obtener estadísticas de incendios del usuario
    List<TIncendio> incendiosUsuario = repoIncendio.findByUsuarioIdUsuarioOrderByFechaReporteDesc(idUsuario);

    return incendiosUsuario.stream()
        .map(this::convertirADto)
        .toList();
  }

  private String extraerRutaDeUrl(String url) {
    // Extraer la ruta del archivo de la URL de Supabase
    // Formato típico:
    // https://[proyecto].supabase.co/storage/v1/object/public/[bucket]/[ruta]
    if (url != null && url.contains("/storage/v1/object/public/")) {
      int index = url.indexOf("/storage/v1/object/public/");
      String rutaCompleta = url.substring(index + "/storage/v1/object/public/".length());
      // Remover el nombre del bucket (primer segmento)
      int firstSlash = rutaCompleta.indexOf('/');
      if (firstSlash > 0) {
        return rutaCompleta.substring(firstSlash + 1);
      }
    }
    return url; // Fallback
  }

  // Métodos de conversión
  private DtoReporteIncendio convertirADto(TIncendio incendio) {
    DtoReporteIncendio dto = new DtoReporteIncendio();
    dto.setIdIncendio(incendio.getIdIncendio());
    dto.setIdUsuario(incendio.getUsuario().getIdUsuario());
    dto.setTipoVegetacion(incendio.getTipoVegetacion().name());
    dto.setFuenteIncendio(incendio.getFuenteIncendio().name());
    dto.setAreaAfectada(incendio.getAreaAfectada());
    dto.setDescripcion(incendio.getDescripcion());
    dto.setNombreCiudad(incendio.getNombreCiudad());
    dto.setLatitud(incendio.getLatitud());
    dto.setLongitud(incendio.getLongitud());
    dto.setPais(incendio.getPais());
    dto.setRegion(incendio.getRegion());
    dto.setPoblacion(incendio.getPoblacion());
    dto.setNivelUrgencia(incendio.getNivelUrgencia().name());
    dto.setEstado(incendio.getEstado().name());
    dto.setFechaReporte(incendio.getFechaReporte());
    dto.setFechaActualizacion(incendio.getFechaActualizacion());
    dto.setNombreUsuario(incendio.getUsuario().getNombre());
    dto.setEmailUsuario(incendio.getUsuario().getEmail());

    return dto;
  }

  private DtoReporteIncendio convertirADtoCompleto(TIncendio incendio) {
    DtoReporteIncendio dto = convertirADto(incendio);

    // Agregar archivos
    List<TArchivoIncendio> archivos = repoArchivoIncendio.findByIncendioIdIncendio(incendio.getIdIncendio());
    List<DtoArchivoIncendio> dtoArchivos = archivos.stream()
        .map(this::convertirArchivoADto)
        .toList();
    dto.setArchivosSubidos(dtoArchivos);

    // Agregar comentarios
    List<TComentarioIncendio> comentarios = repoComentarioIncendio
        .findByIncendioIdIncendioOrderByFechaComentarioDesc(incendio.getIdIncendio());
    List<DtoComentarioIncendio> dtoComentarios = comentarios.stream()
        .map(this::convertirComentarioADto)
        .toList();
    dto.setComentarios(dtoComentarios);

    return dto;
  }

  private DtoArchivoIncendio convertirArchivoADto(TArchivoIncendio archivo) {
    DtoArchivoIncendio dto = new DtoArchivoIncendio();
    dto.setIdArchivo(archivo.getIdArchivo());
    dto.setIdIncendio(archivo.getIncendio().getIdIncendio());
    dto.setNombreArchivo(archivo.getNombreArchivo());
    dto.setUrlArchivo(archivo.getUrlArchivo());
    dto.setTipoArchivo(archivo.getTipoArchivo().name());
    dto.setTamanhoArchivo(archivo.getTamanhoArchivo());
    dto.setFechaSubida(archivo.getFechaSubida());

    return dto;
  }

  private DtoComentarioIncendio convertirComentarioADto(TComentarioIncendio comentario) {
    DtoComentarioIncendio dto = new DtoComentarioIncendio();
    dto.setIdComentario(comentario.getIdComentario());
    dto.setIdIncendio(comentario.getIncendio().getIdIncendio());
    dto.setIdUsuario(comentario.getUsuario().getIdUsuario());
    dto.setComentario(comentario.getComentario());
    dto.setAccionTomada(comentario.getAccionTomada());
    dto.setFechaComentario(comentario.getFechaComentario());
    dto.setNombreUsuario(comentario.getUsuario().getNombre());
    dto.setEmailUsuario(comentario.getUsuario().getEmail());

    return dto;
  }

  // Métodos de exportación
  public String exportarAJson(DtoFiltroIncendio filtro) throws Exception {
    filtro.setSize(Integer.MAX_VALUE); // Obtener todos los registros
    Page<DtoReporteIncendio> incendios = obtenerIncendiosConFiltros(filtro);

    ObjectMapper mapper = new ObjectMapper();
    return mapper.writeValueAsString(incendios.getContent());
  }

  public String exportarACsv(DtoFiltroIncendio filtro) {
    filtro.setSize(Integer.MAX_VALUE); // Obtener todos los registros
    Page<DtoReporteIncendio> incendios = obtenerIncendiosConFiltros(filtro);

    StringBuilder csv = new StringBuilder();
    csv.append(
        "ID,Usuario,Tipo Vegetacion,Fuente,Area Afectada,Descripcion,Ciudad,Pais,Region,Latitud,Longitud,Urgencia,Estado,Fecha Reporte\n");

    for (DtoReporteIncendio incendio : incendios.getContent()) {
      csv.append(String.format("%s,%s,%s,%s,%.2f,\"%s\",%s,%s,%s,%.6f,%.6f,%s,%s,%s\n",
          incendio.getIdIncendio(),
          incendio.getNombreUsuario(),
          incendio.getTipoVegetacion(),
          incendio.getFuenteIncendio(),
          incendio.getAreaAfectada(),
          incendio.getDescripcion() != null ? incendio.getDescripcion().replace("\"", "\"\"") : "",
          incendio.getNombreCiudad(),
          incendio.getPais(),
          incendio.getRegion() != null ? incendio.getRegion() : "",
          incendio.getLatitud(),
          incendio.getLongitud(),
          incendio.getNivelUrgencia(),
          incendio.getEstado(),
          new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(incendio.getFechaReporte())));
    }

    return csv.toString();
  }

  public byte[] exportarAExcel(DtoFiltroIncendio filtro) throws IOException {
    filtro.setSize(Integer.MAX_VALUE);
    Page<DtoReporteIncendio> incendios = obtenerIncendiosConFiltros(filtro);

    Workbook workbook = new XSSFWorkbook();
    Sheet sheet = workbook.createSheet("Incendios");

    String[] columnas = { "ID", "Usuario", "Tipo Vegetación", "Fuente", "Área Afectada", "Descripción",
        "Ciudad", "País", "Región", "Latitud", "Longitud", "Urgencia", "Estado", "Fecha Reporte" };

    Row header = sheet.createRow(0);
    for (int i = 0; i < columnas.length; i++) {
      header.createCell(i).setCellValue(columnas[i]);
    }

    int rowIdx = 1;
    for (DtoReporteIncendio incendio : incendios.getContent()) {
      Row row = sheet.createRow(rowIdx++);
      row.createCell(0).setCellValue(incendio.getIdIncendio());
      row.createCell(1).setCellValue(incendio.getNombreUsuario());
      row.createCell(2).setCellValue(incendio.getTipoVegetacion());
      row.createCell(3).setCellValue(incendio.getFuenteIncendio());
      row.createCell(4).setCellValue(incendio.getAreaAfectada());
      row.createCell(5).setCellValue(incendio.getDescripcion() != null ? incendio.getDescripcion() : "");
      row.createCell(6).setCellValue(incendio.getNombreCiudad());
      row.createCell(7).setCellValue(incendio.getPais());
      row.createCell(8).setCellValue(incendio.getRegion() != null ? incendio.getRegion() : "");
      row.createCell(9).setCellValue(incendio.getLatitud());
      row.createCell(10).setCellValue(incendio.getLongitud());
      row.createCell(11).setCellValue(incendio.getNivelUrgencia());
      row.createCell(12).setCellValue(incendio.getEstado());
      row.createCell(13).setCellValue(
          new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(incendio.getFechaReporte()));
    }

    ByteArrayOutputStream out = new ByteArrayOutputStream();
    workbook.write(out);
    workbook.close();
    return out.toByteArray();

  }
}
