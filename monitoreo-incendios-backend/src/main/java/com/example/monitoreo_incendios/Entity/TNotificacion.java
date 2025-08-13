package com.example.monitoreo_incendios.Entity;

import java.sql.Timestamp;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "notificacion")
@Getter
@Setter
public class TNotificacion {

    @Id
    @Column(name = "idNotificacion", length = 36)
    private String idNotificacion;

    @ManyToOne
    @JoinColumn(name = "idUsuario", nullable = false)
    private TUser usuario; // Usuario que recibe la notificación

    @ManyToOne
    @JoinColumn(name = "idIncendio")
    private TIncendio incendio; // Puede ser null para notificaciones generales

    @Column(name = "titulo", length = 255, nullable = false)
    private String titulo;

    @Column(name = "mensaje", columnDefinition = "TEXT", nullable = false)
    private String mensaje;

    @Column(name = "tipoNotificacion", length = 50, nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoNotificacion tipoNotificacion;

    @Column(name = "leida", nullable = false)
    private Boolean leida = false;

    @Column(name = "fechaCreacion", nullable = false)
    private Timestamp fechaCreacion;

    @Column(name = "fechaLectura")
    private Timestamp fechaLectura;

    public enum TipoNotificacion {
        NUEVO_REPORTE, CAMBIO_ESTADO, ALERTA_GENERAL, SISTEMA
    }
}
