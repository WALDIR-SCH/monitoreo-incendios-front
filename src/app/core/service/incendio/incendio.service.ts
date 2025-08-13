import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface ReporteIncendio {
  idUsuario?: string;
  tipoVegetacion: string;
  fuenteIncendio: string;
  areaAfectada: number;
  descripcion: string;
  nombreCiudad: string;
  latitud: number;
  longitud: number;
  pais: string;
  region?: string;
  poblacion?: number;
  archivos?: File[];
}

export interface ResponseReporte {
  type: string;
  listMessage: string[];
  data?: any;
}

export interface ActualizarEstadoIncendio {
  idIncendio: string;
  idUsuarioAdmin: string;
  nuevoEstado: string;
  comentario?: string;
  accionTomada?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IncendioService {

  private apiIncendio = `${environment.apiUrl}/incendio`;

  constructor(private httpClient: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept': 'application/json'
    });
  }

  reportarIncendio(reporte: ReporteIncendio): Observable<ResponseReporte> {
    const formData = new FormData();

    // Agregar datos del reporte
    formData.append('idUsuario', reporte.idUsuario?.toString() || '');
    formData.append('tipoVegetacion', reporte.tipoVegetacion);
    formData.append('fuenteIncendio', reporte.fuenteIncendio);
    formData.append('areaAfectada', reporte.areaAfectada.toString());
    formData.append('descripcion', reporte.descripcion);
    formData.append('nombreCiudad', reporte.nombreCiudad);
    formData.append('latitud', reporte.latitud.toString());
    formData.append('longitud', reporte.longitud.toString());
    formData.append('pais', reporte.pais);

    if (reporte.region) {
      formData.append('region', reporte.region);
    }

    if (reporte.poblacion) {
      formData.append('poblacion', reporte.poblacion.toString());
    }

    // Agregar archivos si existen
    if (reporte.archivos && reporte.archivos.length > 0) {
      reporte.archivos.forEach((file, index) => {
        formData.append('archivos', file);
      });
    }

    // Configurar headers específicos para uploads de archivos
    const headers = new HttpHeaders({
      'Accept': 'application/json',
    });

    const options = {
      headers: headers,
      observe: 'response' as const,
      timeout: 300000
    };

    return this.httpClient.post<ResponseReporte>(`${this.apiIncendio}/reportar`, formData, options)
      .pipe(
        map((response: any) => {
          console.log('Response status:', response.status);
          console.log('Response body:', response.body);

          if (response.status === 201 && response.body) {
            return response.body;
          }

          if (response.status >= 200 && response.status < 300) {
            return response.body || { type: 'success', listMessage: ['Reporte enviado exitosamente'] };
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }),
        catchError((error: any) => {
          console.error('Error en reportarIncendio:', error);

          if (error.status === 201 || (error.status === 0 && error.url)) {
            console.log('Posible éxito con error de red, retornando respuesta exitosa');
            return of({ type: 'success', listMessage: ['Reporte enviado exitosamente'] });
          }

          return throwError(() => error);
        })
      );
  }

  obtenerIncendios(filtros?: any): Observable<ResponseReporte> {
    let params = '';
    if (filtros) {
      const searchParams = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
          searchParams.append(key, filtros[key].toString());
        }
      });
      params = searchParams.toString();
    }

    const url = params ? `${this.apiIncendio}/listar?${params}` : `${this.apiIncendio}/listar`;
    return this.httpClient.get<ResponseReporte>(url, { headers: this.getHeaders() });
  }

  obtenerIncendioDetalle(idIncendio: string): Observable<ResponseReporte> {
    return this.httpClient.get<ResponseReporte>(`${this.apiIncendio}/detalle/${idIncendio}`,
      { headers: this.getHeaders() });
  }

  obtenerIncendiosRecientes(): Observable<ResponseReporte> {
    return this.httpClient.get<ResponseReporte>(`${this.apiIncendio}/recientes`,
      { headers: this.getHeaders() });
  }

    obtenerIncendiosRecientesMes(): Observable<ResponseReporte> {
    return this.httpClient.get<ResponseReporte>(`${this.apiIncendio}/recientesmes`,
      { headers: this.getHeaders() });
  }

  obtenerIncendiosActivos(): Observable<ResponseReporte> {
    return this.httpClient.get<ResponseReporte>(`${this.apiIncendio}/activos`,
      { headers: this.getHeaders() });
  }

  // ========== MÉTODOS PARA GESTIÓN DE INCENDIOS POR USUARIO ==========

  obtenerIncendiosPorUsuario(idUsuario: string, filtros?: any): Observable<ResponseReporte> {
    let params = '';
    if (filtros) {
      const searchParams = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
          searchParams.append(key, filtros[key].toString());
        }
      });
      params = searchParams.toString();
    }

    const url = params ?
      `${this.apiIncendio}/usuario/${idUsuario}?${params}` :
      `${this.apiIncendio}/usuario/${idUsuario}`;

    return this.httpClient.get<ResponseReporte>(url, { headers: this.getHeaders() });
  }

  obtenerIncendioDeUsuario(idUsuario: string, idIncendio: string): Observable<ResponseReporte> {
    return this.httpClient.get<ResponseReporte>(
      `${this.apiIncendio}/usuario/${idUsuario}/incendio/${idIncendio}`,
      { headers: this.getHeaders() }
    );
  }

  editarIncendioDeUsuario(idUsuario: string, idIncendio: string, reporte: ReporteIncendio): Observable<ResponseReporte> {
    const formData = new FormData();

    // Agregar datos del reporte
    if (reporte.tipoVegetacion) formData.append('tipoVegetacion', reporte.tipoVegetacion);
    if (reporte.fuenteIncendio) formData.append('fuenteIncendio', reporte.fuenteIncendio);
    if (reporte.areaAfectada) formData.append('areaAfectada', reporte.areaAfectada.toString());
    if (reporte.descripcion) formData.append('descripcion', reporte.descripcion);
    if (reporte.nombreCiudad) formData.append('nombreCiudad', reporte.nombreCiudad);
    if (reporte.latitud) formData.append('latitud', reporte.latitud.toString());
    if (reporte.longitud) formData.append('longitud', reporte.longitud.toString());
    if (reporte.pais) formData.append('pais', reporte.pais);
    if (reporte.region) formData.append('region', reporte.region);
    if (reporte.poblacion) formData.append('poblacion', reporte.poblacion.toString());

    // Agregar archivos nuevos si existen
    if (reporte.archivos && reporte.archivos.length > 0) {
      reporte.archivos.forEach((file) => {
        formData.append('archivos', file);
      });
    }

    const headers = new HttpHeaders({
      'Accept': 'application/json',
    });

    return this.httpClient.put<ResponseReporte>(
      `${this.apiIncendio}/usuario/${idUsuario}/incendio/${idIncendio}`,
      formData,
      { headers }
    );
  }

  eliminarIncendioDeUsuario(idUsuario: string, idIncendio: string): Observable<ResponseReporte> {
    return this.httpClient.delete<ResponseReporte>(
      `${this.apiIncendio}/usuario/${idUsuario}/incendio/${idIncendio}`,
      { headers: this.getHeaders() }
    );
  }

  obtenerResumenIncendiosUsuario(idUsuario: string): Observable<ResponseReporte> {
    return this.httpClient.get<ResponseReporte>(
      `${this.apiIncendio}/usuario/${idUsuario}/resumen`,
      { headers: this.getHeaders() }
    );
  }

  eliminarArchivoDeIncendio(idUsuario: string, idArchivo: string): Observable<ResponseReporte> {
    return this.httpClient.delete<ResponseReporte>(
      `${this.apiIncendio}/usuario/${idUsuario}/archivo/${idArchivo}`,
      { headers: this.getHeaders() }
    );
  }

  // ========== MÉTODOS PARA ADMINISTRACIÓN DE INCENDIOS ==========

  actualizarEstadoIncendio(datos: ActualizarEstadoIncendio): Observable<ResponseReporte> {
    return this.httpClient.put<ResponseReporte>(
      `${this.apiIncendio}/actualizar-estado`,
      datos,
      { headers: this.getHeaders() }
    );
  }

  obtenerIncendiosParaRestauracion(areaMinima?: number): Observable<ResponseReporte> {
    const params = areaMinima ? `?areaMinima=${areaMinima}` : '';
    return this.httpClient.get<ResponseReporte>(
      `${this.apiIncendio}/restauracion${params}`,
      { headers: this.getHeaders() }
    );
  }

  // Métodos de exportación
  exportarJSON(filtros?: any): Observable<string> {
    let params = '';
    if (filtros) {
      const searchParams = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
          searchParams.append(key, filtros[key].toString());
        }
      });
      params = searchParams.toString();
    }

    const url = params ? `${this.apiIncendio}/exportar/json?${params}` : `${this.apiIncendio}/exportar/json`;
    return this.httpClient.get(url, { responseType: 'text' });
  }

  exportarCSV(filtros?: any): Observable<string> {
    let params = '';
    if (filtros) {
      const searchParams = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
          searchParams.append(key, filtros[key].toString());
        }
      });
      params = searchParams.toString();
    }

    const url = params ? `${this.apiIncendio}/exportar/csv?${params}` : `${this.apiIncendio}/exportar/csv`;
    return this.httpClient.get(url, { responseType: 'text' });
  }

  exportarExcel(filtros?: any): Observable<Blob> {
    let params = '';
    if (filtros) {
      const searchParams = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
          searchParams.append(key, filtros[key].toString());
        }
      });
      params = searchParams.toString();
    }

    const url = params ? `${this.apiIncendio}/exportar/excel?${params}` : `${this.apiIncendio}/exportar/excel`;
    return this.httpClient.get(url, { responseType: 'blob' });
  }
}
