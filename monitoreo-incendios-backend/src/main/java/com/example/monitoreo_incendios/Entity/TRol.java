package com.example.monitoreo_incendios.Entity;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "rol")
public class TRol implements Serializable {
    @Id
    @Column(name = "idRol")
    private String idRol;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo")
    private TipoRol tipo;

    public enum TipoRol {
        ADMINISTRADOR, USUARIO
    }
}
