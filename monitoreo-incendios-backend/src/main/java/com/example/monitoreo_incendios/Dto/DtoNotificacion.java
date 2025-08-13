package com.example.monitoreo_incendios.Dto;

import java.sql.Timestamp;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DtoNotificacion {
    private String idNotificacion;
    private String idUsuario;
    private String idIncendio;
    private String titulo;
    private String mensaje;
    private String tipoNotificacion; // NUEVO_REPORTE, CAMBIO_ESTADO, ALERTA_GENERAL, SISTEMA
    private Boolean leida;
    private Timestamp fechaCreacion;
    private Timestamp fechaLectura;
    private String nombreUsuario;
    private String informacionIncendio; // Información básica del incendio asociado
}
