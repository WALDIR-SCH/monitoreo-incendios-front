package com.example.monitoreo_incendios.Controller.Rol;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.monitoreo_incendios.Business.BusinessRol;
import com.example.monitoreo_incendios.Controller.Generic.ResponseGeneric;
import com.example.monitoreo_incendios.Dto.DtoRol;


@RestController
@RequestMapping("/rol")
public class RolController {
  @Autowired
    private BusinessRol businessRol;

    @GetMapping("/user/{idUsuario}")
    public ResponseEntity<ResponseGeneric<DtoRol>> getRolByUserId(@PathVariable String idUsuario) {
        ResponseGeneric<DtoRol> response = new ResponseGeneric<>();
        try {
            DtoRol dtoRol = businessRol.getRolByUserId(idUsuario);
            response.setType("success");
            response.setListMessage(List.of("Rol obtenido correctamente"));
            response.setData(dtoRol);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            response.setType("error");
            response.setListMessage(List.of("Error al obtener el rol: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.OK);
        }
    }
}
