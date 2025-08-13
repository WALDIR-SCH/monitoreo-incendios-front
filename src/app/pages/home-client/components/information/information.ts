import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncendioService, ResponseReporte } from '../../../../core/service/incendio/incendio.service';

interface IncendioReciente {
  idIncendio: string;
  nombreCiudad: string;
  pais: string;
  region?: string;
  tipoVegetacion: string;
  areaAfectada: number;
  estado: string; // EstadoIncendio: REPORTADO, EN_CURSO, CONTROLADO, EXTINGUIDO
  nivelUrgencia: string; // NivelUrgencia: BAJA, MEDIA, ALTA, CRITICA
  fuenteIncendio: string; // FuenteIncendio: NATURAL, HUMANO, DESCONOCIDO
  fechaReporte: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  poblacion?: number;
  archivos?: ArchivoIncendio[]; // Este campo viene null en la respuesta
  archivosSubidos?: ArchivoIncendio[]; // Este es el campo que realmente contiene los archivos
  comentarios?: ComentarioIncendio[];
  usuario?: {
    nombre: string;
    email: string;
  };
}

interface ArchivoIncendio {
  idArchivo: string;
  nombreArchivo: string;
  urlArchivo: string;
  tipoArchivo: string; // TipoArchivo: IMAGEN, VIDEO
  tamanhoArchivo?: number;
  fechaSubida: string;
}

interface ComentarioIncendio {
  idComentario: string;
  comentario: string;
  fechaComentario: string;
  nombreUsuario: string;
  accionTomada?: string;
}

@Component({
  selector: 'app-information',
  imports: [CommonModule],
  templateUrl: './information.html',
  styleUrl: './information.css'
})
export class Information implements OnInit {
  private incendioService = inject(IncendioService);

  incendiosRecientes: IncendioReciente[] = [];
  cargando = true;
  error = '';

  // Modal para archivos multimedia
  modalAbierto = false;
  archivoSeleccionado: ArchivoIncendio | null = null;

  ngOnInit() {
    this.cargarIncendiosRecientes();
  }

  cargarIncendiosRecientes() {
    this.cargando = true;
    this.error = '';

    this.incendioService.obtenerIncendiosRecientesMes().subscribe({
      next: (response: ResponseReporte) => {
        if (response.type === 'success' && response.data) {
          this.incendiosRecientes = response.data;
        } else {
          this.error = 'No se pudieron cargar los incendios recientes';
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar incendios recientes:', error);
        this.error = 'Error al cargar los datos. Inténtalo nuevamente.';
        this.cargando = false;
      }
    });
  }

  obtenerIconoEstado(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'reportado':
        return '🔥';
      case 'en_curso':
        return '�';
      case 'controlado':
        return '🚒';
      case 'extinguido':
        return '✅';
      default:
        return '📍';
    }
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'reportado':
        return 'bg-red-100 text-red-800';
      case 'en_curso':
        return 'bg-orange-100 text-orange-800';
      case 'controlado':
        return 'bg-blue-100 text-blue-800';
      case 'extinguido':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  obtenerTextoEstado(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'reportado':
        return 'Reportado';
      case 'en_curso':
        return 'En Curso';
      case 'controlado':
        return 'Controlado';
      case 'extinguido':
        return 'Extinguido';
      default:
        return estado || 'Desconocido';
    }
  }

  obtenerIconoUrgencia(urgencia: string): string {
    switch (urgencia?.toLowerCase()) {
      case 'critica':
        return '🚨';
      case 'alta':
        return '⚠️';
      case 'media':
        return '⚡';
      case 'baja':
        return '📍';
      default:
        return '📍';
    }
  }

  obtenerClaseUrgencia(urgencia: string): string {
    switch (urgencia?.toLowerCase()) {
      case 'critica':
        return 'bg-red-600 text-white';
      case 'alta':
        return 'bg-orange-500 text-white';
      case 'media':
        return 'bg-yellow-500 text-white';
      case 'baja':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  obtenerTiempoTranscurrido(fecha: string): string {
    const ahora = new Date();
    const fechaReporte = new Date(fecha);
    const diffMs = ahora.getTime() - fechaReporte.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHoras >= 24) {
      const diffDias = Math.floor(diffHoras / 24);
      return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    } else if (diffHoras > 0) {
      return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    } else if (diffMinutos > 0) {
      return `Hace ${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''}`;
    } else {
      return 'Hace unos momentos';
    }
  }

  formatearArea(area: number): string {
    if (area >= 1000) {
      return `${(area / 1000).toFixed(1)}K ha`;
    }
    return `${area} ha`;
  }

  formatearTamano(bytes?: number): string {
    if (!bytes) return '';

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  reintentar() {
    this.cargarIncendiosRecientes();
  }

  trackByIncendio(index: number, incendio: IncendioReciente): string {
    return incendio.idIncendio;
  }

  // Métodos para archivos multimedia
  abrirModal(archivo: ArchivoIncendio) {
    this.archivoSeleccionado = archivo;
    this.modalAbierto = true;
    document.body.style.overflow = 'hidden'; // Prevenir scroll
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.archivoSeleccionado = null;
    document.body.style.overflow = 'auto'; // Restaurar scroll
  }

  esImagen(archivo: ArchivoIncendio): boolean {
    return archivo.tipoArchivo?.toUpperCase() === 'IMAGEN';
  }

  esVideo(archivo: ArchivoIncendio): boolean {
    return archivo.tipoArchivo?.toUpperCase() === 'VIDEO';
  }

  formatearTamanhoArchivo(bytes?: number): string {
    if (!bytes) return '';

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  trackByArchivo(index: number, archivo: ArchivoIncendio): string {
    return archivo.idArchivo;
  }
}
