package com.example.monitoreo_incendios.Entity;

import java.io.Serializable;
import java.sql.Timestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "usuario")
public class TUser implements Serializable {
    @Id
    @Column(name = "idUsuario")
    private String idUsuario;

    @ManyToOne
    @JoinColumn(name = "idRol")
    private TRol rol;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "email")
    private String email;

    @Column(name = "contrasenha")
    private String contrasenha;

    @Column(name = "foto")
    private String foto;

    @Column(name = "fechaRegistro")
    private Timestamp fechaRegistro;

}
