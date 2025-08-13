package com.example.monitoreo_incendios.Business;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.monitoreo_incendios.Dto.DtoRol;
import com.example.monitoreo_incendios.Entity.TRol;
import com.example.monitoreo_incendios.Entity.TUser;
import com.example.monitoreo_incendios.Repository.RepoUser;

@Service
public class BusinessRol {

    @Autowired
    private RepoUser repoUser;

    public DtoRol getRolByUserId(String idUsuario) {
        TUser user = repoUser.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        TRol rol = user.getRol();
        if (rol == null) {
            throw new RuntimeException("El usuario no tiene un rol asignado");
        }

        DtoRol dtoRol = new DtoRol();
        dtoRol.setIdRol(rol.getIdRol());
        dtoRol.setTipo(rol.getTipo().name());

        return dtoRol;
    }

}
