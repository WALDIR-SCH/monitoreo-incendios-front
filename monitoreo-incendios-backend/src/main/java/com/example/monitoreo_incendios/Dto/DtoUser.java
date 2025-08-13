package com.example.monitoreo_incendios.Dto;

import java.sql.Timestamp;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DtoUser {
	private String idUsuario;
	private String idRol;
	private String nombre;
	private String email;
	private String contrasenha;
	private String foto;
	private Timestamp fechaRegistro;
	private String jwtToken;
  private String nombreRol;
}
