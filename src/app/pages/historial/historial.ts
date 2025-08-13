import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { IncendioService, ResponseReporte } from '../../core/service/incendio/incendio.service';
import { TokenService } from '../../core/service/oauth/token.service';
import { HeaderClient } from '../../shared/header-client/header-client';

interface IncendioUsuario {
  idIncendio: string;
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
  nivelUrgencia: string;
  estado: string;
  fechaReporte: Date;
  fechaActualizacion?: Date;
  nombreUsuario: string;
  emailUsuario: string;
  archivosSubidos?: any[];
  comentarios?: any[];
}

@Component({
  selector: 'app-historial',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderClient],
  templateUrl: './historial.html',
  styleUrl: './historial.css'
})
export class Historial implements OnInit {

  incendiosUsuario: IncendioUsuario[] = [];
  incendioSeleccionado: IncendioUsuario | null = null;
  filtroForm: FormGroup;
  editandoIncendio: IncendioUsuario | null = null;
  editForm: FormGroup;

  // Estados de la aplicación
  cargando: boolean = false;
  error: string = '';
  modoVista: 'lista' | 'detalle' | 'editar' = 'lista';

  // Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 10;
  totalElementos: number = 0;
  totalPaginas: number = 0;

  // Filtros disponibles
  estadosDisponibles = ['REPORTADO', 'EN_CURSO', 'CONTROLADO', 'EXTINGUIDO'];
  nivelesUrgencia = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
  tiposVegetacion = ['BOSQUE', 'PASTIZAL', 'URBANO', 'CULTIVO', 'MIXTO'];
  fuentesIncendio = ['NATURAL', 'HUMANA', 'DESCONOCIDO'];

  private idUsuario: string = '';

  constructor(
    private incendioService: IncendioService,
    private tokenService: TokenService,
    private fb: FormBuilder
  ) {
    this.filtroForm = this.fb.group({
      estado: [''],
      fechaInicio: [''],
      fechaFin: [''],
      nombreCiudad: [''],
      nivelUrgencia: [''],
      areaMinima: [''],
      areaMaxima: ['']
    });

    this.editForm = this.fb.group({
      tipoVegetacion: [''],
      fuenteIncendio: [''],
      areaAfectada: [''],
      descripcion: [''],
      nombreCiudad: [''],
      latitud: [''],
      longitud: [''],
      pais: [''],
      region: [''],
      poblacion: ['']
    });
  }

  ngOnInit(): void {
    const userId = this.tokenService.getUserId();
    if (userId) {
      this.idUsuario = userId;
      this.cargarIncendiosUsuario();
    } else {
      this.error = 'No se pudo obtener el ID del usuario. Por favor, inicie sesión nuevamente.';
    }
  }

  cargarIncendiosUsuario(): void {
    this.cargando = true;
    this.error = '';

    const filtros = {
      ...this.filtroForm.value,
      page: this.paginaActual,
      size: this.tamanoPagina,
      sortBy: 'fechaReporte',
      sortDirection: 'DESC'
    };

    // Limpiar filtros vacíos
    Object.keys(filtros).forEach(key => {
      if (filtros[key] === '' || filtros[key] === null || filtros[key] === undefined) {
        delete filtros[key];
      }
    });

    this.incendioService.obtenerIncendiosPorUsuario(this.idUsuario, filtros)
      .subscribe({
        next: (response: ResponseReporte) => {
          this.cargando = false;
          if (response.type === 'success' && response.data) {
            this.incendiosUsuario = response.data.content || [];
            this.totalElementos = response.data.totalElements || 0;
            this.totalPaginas = response.data.totalPages || 0;
          } else {
            this.error = response.listMessage?.join(', ') || 'Error al cargar los incendios';
          }
        },
        error: (error) => {
          this.cargando = false;
          this.error = 'Error de conexión al cargar los incendios';
          console.error('Error:', error);
        }
      });
  }

  aplicarFiltros(): void {
    this.paginaActual = 0;
    this.cargarIncendiosUsuario();
  }

  limpiarFiltros(): void {
    this.filtroForm.reset();
    this.paginaActual = 0;
    this.cargarIncendiosUsuario();
  }

  verDetalle(incendio: IncendioUsuario): void {
    this.cargando = true;
    this.incendioService.obtenerIncendioDeUsuario(this.idUsuario, incendio.idIncendio)
      .subscribe({
        next: (response: ResponseReporte) => {
          this.cargando = false;
          if (response.type === 'success' && response.data) {
            this.incendioSeleccionado = response.data;
            this.modoVista = 'detalle';
          } else {
            this.error = response.listMessage?.join(', ') || 'Error al cargar el detalle';
          }
        },
        error: (error) => {
          this.cargando = false;
          this.error = 'Error al cargar el detalle del incendio';
          console.error('Error:', error);
        }
      });
  }

