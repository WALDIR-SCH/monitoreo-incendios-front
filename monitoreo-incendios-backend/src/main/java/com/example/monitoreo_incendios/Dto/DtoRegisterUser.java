package com.example.monitoreo_incendios.Dto;
import java.sql.Timestamp;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DtoRegisterUser {
    private String idUsuario;
        private String idRol;
    private String nombre;
    private String email;
    private String contrasenha;
    private String avatar;
    private Timestamp fechaRegistro;
    private String jwtToken;

    public DtoRegisterUser() {}

    public DtoRegisterUser(String email, String nombre, String avatar, String jwtToken) {
        this.email = email;
        this.nombre = nombre;
        this.avatar = avatar;
        this.jwtToken = jwtToken;
    }
}
