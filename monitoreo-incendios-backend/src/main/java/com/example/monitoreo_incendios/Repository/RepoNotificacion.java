package com.example.monitoreo_incendios.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.monitoreo_incendios.Entity.TNotificacion;

@Repository
public interface RepoNotificacion extends JpaRepository<TNotificacion, String> {

    List<TNotificacion> findByUsuarioIdUsuarioOrderByFechaCreacionDesc(String idUsuario);

    List<TNotificacion> findByUsuarioIdUsuarioAndLeidaOrderByFechaCreacionDesc(String idUsuario, Boolean leida);

    long countByUsuarioIdUsuarioAndLeida(String idUsuario, Boolean leida);

    @Query("SELECT n FROM TNotificacion n WHERE n.usuario.rol.tipo = 'ADMINISTRADOR' AND n.tipoNotificacion = 'NUEVO_REPORTE' ORDER BY n.fechaCreacion DESC")
    List<TNotificacion> findNotificacionesParaAdministradores();

    void deleteByUsuarioIdUsuario(String idUsuario);
}
