package com.example.monitoreo_incendios.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.monitoreo_incendios.Entity.TRol;
import com.example.monitoreo_incendios.Entity.TUser;

@Repository
public interface RepoUser extends JpaRepository<TUser, String> {

   Optional<TUser> findByEmail(String email);
   
   List<TUser> findByRolTipo(TRol.TipoRol tipoRol);

}
