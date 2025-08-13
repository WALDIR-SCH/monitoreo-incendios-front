package com.example.monitoreo_incendios.Dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DtoFiltroIncendio {
    private String estado; // REPORTADO, EN_CURSO, CONTROLADO, EXTINGUIDO
    private String fechaInicio; // yyyy-MM-dd
    private String fechaFin; // yyyy-MM-dd
    private String pais;
    private String region;
    private String nombreCiudad;
    private String nivelUrgencia; // BAJA, MEDIA, ALTA, CRITICA
    private Float areaMinima;
    private Float areaMaxima;
    private Integer page = 0;
    private Integer size = 10;
    private String sortBy = "fechaReporte";
    private String sortDirection = "DESC";
}
