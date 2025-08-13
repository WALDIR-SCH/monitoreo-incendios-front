package com.example.monitoreo_incendios.Repository;

import java.sql.Timestamp;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.monitoreo_incendios.Entity.TIncendio;

@Repository
public interface RepoIncendio extends JpaRepository<TIncendio, String> {

    // Buscar por estado
    Page<TIncendio> findByEstado(TIncendio.EstadoIncendio estado, Pageable pageable);

    // Buscar por rango de fechas
    Page<TIncendio> findByFechaReporteBetween(Timestamp fechaInicio, Timestamp fechaFin, Pageable pageable);

    // Buscar por ubicación
    Page<TIncendio> findByPaisContainingIgnoreCase(String pais, Pageable pageable);
    Page<TIncendio> findByRegionContainingIgnoreCase(String region, Pageable pageable);
    Page<TIncendio> findByNombreCiudadContainingIgnoreCase(String nombreCiudad, Pageable pageable);

    // Buscar por nivel de urgencia
    Page<TIncendio> findByNivelUrgencia(TIncendio.NivelUrgencia nivelUrgencia, Pageable pageable);

    // Buscar por área afectada
    Page<TIncendio> findByAreaAfectadaBetween(Float areaMinima, Float areaMaxima, Pageable pageable);

    // Buscar incendios por usuario
    List<TIncendio> findByUsuarioIdUsuario(String idUsuario);

    // Buscar incendios por usuario ordenados por fecha descendente
    List<TIncendio> findByUsuarioIdUsuarioOrderByFechaReporteDesc(String idUsuario);

    // Buscar incendios por usuario con filtros múltiples
    @Query("SELECT i FROM TIncendio i WHERE i.usuario.idUsuario = :idUsuario AND " +
           "(:estado IS NULL OR i.estado = :estado) AND " +
           "(:fechaInicio IS NULL OR i.fechaReporte >= :fechaInicio) AND " +
           "(:fechaFin IS NULL OR i.fechaReporte <= :fechaFin) AND " +
           "(:pais IS NULL OR LOWER(i.pais) LIKE LOWER(CONCAT('%', :pais, '%'))) AND " +
           "(:region IS NULL OR LOWER(i.region) LIKE LOWER(CONCAT('%', :region, '%'))) AND " +
           "(:nombreCiudad IS NULL OR LOWER(i.nombreCiudad) LIKE LOWER(CONCAT('%', :nombreCiudad, '%'))) AND " +
           "(:nivelUrgencia IS NULL OR i.nivelUrgencia = :nivelUrgencia) AND " +
           "(:areaMinima IS NULL OR i.areaAfectada >= :areaMinima) AND " +
           "(:areaMaxima IS NULL OR i.areaAfectada <= :areaMaxima) " +
           "ORDER BY i.fechaReporte DESC")
    Page<TIncendio> findByUsuarioWithFilters(
        @Param("idUsuario") String idUsuario,
        @Param("estado") TIncendio.EstadoIncendio estado,
        @Param("fechaInicio") Timestamp fechaInicio,
        @Param("fechaFin") Timestamp fechaFin,
        @Param("pais") String pais,
        @Param("region") String region,
        @Param("nombreCiudad") String nombreCiudad,
        @Param("nivelUrgencia") TIncendio.NivelUrgencia nivelUrgencia,
        @Param("areaMinima") Float areaMinima,
        @Param("areaMaxima") Float areaMaxima,
        Pageable pageable
    );

    // Buscar incendios recientes (últimas 24 horas)
    @Query("SELECT i FROM TIncendio i WHERE i.fechaReporte >= :fechaLimite ORDER BY i.fechaReporte DESC")
    List<TIncendio> findIncendiosRecientes(@Param("fechaLimite") Timestamp fechaLimite);

    // Buscar incendios activos (no extinguidos)
    @Query("SELECT i FROM TIncendio i WHERE i.estado != 'EXTINGUIDO' ORDER BY i.nivelUrgencia DESC, i.fechaReporte DESC")
    List<TIncendio> findIncendiosActivos();

    // Contar incendios por estado
    long countByEstado(TIncendio.EstadoIncendio estado);

    // Buscar incendios para restauración (extinguidos en un área específica)
    @Query("SELECT i FROM TIncendio i WHERE i.estado = 'EXTINGUIDO' AND i.areaAfectada >= :areaMinima")
    List<TIncendio> findIncendiosParaRestauracion(@Param("areaMinima") Float areaMinima);

    // Búsqueda compleja con filtros múltiples
    @Query("SELECT i FROM TIncendio i WHERE " +
           "(:estado IS NULL OR i.estado = :estado) AND " +
           "(:fechaInicio IS NULL OR i.fechaReporte >= :fechaInicio) AND " +
           "(:fechaFin IS NULL OR i.fechaReporte <= :fechaFin) AND " +
           "(:pais IS NULL OR LOWER(i.pais) LIKE LOWER(CONCAT('%', :pais, '%'))) AND " +
           "(:region IS NULL OR LOWER(i.region) LIKE LOWER(CONCAT('%', :region, '%'))) AND " +
           "(:nombreCiudad IS NULL OR LOWER(i.nombreCiudad) LIKE LOWER(CONCAT('%', :nombreCiudad, '%'))) AND " +
           "(:nivelUrgencia IS NULL OR i.nivelUrgencia = :nivelUrgencia) AND " +
           "(:areaMinima IS NULL OR i.areaAfectada >= :areaMinima) AND " +
           "(:areaMaxima IS NULL OR i.areaAfectada <= :areaMaxima)")
    Page<TIncendio> findWithFilters(
        @Param("estado") TIncendio.EstadoIncendio estado,
        @Param("fechaInicio") Timestamp fechaInicio,
        @Param("fechaFin") Timestamp fechaFin,
        @Param("pais") String pais,
        @Param("region") String region,
        @Param("nombreCiudad") String nombreCiudad,
        @Param("nivelUrgencia") TIncendio.NivelUrgencia nivelUrgencia,
        @Param("areaMinima") Float areaMinima,
        @Param("areaMaxima") Float areaMaxima,
        Pageable pageable
    );
}
