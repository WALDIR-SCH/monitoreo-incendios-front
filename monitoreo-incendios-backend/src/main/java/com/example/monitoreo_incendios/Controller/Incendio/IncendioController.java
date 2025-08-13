package com.example.monitoreo_incendios.Controller.Incendio;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.monitoreo_incendios.Business.BusinessIncendio;
import com.example.monitoreo_incendios.Controller.Generic.ResponseGeneric;
import com.example.monitoreo_incendios.Dto.DtoActualizarEstadoIncendio;
import com.example.monitoreo_incendios.Dto.DtoFiltroIncendio;
import com.example.monitoreo_incendios.Dto.DtoReporteIncendio;

@RestController
@RequestMapping("/incendio")
public class IncendioController {

    @Autowired
    private BusinessIncendio businessIncendio;

    @PostMapping(path = "/reportar", consumes = { "multipart/form-data" })
    public ResponseEntity<ResponseGeneric<DtoReporteIncendio>> reportarIncendio(@ModelAttribute DtoReporteIncendio dto) {
        ResponseGeneric<DtoReporteIncendio> response = new ResponseGeneric<>();
        try {
            DtoReporteIncendio incendioCreado = businessIncendio.crearReporteIncendio(dto);

            response.setType("success");
            response.setListMessage(List.of("Reporte de incendio creado exitosamente"));
            response.setData(incendioCreado);

            return new ResponseEntity<>(response, HttpStatus.CREATED);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al crear el reporte de incendio: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/listar")
    public ResponseEntity<ResponseGeneric<Page<DtoReporteIncendio>>> listarIncendios(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin,
            @RequestParam(required = false) String pais,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String nombreCiudad,
            @RequestParam(required = false) String nivelUrgencia,
            @RequestParam(required = false) Float areaMinima,
            @RequestParam(required = false) Float areaMaxima,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "fechaReporte") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        ResponseGeneric<Page<DtoReporteIncendio>> response = new ResponseGeneric<>();
        try {
            DtoFiltroIncendio filtro = new DtoFiltroIncendio();
            filtro.setEstado(estado);
            filtro.setFechaInicio(fechaInicio);
            filtro.setFechaFin(fechaFin);
            filtro.setPais(pais);
            filtro.setRegion(region);
            filtro.setNombreCiudad(nombreCiudad);
            filtro.setNivelUrgencia(nivelUrgencia);
            filtro.setAreaMinima(areaMinima);
            filtro.setAreaMaxima(areaMaxima);
            filtro.setPage(page);
            filtro.setSize(size);
            filtro.setSortBy(sortBy);
            filtro.setSortDirection(sortDirection);

            Page<DtoReporteIncendio> incendios = businessIncendio.obtenerIncendiosConFiltros(filtro);

            response.setType("success");
            response.setListMessage(List.of("Incendios obtenidos exitosamente"));
            response.setData(incendios);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al obtener los incendios: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/detalle/{idIncendio}")
    public ResponseEntity<ResponseGeneric<DtoReporteIncendio>> obtenerDetalleIncendio(@PathVariable String idIncendio) {
        ResponseGeneric<DtoReporteIncendio> response = new ResponseGeneric<>();
        try {
            DtoReporteIncendio incendio = businessIncendio.obtenerIncendioPorId(idIncendio);

            response.setType("success");
            response.setListMessage(List.of("Detalle del incendio obtenido exitosamente"));
            response.setData(incendio);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (RuntimeException e) {
            response.setType("error");
            response.setListMessage(List.of(e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al obtener el detalle del incendio: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/actualizar-estado")
    public ResponseEntity<ResponseGeneric<DtoReporteIncendio>> actualizarEstadoIncendio(@RequestBody DtoActualizarEstadoIncendio dto) {
        ResponseGeneric<DtoReporteIncendio> response = new ResponseGeneric<>();
        try {
            DtoReporteIncendio incendioActualizado = businessIncendio.actualizarEstadoIncendio(dto);

            response.setType("success");
            response.setListMessage(List.of("Estado del incendio actualizado exitosamente"));
            response.setData(incendioActualizado);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (RuntimeException e) {
            response.setType("error");
            response.setListMessage(List.of(e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al actualizar el estado del incendio: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/recientes")
    public ResponseEntity<ResponseGeneric<List<DtoReporteIncendio>>> obtenerIncendiosRecientes() {
        ResponseGeneric<List<DtoReporteIncendio>> response = new ResponseGeneric<>();
        try {
            List<DtoReporteIncendio> incendiosRecientes = businessIncendio.obtenerIncendiosRecientes();

            response.setType("success");
            response.setListMessage(List.of("Incendios recientes obtenidos exitosamente"));
            response.setData(incendiosRecientes);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al obtener los incendios recientes: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
@GetMapping("/recientesmes")
    public ResponseEntity<ResponseGeneric<List<DtoReporteIncendio>>> obtenerIncendiosRecientesMes() {
        ResponseGeneric<List<DtoReporteIncendio>> response = new ResponseGeneric<>();
        try {
            List<DtoReporteIncendio> incendiosRecientes = businessIncendio.obtenerIncendiosRecientesMes();

            response.setType("success");
            response.setListMessage(List.of("Incendios recientes obtenidos exitosamente"));
            response.setData(incendiosRecientes);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al obtener los incendios recientes: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @GetMapping("/activos")
    public ResponseEntity<ResponseGeneric<List<DtoReporteIncendio>>> obtenerIncendiosActivos() {
        ResponseGeneric<List<DtoReporteIncendio>> response = new ResponseGeneric<>();
        try {
            List<DtoReporteIncendio> incendiosActivos = businessIncendio.obtenerIncendiosActivos();

            response.setType("success");
            response.setListMessage(List.of("Incendios activos obtenidos exitosamente"));
            response.setData(incendiosActivos);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al obtener los incendios activos: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/restauracion")
    public ResponseEntity<ResponseGeneric<List<DtoReporteIncendio>>> obtenerIncendiosParaRestauracion(
            @RequestParam(required = false, defaultValue = "5.0") Float areaMinima) {
        ResponseGeneric<List<DtoReporteIncendio>> response = new ResponseGeneric<>();
        try {
            List<DtoReporteIncendio> incendiosParaRestauracion = businessIncendio.obtenerIncendiosParaRestauracion(areaMinima);

            response.setType("success");
            response.setListMessage(List.of("Incendios para restauración obtenidos exitosamente"));
            response.setData(incendiosParaRestauracion);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al obtener los incendios para restauración: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Endpoints de exportación
    @GetMapping("/exportar/json")
    public ResponseEntity<String> exportarJson(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin,
            @RequestParam(required = false) String pais,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String nombreCiudad,
            @RequestParam(required = false) String nivelUrgencia,
            @RequestParam(required = false) Float areaMinima,
            @RequestParam(required = false) Float areaMaxima) {
        try {
            DtoFiltroIncendio filtro = new DtoFiltroIncendio();
            filtro.setEstado(estado);
            filtro.setFechaInicio(fechaInicio);
            filtro.setFechaFin(fechaFin);
            filtro.setPais(pais);
            filtro.setRegion(region);
            filtro.setNombreCiudad(nombreCiudad);
            filtro.setNivelUrgencia(nivelUrgencia);
            filtro.setAreaMinima(areaMinima);
            filtro.setAreaMaxima(areaMaxima);

            String jsonData = businessIncendio.exportarAJson(filtro);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=incendios.json");

            return new ResponseEntity<>(jsonData, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Error al exportar datos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/exportar/csv")
    public ResponseEntity<String> exportarCsv(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin,
            @RequestParam(required = false) String pais,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String nombreCiudad,
            @RequestParam(required = false) String nivelUrgencia,
            @RequestParam(required = false) Float areaMinima,
            @RequestParam(required = false) Float areaMaxima) {
        try {
            DtoFiltroIncendio filtro = new DtoFiltroIncendio();
            filtro.setEstado(estado);
            filtro.setFechaInicio(fechaInicio);
            filtro.setFechaFin(fechaFin);
            filtro.setPais(pais);
            filtro.setRegion(region);
            filtro.setNombreCiudad(nombreCiudad);
            filtro.setNivelUrgencia(nivelUrgencia);
            filtro.setAreaMinima(areaMinima);
            filtro.setAreaMaxima(areaMaxima);

            String csvData = businessIncendio.exportarACsv(filtro);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=incendios.csv");

            return new ResponseEntity<>(csvData, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Error al exportar datos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/exportar/excel")
    public ResponseEntity<byte[]> exportarExcel(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin,
            @RequestParam(required = false) String pais,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String nombreCiudad,
            @RequestParam(required = false) String nivelUrgencia,
            @RequestParam(required = false) Float areaMinima,
            @RequestParam(required = false) Float areaMaxima) {
        try {
            DtoFiltroIncendio filtro = new DtoFiltroIncendio();
            filtro.setEstado(estado);
            filtro.setFechaInicio(fechaInicio);
            filtro.setFechaFin(fechaFin);
            filtro.setPais(pais);
            filtro.setRegion(region);
            filtro.setNombreCiudad(nombreCiudad);
            filtro.setNivelUrgencia(nivelUrgencia);
            filtro.setAreaMinima(areaMinima);
            filtro.setAreaMaxima(areaMaxima);

            byte[] excelData = businessIncendio.exportarAExcel(filtro);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=incendios.xlsx");

            return new ResponseEntity<>(excelData, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ========== ENDPOINTS PARA GESTIÓN DE INCENDIOS POR USUARIO ==========

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<ResponseGeneric<Page<DtoReporteIncendio>>> obtenerIncendiosPorUsuario(
            @PathVariable String idUsuario,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin,
            @RequestParam(required = false) String pais,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String nombreCiudad,
            @RequestParam(required = false) String nivelUrgencia,
            @RequestParam(required = false) Float areaMinima,
            @RequestParam(required = false) Float areaMaxima,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "fechaReporte") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        ResponseGeneric<Page<DtoReporteIncendio>> response = new ResponseGeneric<>();
        try {
            DtoFiltroIncendio filtro = new DtoFiltroIncendio();
            filtro.setEstado(estado);
            filtro.setFechaInicio(fechaInicio);
            filtro.setFechaFin(fechaFin);
            filtro.setPais(pais);
            filtro.setRegion(region);
            filtro.setNombreCiudad(nombreCiudad);
            filtro.setNivelUrgencia(nivelUrgencia);
            filtro.setAreaMinima(areaMinima);
            filtro.setAreaMaxima(areaMaxima);
            filtro.setPage(page);
            filtro.setSize(size);
            filtro.setSortBy(sortBy);
            filtro.setSortDirection(sortDirection);

            Page<DtoReporteIncendio> incendios = businessIncendio.obtenerIncendiosPorUsuario(idUsuario, filtro);

            response.setType("success");
            response.setListMessage(List.of("Incendios del usuario obtenidos exitosamente"));
            response.setData(incendios);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (RuntimeException e) {
            response.setType("error");
            response.setListMessage(List.of(e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al obtener los incendios del usuario: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/usuario/{idUsuario}/incendio/{idIncendio}")
    public ResponseEntity<ResponseGeneric<DtoReporteIncendio>> obtenerIncendioDeUsuario(
            @PathVariable String idUsuario,
            @PathVariable String idIncendio) {
        ResponseGeneric<DtoReporteIncendio> response = new ResponseGeneric<>();
        try {
            DtoReporteIncendio incendio = businessIncendio.obtenerIncendioDeUsuario(idIncendio, idUsuario);

            response.setType("success");
            response.setListMessage(List.of("Incendio del usuario obtenido exitosamente"));
            response.setData(incendio);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (RuntimeException e) {
            response.setType("error");
            response.setListMessage(List.of(e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al obtener el incendio del usuario: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping(path = "/usuario/{idUsuario}/incendio/{idIncendio}", consumes = { "multipart/form-data" })
    public ResponseEntity<ResponseGeneric<DtoReporteIncendio>> editarIncendioDeUsuario(
            @PathVariable String idUsuario,
            @PathVariable String idIncendio,
            @ModelAttribute DtoReporteIncendio dtoActualizado) {
        ResponseGeneric<DtoReporteIncendio> response = new ResponseGeneric<>();
        try {
            DtoReporteIncendio incendioActualizado = businessIncendio.editarIncendioDeUsuario(idIncendio, idUsuario, dtoActualizado);

            response.setType("success");
            response.setListMessage(List.of("Incendio editado exitosamente"));
            response.setData(incendioActualizado);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (RuntimeException e) {
            response.setType("error");
            response.setListMessage(List.of(e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al editar el incendio: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/usuario/{idUsuario}/incendio/{idIncendio}")
    public ResponseEntity<ResponseGeneric<String>> eliminarIncendioDeUsuario(
            @PathVariable String idUsuario,
            @PathVariable String idIncendio) {
        ResponseGeneric<String> response = new ResponseGeneric<>();
        try {
            businessIncendio.eliminarIncendioDeUsuario(idIncendio, idUsuario);

            response.setType("success");
            response.setListMessage(List.of("Incendio eliminado exitosamente"));
            response.setData("Incendio con ID " + idIncendio + " eliminado correctamente");

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (RuntimeException e) {
            response.setType("error");
            response.setListMessage(List.of(e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al eliminar el incendio: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/usuario/{idUsuario}/resumen")
    public ResponseEntity<ResponseGeneric<List<DtoReporteIncendio>>> obtenerResumenIncendiosUsuario(
            @PathVariable String idUsuario) {
        ResponseGeneric<List<DtoReporteIncendio>> response = new ResponseGeneric<>();
        try {
            List<DtoReporteIncendio> resumenIncendios = businessIncendio.obtenerResumenIncendiosUsuario(idUsuario);

            response.setType("success");
            response.setListMessage(List.of("Resumen de incendios del usuario obtenido exitosamente"));
            response.setData(resumenIncendios);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (RuntimeException e) {
            response.setType("error");
            response.setListMessage(List.of(e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al obtener el resumen de incendios del usuario: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/usuario/{idUsuario}/archivo/{idArchivo}")
    public ResponseEntity<ResponseGeneric<String>> eliminarArchivoDeIncendio(
            @PathVariable String idUsuario,
            @PathVariable String idArchivo) {
        ResponseGeneric<String> response = new ResponseGeneric<>();
        try {
            businessIncendio.eliminarArchivoDeIncendio(idArchivo, idUsuario);

            response.setType("success");
            response.setListMessage(List.of("Archivo eliminado exitosamente"));
            response.setData("Archivo con ID " + idArchivo + " eliminado correctamente");

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (RuntimeException e) {
            response.setType("error");
            response.setListMessage(List.of(e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al eliminar el archivo: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
