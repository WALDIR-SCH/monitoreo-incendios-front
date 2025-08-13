package com.example.monitoreo_incendios.Entity;

import java.sql.Timestamp;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "comentarioincendio")
@Getter
@Setter
public class TComentarioIncendio {

    @Id
    @Column(name = "idComentario", length = 36)
    private String idComentario;

    @ManyToOne
    @JoinColumn(name = "idIncendio", nullable = false)
    private TIncendio incendio;

    @ManyToOne
    @JoinColumn(name = "idUsuario", nullable = false)
    private TUser usuario; // Usuario que hace el comentario (debe ser administrador)

    @Column(name = "comentario", columnDefinition = "TEXT", nullable = false)
    private String comentario;

    @Column(name = "accionTomada", columnDefinition = "TEXT")
    private String accionTomada;

    @Column(name = "fechaComentario", nullable = false)
    private Timestamp fechaComentario;
}
