package com.example.monitoreo_incendios.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.monitoreo_incendios.Entity.TArchivoIncendio;

@Repository
public interface RepoArchivoIncendio extends JpaRepository<TArchivoIncendio, String> {

    List<TArchivoIncendio> findByIncendioIdIncendio(String idIncendio);

    List<TArchivoIncendio> findByTipoArchivo(TArchivoIncendio.TipoArchivo tipoArchivo);

    void deleteByIncendioIdIncendio(String idIncendio);
}
