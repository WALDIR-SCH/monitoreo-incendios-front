package com.example.monitoreo_incendios.Business;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.monitoreo_incendios.Dto.DtoNotificacion;
import com.example.monitoreo_incendios.Entity.TIncendio;
import com.example.monitoreo_incendios.Entity.TNotificacion;
import com.example.monitoreo_incendios.Entity.TRol;
import com.example.monitoreo_incendios.Entity.TUser;
import com.example.monitoreo_incendios.Repository.RepoNotificacion;
import com.example.monitoreo_incendios.Repository.RepoUser;

import jakarta.transaction.Transactional;

@Service
public class BusinessNotificacion {

    @Autowired
    private RepoNotificacion repoNotificacion;

    @Autowired
    private RepoUser repoUser;

    @Transactional
    public void crearNotificacionNuevoReporte(TIncendio incendio) {
        // Obtener todos los administradores
        List<TUser> administradores = repoUser.findByRolTipo(TRol.TipoRol.ADMINISTRADOR);

        for (TUser admin : administradores) {
            TNotificacion notificacion = new TNotificacion();
            notificacion.setIdNotificacion(UUID.randomUUID().toString());
            notificacion.setUsuario(admin);
            notificacion.setIncendio(incendio);
            notificacion.setTitulo("Nuevo Reporte de Incendio");
            notificacion.setMensaje(String.format(
                "Se ha reportado un nuevo incendio en %s, %s. Nivel de urgencia: %s. Área afectada: %.2f hectáreas.",
                incendio.getNombreCiudad(),
                incendio.getPais(),
                incendio.getNivelUrgencia().name(),
                incendio.getAreaAfectada()
            ));
            notificacion.setTipoNotificacion(TNotificacion.TipoNotificacion.NUEVO_REPORTE);
            notificacion.setLeida(false);
            notificacion.setFechaCreacion(new Timestamp(System.currentTimeMillis()));

            repoNotificacion.save(notificacion);
        }
    }

    @Transactional
    public void crearNotificacionCambioEstado(TIncendio incendio, TIncendio.EstadoIncendio estadoAnterior, TUser adminQueActualiza) {
        // Notificar al usuario que reportó el incendio
        TNotificacion notificacionUsuario = new TNotificacion();
        notificacionUsuario.setIdNotificacion(UUID.randomUUID().toString());
        notificacionUsuario.setUsuario(incendio.getUsuario());
        notificacionUsuario.setIncendio(incendio);
        notificacionUsuario.setTitulo("Actualización de Estado de Incendio");
        notificacionUsuario.setMensaje(String.format(
            "El estado de su reporte de incendio en %s ha cambiado de %s a %s.",
            incendio.getNombreCiudad(),
            estadoAnterior.name(),
            incendio.getEstado().name()
        ));
        notificacionUsuario.setTipoNotificacion(TNotificacion.TipoNotificacion.CAMBIO_ESTADO);
        notificacionUsuario.setLeida(false);
        notificacionUsuario.setFechaCreacion(new Timestamp(System.currentTimeMillis()));

        repoNotificacion.save(notificacionUsuario);

        // Notificar a otros administradores (excepto el que hizo el cambio)
        List<TUser> administradores = repoUser.findByRolTipo(TRol.TipoRol.ADMINISTRADOR);
        for (TUser admin : administradores) {
            if (!admin.getIdUsuario().equals(adminQueActualiza.getIdUsuario())) {
                TNotificacion notificacionAdmin = new TNotificacion();
                notificacionAdmin.setIdNotificacion(UUID.randomUUID().toString());
                notificacionAdmin.setUsuario(admin);
                notificacionAdmin.setIncendio(incendio);
                notificacionAdmin.setTitulo("Estado de Incendio Actualizado");
                notificacionAdmin.setMensaje(String.format(
                    "El administrador %s ha actualizado el estado del incendio en %s de %s a %s.",
                    adminQueActualiza.getNombre(),
                    incendio.getNombreCiudad(),
                    estadoAnterior.name(),
                    incendio.getEstado().name()
                ));
                notificacionAdmin.setTipoNotificacion(TNotificacion.TipoNotificacion.CAMBIO_ESTADO);
                notificacionAdmin.setLeida(false);
                notificacionAdmin.setFechaCreacion(new Timestamp(System.currentTimeMillis()));

                repoNotificacion.save(notificacionAdmin);
            }
        }
    }

