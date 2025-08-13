package com.example.monitoreo_incendios.Entity;

import java.sql.Timestamp;
import java.util.List;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "incendio")
@Getter
@Setter
public class TIncendio {

    @Id
    @Column(name = "idIncendio", length = 36)
    private String idIncendio;

    @ManyToOne
    @JoinColumn(name = "idUsuario", nullable = false)
    private TUser usuario;

    @Column(name = "tipoVegetacion", length = 50, nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoVegetacion tipoVegetacion;

    @Column(name = "fuenteIncendio", length = 50, nullable = false)
    @Enumerated(EnumType.STRING)
    private FuenteIncendio fuenteIncendio;

    @Column(name = "areaAfectada", nullable = false)
    private Float areaAfectada; // en hectáreas

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "nombreCiudad", length = 100, nullable = false)
    private String nombreCiudad;

    @Column(name = "latitud", nullable = false)
    private Double latitud;

    @Column(name = "longitud", nullable = false)
    private Double longitud;

    @Column(name = "pais", length = 100, nullable = false)
    private String pais;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "poblacion")
    private Long poblacion;

    @Column(name = "nivelUrgencia", length = 20, nullable = false)
    @Enumerated(EnumType.STRING)
    private NivelUrgencia nivelUrgencia;

    @Column(name = "estado", length = 20, nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoIncendio estado;

    @Column(name = "fechaReporte", nullable = false)
    private Timestamp fechaReporte;

    @Column(name = "fechaActualizacion")
    private Timestamp fechaActualizacion;

    @OneToMany(mappedBy = "incendio", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TArchivoIncendio> archivos;

    @OneToMany(mappedBy = "incendio", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TComentarioIncendio> comentarios;

    public enum TipoVegetacion {
        BOSQUE, PASTIZAL, CULTIVO, URBANO, MIXTO
    }

    public enum FuenteIncendio {
        NATURAL, HUMANO, DESCONOCIDO
    }

    public enum NivelUrgencia {
        BAJA, MEDIA, ALTA, CRITICA
    }

    public enum EstadoIncendio {
        REPORTADO, EN_CURSO, CONTROLADO, EXTINGUIDO
    }
}
