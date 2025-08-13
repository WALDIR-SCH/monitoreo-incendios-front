package com.example.monitoreo_incendios.Controller.User.RequestsObject;

import jakarta.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestInsert {
    @NotBlank(message = "El campo \"Email \" es requerido")
    private String email ;

    @NotBlank(message = "El campo \"Nombre \" es requerido")
    private String nombre ;

    @NotBlank(message = "El campo \"Contrasenha\" es requerido")
    private String contrasenha ;

    @NotBlank(message = "El campo \"idRol\" es requerido")
    private String idRol ;
}