    @Transactional
    public void crearAlertaGeneral(String titulo, String mensaje) {
        // Obtener todos los usuarios
        List<TUser> usuarios = repoUser.findAll();

        for (TUser usuario : usuarios) {
            TNotificacion notificacion = new TNotificacion();
            notificacion.setIdNotificacion(UUID.randomUUID().toString());
            notificacion.setUsuario(usuario);
            notificacion.setTitulo(titulo);
            notificacion.setMensaje(mensaje);
            notificacion.setTipoNotificacion(TNotificacion.TipoNotificacion.ALERTA_GENERAL);
            notificacion.setLeida(false);
            notificacion.setFechaCreacion(new Timestamp(System.currentTimeMillis()));

            repoNotificacion.save(notificacion);
        }
    }

    public List<DtoNotificacion> obtenerNotificacionesUsuario(String idUsuario) {
        List<TNotificacion> notificaciones = repoNotificacion.findByUsuarioIdUsuarioOrderByFechaCreacionDesc(idUsuario);

        return notificaciones.stream()
                .map(this::convertirADto)
                .toList();
    }

    public List<DtoNotificacion> obtenerNotificacionesNoLeidas(String idUsuario) {
        List<TNotificacion> notificaciones = repoNotificacion.findByUsuarioIdUsuarioAndLeidaOrderByFechaCreacionDesc(idUsuario, false);

        return notificaciones.stream()
                .map(this::convertirADto)
                .toList();
    }

    public long contarNotificacionesNoLeidas(String idUsuario) {
        return repoNotificacion.countByUsuarioIdUsuarioAndLeida(idUsuario, false);
    }

    @Transactional
    public boolean marcarComoLeida(String idNotificacion, String idUsuario) {
        Optional<TNotificacion> notificacionOpt = repoNotificacion.findById(idNotificacion);

        if (notificacionOpt.isPresent()) {
            TNotificacion notificacion = notificacionOpt.get();

            // Verificar que la notificación pertenece al usuario
            if (notificacion.getUsuario().getIdUsuario().equals(idUsuario)) {
                notificacion.setLeida(true);
                notificacion.setFechaLectura(new Timestamp(System.currentTimeMillis()));
                repoNotificacion.save(notificacion);
                return true;
            }
        }

        return false;
    }

    @Transactional
    public void marcarTodasComoLeidas(String idUsuario) {
        List<TNotificacion> notificaciones = repoNotificacion.findByUsuarioIdUsuarioAndLeidaOrderByFechaCreacionDesc(idUsuario, false);

        Timestamp ahora = new Timestamp(System.currentTimeMillis());
        for (TNotificacion notificacion : notificaciones) {
            notificacion.setLeida(true);
            notificacion.setFechaLectura(ahora);
        }

        repoNotificacion.saveAll(notificaciones);
    }

    private DtoNotificacion convertirADto(TNotificacion notificacion) {
        DtoNotificacion dto = new DtoNotificacion();
        dto.setIdNotificacion(notificacion.getIdNotificacion());
        dto.setIdUsuario(notificacion.getUsuario().getIdUsuario());
        dto.setIdIncendio(notificacion.getIncendio() != null ? notificacion.getIncendio().getIdIncendio() : null);
        dto.setTitulo(notificacion.getTitulo());
        dto.setMensaje(notificacion.getMensaje());
        dto.setTipoNotificacion(notificacion.getTipoNotificacion().name());
        dto.setLeida(notificacion.getLeida());
        dto.setFechaCreacion(notificacion.getFechaCreacion());
        dto.setFechaLectura(notificacion.getFechaLectura());
        dto.setNombreUsuario(notificacion.getUsuario().getNombre());

        if (notificacion.getIncendio() != null) {
            dto.setInformacionIncendio(String.format("%s, %s - %s",
                notificacion.getIncendio().getNombreCiudad(),
                notificacion.getIncendio().getPais(),
                notificacion.getIncendio().getEstado().name()
            ));
        }

        return dto;
    }
}