  iniciarEdicion(incendio: IncendioUsuario): void {
    if (incendio.estado !== 'REPORTADO') {
      this.error = 'Solo se pueden editar incendios en estado REPORTADO';
      return;
    }

    this.editandoIncendio = incendio;
    this.editForm.patchValue({
      tipoVegetacion: incendio.tipoVegetacion,
      fuenteIncendio: incendio.fuenteIncendio,
      areaAfectada: incendio.areaAfectada,
      descripcion: incendio.descripcion,
      nombreCiudad: incendio.nombreCiudad,
      latitud: incendio.latitud,
      longitud: incendio.longitud,
      pais: incendio.pais,
      region: incendio.region,
      poblacion: incendio.poblacion
    });
    this.modoVista = 'editar';
  }

  guardarEdicion(): void {
    if (!this.editandoIncendio || this.editForm.invalid) return;

    this.cargando = true;
    const datosActualizados = {
      ...this.editForm.value,
      idUsuario: this.idUsuario
    };

    this.incendioService.editarIncendioDeUsuario(
      this.idUsuario,
      this.editandoIncendio.idIncendio,
      datosActualizados
    ).subscribe({
      next: (response: ResponseReporte) => {
        this.cargando = false;
        if (response.type === 'success') {
          this.modoVista = 'lista';
          this.editandoIncendio = null;
          this.cargarIncendiosUsuario();
          // Mostrar mensaje de éxito
        } else {
          this.error = response.listMessage?.join(', ') || 'Error al actualizar el incendio';
        }
      },
      error: (error) => {
        this.cargando = false;
        this.error = 'Error al actualizar el incendio';
        console.error('Error:', error);
      }
    });
  }

  confirmarEliminacion(incendio: IncendioUsuario): void {
    if (incendio.estado !== 'REPORTADO') {
      this.error = 'Solo se pueden eliminar incendios en estado REPORTADO';
      return;
    }

    if (confirm(`¿Está seguro de que desea eliminar el reporte de incendio en ${incendio.nombreCiudad}?`)) {
      this.eliminarIncendio(incendio);
    }
  }

  eliminarIncendio(incendio: IncendioUsuario): void {
    this.cargando = true;
    this.incendioService.eliminarIncendioDeUsuario(this.idUsuario, incendio.idIncendio)
      .subscribe({
        next: (response: ResponseReporte) => {
          this.cargando = false;
          if (response.type === 'success') {
            this.cargarIncendiosUsuario();
            // Mostrar mensaje de éxito
          } else {
            this.error = response.listMessage?.join(', ') || 'Error al eliminar el incendio';
          }
        },
        error: (error) => {
          this.cargando = false;
          this.error = 'Error al eliminar el incendio';
          console.error('Error:', error);
        }
      });
  }

  eliminarArchivo(idArchivo: string): void {
    if (confirm('¿Está seguro de que desea eliminar este archivo?')) {
      this.incendioService.eliminarArchivoDeIncendio(this.idUsuario, idArchivo)
        .subscribe({
          next: (response: ResponseReporte) => {
            if (response.type === 'success') {
              // Recargar el detalle del incendio
              if (this.incendioSeleccionado) {
                this.verDetalle(this.incendioSeleccionado);
              }
            } else {
              this.error = response.listMessage?.join(', ') || 'Error al eliminar el archivo';
            }
          },
          error: (error) => {
            this.error = 'Error al eliminar el archivo';
            console.error('Error:', error);
          }
        });
    }
  }

  // Métodos de navegación
  volverALista(): void {
    this.modoVista = 'lista';
    this.incendioSeleccionado = null;
    this.editandoIncendio = null;
    this.error = '';
  }

  cancelarEdicion(): void {
    this.modoVista = 'lista';
    this.editandoIncendio = null;
    this.editForm.reset();
    this.error = '';
  }

  // Métodos de paginación
  irAPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas) {
      this.paginaActual = pagina;
      this.cargarIncendiosUsuario();
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 0) {
      this.paginaActual--;
      this.cargarIncendiosUsuario();
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas - 1) {
      this.paginaActual++;
      this.cargarIncendiosUsuario();
    }
  }

  // Métodos de utilidad
  puedeEditar(incendio: IncendioUsuario): boolean {
    return incendio.estado === 'REPORTADO';
  }

  puedeEliminar(incendio: IncendioUsuario): boolean {
    return incendio.estado === 'REPORTADO';
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'REPORTADO': return 'badge-reportado';
      case 'EN_CURSO': return 'badge-proceso';
      case 'CONTROLADO': return 'badge-controlado';
      case 'EXTINGUIDO': return 'badge-extinguido';
      default: return 'badge-default';
    }
  }

  obtenerClaseUrgencia(urgencia: string): string {
    switch (urgencia) {
      case 'BAJA': return 'badge-urgencia-baja';
      case 'MEDIA': return 'badge-urgencia-media';
      case 'ALTA': return 'badge-urgencia-alta';
      case 'CRITICA': return 'badge-urgencia-critica';
      default: return 'badge-default';
    }
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
