package com.example.monitoreo_incendios.Controller.Notificacion;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.monitoreo_incendios.Business.BusinessNotificacion;
import com.example.monitoreo_incendios.Controller.Generic.ResponseGeneric;
import com.example.monitoreo_incendios.Dto.DtoNotificacion;

@RestController
@RequestMapping("/notificacion")
public class NotificacionController {

    @Autowired
    private BusinessNotificacion businessNotificacion;

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<ResponseGeneric<List<DtoNotificacion>>> obtenerNotificacionesUsuario(@PathVariable String idUsuario) {
        ResponseGeneric<List<DtoNotificacion>> response = new ResponseGeneric<>();
        try {
            List<DtoNotificacion> notificaciones = businessNotificacion.obtenerNotificacionesUsuario(idUsuario);

            response.setType("success");
            response.setListMessage(List.of("Notificaciones obtenidas exitosamente"));
            response.setData(notificaciones);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al obtener las notificaciones: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/usuario/{idUsuario}/no-leidas")
    public ResponseEntity<ResponseGeneric<List<DtoNotificacion>>> obtenerNotificacionesNoLeidas(@PathVariable String idUsuario) {
        ResponseGeneric<List<DtoNotificacion>> response = new ResponseGeneric<>();
        try {
            List<DtoNotificacion> notificaciones = businessNotificacion.obtenerNotificacionesNoLeidas(idUsuario);

            response.setType("success");
            response.setListMessage(List.of("Notificaciones no leídas obtenidas exitosamente"));
            response.setData(notificaciones);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al obtener las notificaciones no leídas: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/usuario/{idUsuario}/contar-no-leidas")
    public ResponseEntity<ResponseGeneric<Long>> contarNotificacionesNoLeidas(@PathVariable String idUsuario) {
        ResponseGeneric<Long> response = new ResponseGeneric<>();
        try {
            long cantidad = businessNotificacion.contarNotificacionesNoLeidas(idUsuario);

            response.setType("success");
            response.setListMessage(List.of("Cantidad de notificaciones no leídas obtenida exitosamente"));
            response.setData(cantidad);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al contar las notificaciones no leídas: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/marcar-leida/{idNotificacion}")
    public ResponseEntity<ResponseGeneric<String>> marcarComoLeida(
            @PathVariable String idNotificacion,
            @RequestParam String idUsuario) {
        ResponseGeneric<String> response = new ResponseGeneric<>();
        try {
            boolean marcada = businessNotificacion.marcarComoLeida(idNotificacion, idUsuario);

            if (marcada) {
                response.setType("success");
                response.setListMessage(List.of("Notificación marcada como leída exitosamente"));
                response.setData("Notificación actualizada");
            } else {
                response.setType("error");
                response.setListMessage(List.of("No se pudo marcar la notificación como leída"));
            }

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al marcar la notificación como leída: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/marcar-todas-leidas/{idUsuario}")
    public ResponseEntity<ResponseGeneric<String>> marcarTodasComoLeidas(@PathVariable String idUsuario) {
        ResponseGeneric<String> response = new ResponseGeneric<>();
        try {
            businessNotificacion.marcarTodasComoLeidas(idUsuario);

            response.setType("success");
            response.setListMessage(List.of("Todas las notificaciones marcadas como leídas exitosamente"));
            response.setData("Notificaciones actualizadas");

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al marcar todas las notificaciones como leídas: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // DTO para crear alerta general
    public static class DtoAlertaGeneral {
        private String titulo;
        private String mensaje;

        public String getTitulo() { return titulo; }
        public void setTitulo(String titulo) { this.titulo = titulo; }
        public String getMensaje() { return mensaje; }
        public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    }

    @PostMapping("/alerta-general")
    public ResponseEntity<ResponseGeneric<String>> crearAlertaGeneral(@RequestBody DtoAlertaGeneral dto) {
        ResponseGeneric<String> response = new ResponseGeneric<>();
        try {
            businessNotificacion.crearAlertaGeneral(dto.getTitulo(), dto.getMensaje());

            response.setType("success");
            response.setListMessage(List.of("Alerta general creada exitosamente"));
            response.setData("Alerta enviada a todos los usuarios");

            return new ResponseEntity<>(response, HttpStatus.CREATED);

        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al crear la alerta general: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
