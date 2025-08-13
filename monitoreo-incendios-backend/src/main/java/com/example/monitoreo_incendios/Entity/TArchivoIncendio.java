package com.example.monitoreo_incendios.Entity;

import java.sql.Timestamp;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "archivoincendio")
@Getter
@Setter
public class TArchivoIncendio {

    @Id
    @Column(name = "idArchivo", length = 36)
    private String idArchivo;

    @ManyToOne
    @JoinColumn(name = "idIncendio", nullable = false)
    private TIncendio incendio;

    @Column(name = "nombreArchivo", length = 255, nullable = false)
    private String nombreArchivo;

    @Column(name = "urlArchivo", length = 500, nullable = false)
    private String urlArchivo;

    @Column(name = "tipoArchivo", length = 10, nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoArchivo tipoArchivo;

    @Column(name = "tamanhoArchivo")
    private Long tamanhoArchivo; // en bytes

    @Column(name = "fechaSubida", nullable = false)
    private Timestamp fechaSubida;

    public enum TipoArchivo {
        IMAGEN, VIDEO
    }
}
