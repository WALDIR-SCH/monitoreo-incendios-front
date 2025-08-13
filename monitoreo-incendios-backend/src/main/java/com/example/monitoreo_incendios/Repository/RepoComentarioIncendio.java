package com.example.monitoreo_incendios.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.monitoreo_incendios.Entity.TComentarioIncendio;

@Repository
public interface RepoComentarioIncendio extends JpaRepository<TComentarioIncendio, String> {

    List<TComentarioIncendio> findByIncendioIdIncendioOrderByFechaComentarioDesc(String idIncendio);

    List<TComentarioIncendio> findByUsuarioIdUsuario(String idUsuario);

    void deleteByIncendioIdIncendio(String idIncendio);
}
