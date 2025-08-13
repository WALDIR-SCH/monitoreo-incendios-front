package com.example.monitoreo_incendios.Dto;

import java.sql.Timestamp;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DtoComentarioIncendio {
    private String idComentario;
    private String idIncendio;
    private String idUsuario;
    private String comentario;
    private String accionTomada;
    private Timestamp fechaComentario;
    private String nombreUsuario;
    private String emailUsuario;
}
