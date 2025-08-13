package com.example.monitoreo_incendios.Dto;

import java.sql.Timestamp;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DtoReporteIncendio {
    private String idIncendio;
    private String idUsuario;
    private String tipoVegetacion; // BOSQUE, PASTIZAL, CULTIVO, URBANO, MIXTO
    private String fuenteIncendio; // NATURAL, HUMANO, DESCONOCIDO
    private Float areaAfectada;
    private String descripcion;
    private String nombreCiudad;
    private Double latitud;
    private Double longitud;
    private String pais;
    private String region;
    private Long poblacion;
    private String nivelUrgencia;
    private String estado;
    private Timestamp fechaReporte;
    private Timestamp fechaActualizacion;
    private List<MultipartFile> archivos; // Para recibir archivos del frontend
    private List<DtoArchivoIncendio> archivosSubidos; // Para enviar URLs de archivos
    private List<DtoComentarioIncendio> comentarios;
    private String nombreUsuario;
    private String emailUsuario;
}
