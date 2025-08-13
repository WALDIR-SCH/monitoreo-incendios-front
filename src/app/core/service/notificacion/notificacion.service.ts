import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DtoNotificacion {
  idNotificacion: string;
  titulo: string;
  mensaje: string;
  tipoNotificacion: 'NUEVO_REPORTE' | 'CAMBIO_ESTADO' | 'ALERTA_GENERAL' | 'SISTEMA';
  fechaCreacion: Date;
  fechaLectura?: Date;
  leida: boolean;
  idUsuario: string;
  idIncendio?: string; // Puede ser null para notificaciones generales
}

export interface ResponseNotificacion {
  type: string;
  listMessage: string[];
  data?: any;
}

export interface CrearAlertaGeneral {
  titulo: string;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  private apiUrl = `${environment.apiUrl}/notificacion`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las notificaciones de un usuario
   */
  obtenerNotificacionesUsuario(idUsuario: string): Observable<ResponseNotificacion> {
    return this.http.get<ResponseNotificacion>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  /**
   * Obtiene las notificaciones no leídas de un usuario
   */
  obtenerNotificacionesNoLeidas(idUsuario: string): Observable<ResponseNotificacion> {
    return this.http.get<ResponseNotificacion>(`${this.apiUrl}/usuario/${idUsuario}/no-leidas`);
  }

  /**
   * Cuenta las notificaciones no leídas de un usuario
   */
  contarNotificacionesNoLeidas(idUsuario: string): Observable<ResponseNotificacion> {
    return this.http.get<ResponseNotificacion>(`${this.apiUrl}/usuario/${idUsuario}/contar-no-leidas`);
  }

  /**
   * Marca una notificación como leída
   */
  marcarComoLeida(idNotificacion: string, idUsuario: string): Observable<ResponseNotificacion> {
    const params = new HttpParams().set('idUsuario', idUsuario);
    return this.http.put<ResponseNotificacion>(`${this.apiUrl}/marcar-leida/${idNotificacion}`, {}, { params });
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  marcarTodasComoLeidas(idUsuario: string): Observable<ResponseNotificacion> {
    return this.http.put<ResponseNotificacion>(`${this.apiUrl}/marcar-todas-leidas/${idUsuario}`, {});
  }

  /**
   * Crea una alerta general para todos los usuarios (solo administradores)
   */
  crearAlertaGeneral(alertaData: CrearAlertaGeneral): Observable<ResponseNotificacion> {
    return this.http.post<ResponseNotificacion>(`${this.apiUrl}/alerta-general`, alertaData);
  }
}
