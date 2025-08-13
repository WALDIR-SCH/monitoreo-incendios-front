package com.example.monitoreo_incendios.Dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DtoActualizarEstadoIncendio {
    private String idIncendio;
    private String nuevoEstado; // REPORTADO, EN_CURSO, CONTROLADO, EXTINGUIDO
    private String comentario;
    private String accionTomada;
    private String idUsuarioAdmin; // ID del administrador que actualiza
}
