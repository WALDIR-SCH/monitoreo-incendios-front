package com.example.monitoreo_incendios.Dto;

import java.sql.Timestamp;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DtoArchivoIncendio {
    private String idArchivo;
    private String idIncendio;
    private String nombreArchivo;
    private String urlArchivo;
    private String tipoArchivo; // IMAGEN, VIDEO
    private Long tamanhoArchivo;
    private Timestamp fechaSubida;
}
