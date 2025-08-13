import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IncendioService, ResponseReporte, ActualizarEstadoIncendio } from '../../core/service/incendio/incendio.service';
import { TokenService } from '../../core/service/oauth/token.service';
import { UserService } from '../../core/service/user/user.service';
import { NotificacionService, DtoNotificacion, ResponseNotificacion, CrearAlertaGeneral } from '../../core/service/notificacion/notificacion.service';

interface IncendioAdmin {
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
  archivosSubidos?: DtoArchivoIncendio[];
  comentarios?: DtoComentarioIncendio[];
}

interface DtoArchivoIncendio {
  idArchivo: string;
  nombreArchivo: string;
  tipoArchivo: string;
  tamanoArchivo: number;
  urlArchivo: string;
  fechaSubida: Date;
}

interface DtoComentarioIncendio {
  idComentario: string;
  comentario: string;
  fechaComentario: Date;
  nombreUsuario?: string;
  accionTomada?: string;
}

interface EstadisticasIncendios {
  totalIncendios: number;
  incendiosActivos: number;
  incendiosRecientes: number;
  incendiosControlados: number;
  incendiosExtinguidos: number;
  areaTotalAfectada: number;
}

@Component({
  selector: 'app-home-admin',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './home-admin.html',
  styleUrl: './home-admin.css'
})
export class HomeAdmin implements OnInit, OnDestroy {

  // Estado del usuario
  userInfo: any = null;
  isLoggedIn: boolean = false;
  showPopover: boolean = false;
  @ViewChild('popoverMenu') popoverMenu!: ElementRef;

  // Estados de la aplicación
  vistaActual: 'dashboard' | 'mapa' | 'incendios' | 'reportes' | 'historial' | 'estadisticas' | 'notificaciones' = 'dashboard';
  cargando: boolean = false;
  error: string = '';
  fechaActual: Date = new Date();

  // Datos de notificaciones
  notificaciones: DtoNotificacion[] = [];
  notificacionesNoLeidas: number = 0;
  mostrarPanelNotificaciones: boolean = false;
  cargandoNotificaciones: boolean = false;

  // Datos de incendios
  incendios: IncendioAdmin[] = [];
  incendioSeleccionado: IncendioAdmin | null = null;
  estadisticas: EstadisticasIncendios = {
    totalIncendios: 0,
    incendiosActivos: 0,
    incendiosRecientes: 0,
    incendiosControlados: 0,
    incendiosExtinguidos: 0,
    areaTotalAfectada: 0
  };

  // Propiedades del mapa
  mapa: any = null; // Instancia de Leaflet (any para SSR)
  marcadores: any[] = [];
  grupoMarcadores: any = null;
  L: any = null; // Referencia a Leaflet cargada dinámicamente

  // Filtros del mapa
  filtrosMapa = {
    estados: {
      reportado: true,
      enCurso: true,
      controlado: true,
      extinguido: false
    },
    prioridades: {
      alta: true,      // Incluye ALTA y CRITICA
      media: true,     // Incluye MEDIA
      baja: true       // Incluye BAJA
    },
    fechaInicio: '',
    fechaFin: ''
  };

  // Filtros y formularios
  filtroForm: FormGroup;
  actualizacionForm: FormGroup;
  alertaGeneralForm: FormGroup;

  // Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 12;
  totalElementos: number = 0;
  totalPaginas: number = 0;

  // Opciones para filtros
  estadosDisponibles = ['REPORTADO', 'EN_CURSO', 'CONTROLADO', 'EXTINGUIDO'];
  nivelesUrgencia = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

  // Navegación del sidebar
  menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: 'dashboard', active: true },
    { id: 'mapa' as const, label: 'Mapa de Incendios', icon: 'map', active: false },
    { id: 'incendios' as const, label: 'Gestión de Incendios', icon: 'fire', active: false },
    { id: 'reportes' as const, label: 'Reportes Recientes', icon: 'report', active: false },
    { id: 'historial' as const, label: 'Historial Extinguidos', icon: 'history', active: false },
    { id: 'estadisticas' as const, label: 'Estadísticas', icon: 'chart', active: false },
    { id: 'notificaciones' as const, label: 'Notificaciones', icon: 'notifications', active: false }
  ];

  // Estados de modales
  mostrarModalActualizacion: boolean = false;
  mostrarModalExportacion: boolean = false;
  mostrarModalArchivo: boolean = false;
  mostrarModalAlertaGeneral: boolean = false;
  procesandoActualizacion: boolean = false;
  procesandoAlerta: boolean = false;
  archivoSeleccionado: any = null;

  constructor(
    private incendioService: IncendioService,
    private tokenService: TokenService,
    private userService: UserService,
    private notificacionService: NotificacionService,
    private router: Router,
    private fb: FormBuilder,@Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.filtroForm = this.fb.group({
      estado: [''],
      fechaInicio: [''],
      fechaFin: [''],
      pais: [''],
      region: [''],
      nombreCiudad: [''],
      nivelUrgencia: [''],
      areaMinima: [''],
      areaMaxima: ['']
    });

    this.actualizacionForm = this.fb.group({
      idIncendio: ['', Validators.required],
      idUsuarioAdmin: [''],
      nuevoEstado: ['', Validators.required],
      comentario: [''],
      accionTomada: ['']
    });

    this.alertaGeneralForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      mensaje: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

ngOnInit(): void {
  if (isPlatformBrowser(this.platformId)) {
    this.loadUser();
    this.cargarDashboard();
    setInterval(() => {
      this.fechaActual = new Date();
    }, 60000);

    // Listener para cerrar panel de notificaciones al hacer clic fuera
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const notificationPanel = document.querySelector('.notification-panel');
      const notificationButton = document.querySelector('.notification-button');

      if (this.mostrarPanelNotificaciones &&
          notificationPanel &&
          !notificationPanel.contains(target) &&
          notificationButton &&
          !notificationButton.contains(target)) {
        this.mostrarPanelNotificaciones = false;
      }
    });
  }
}

ngOnDestroy(): void {
  this.limpiarMapa();
}

/**
 * Limpia el mapa y libera los recursos
 */
limpiarMapa(): void {
  if (this.mapa && isPlatformBrowser(this.platformId)) {
    try {
      this.mapa.remove();
      console.log('Mapa limpiado correctamente');
    } catch (error) {
      console.log('Error al limpiar el mapa:', error);
    }
  }
  this.mapa = null;
  this.grupoMarcadores = null;
  this.marcadores = [];
}
  // ========== GESTIÓN DE USUARIO ==========
  loadUser(): void {
    const userId = this.tokenService.getUserId();
    if (userId) {
      this.userService.getUserByUserId(userId).subscribe(
        (response) => {
          if (response.type === 'success') {
            this.userInfo = response.data;
            this.isLoggedIn = true;
            console.log("Usuario administrador cargado:", this.userInfo.nombre);

            // Cargar notificaciones después de cargar el usuario
            this.cargarNotificaciones();
            this.iniciarIntervaloNotificaciones();
          } else {
            console.error('Error al obtener el perfil:', response.listMessage);
            this.router.navigate(['/login']);
          }
        },
        (error) => {
          console.error('Error en la solicitud del perfil:', error);
          this.router.navigate(['/login']);
        }
      );
    } else {
      this.router.navigate(['/login']);
    }
  }

  togglePopover(): void {
    this.showPopover = !this.showPopover;
  }

  logOut(): void {
    this.tokenService.logOut();
    this.isLoggedIn = false;
    this.userInfo = null;
    this.router.navigate(['/']);
  }

  // ========== NAVEGACIÓN DEL SIDEBAR ==========
  cambiarVista(vista: 'dashboard' | 'mapa' | 'incendios' | 'reportes' | 'historial' | 'estadisticas' | 'notificaciones'): void {
    const vistaAnterior = this.vistaActual;
    this.vistaActual = vista;
    this.error = '';

    // Limpiar el mapa si cambiamos desde la vista de mapa a otra vista
    if (vistaAnterior === 'mapa' && vista !== 'mapa') {
      this.limpiarMapa();
    }

    // Actualizar estado activo del menú
    this.menuItems.forEach(item => {
      item.active = item.id === vista;
    });

    // Si cambiamos a la vista de mapa, inicializarlo
    if (vista === 'mapa') {
      setTimeout(() => {
        this.inicializarMapa();
      }, 100);
    }

    // Cargar datos según la vista
    switch (vista) {
      case 'dashboard':
        this.cargarDashboard();
        break;
      case 'mapa':
        // El mapa se inicializa en el setTimeout de arriba
        this.cargarIncendios(); // Cargar datos para el mapa
        break;
      case 'incendios':
        this.cargarIncendios();
        break;
      case 'reportes':
        this.cargarReportesRecientes();
        break;
      case 'historial':
        this.cargarHistorialExtinguidos();
        break;
      case 'estadisticas':
        this.cargarEstadisticas();
        break;
      case 'notificaciones':
        this.cargarNotificaciones();
        break;
    }
  }

  // ========== CARGA DE DATOS ==========
  cargarDashboard(): void {
    this.cargando = true;
    Promise.all([
      this.incendioService.obtenerIncendiosRecientes().toPromise(),
      this.incendioService.obtenerIncendiosActivos().toPromise(),
      this.incendioService.obtenerIncendios({ page: 0, size: 5 }).toPromise()
    ]).then(([recientes, activos, todos]) => {
      this.cargando = false;

      // Calcular estadísticas básicas
      if (recientes?.type === 'success') {
        this.estadisticas.incendiosRecientes = recientes.data?.length || 0;
      }

      if (activos?.type === 'success') {
        this.estadisticas.incendiosActivos = activos.data?.length || 0;
      }

      if (todos?.type === 'success') {
        const data = todos.data;
        this.estadisticas.totalIncendios = data?.totalElements || 0;
        this.incendios = data?.content?.slice(0, 5) || [];
        // Calcular área total afectada usando los incendios obtenidos
        this.estadisticas.areaTotalAfectada = (data?.content || []).reduce(
          (total: number, i: IncendioAdmin) => total + (i.areaAfectada || 0), 0
        );
      }
    }).catch(error => {
      this.cargando = false;
      this.error = 'Error al cargar el dashboard';
      console.error('Error:', error);
    });
  }

  cargarIncendios(): void {
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

    this.incendioService.obtenerIncendios(filtros)
      .subscribe({
        next: (response: ResponseReporte) => {
          this.cargando = false;
          if (response.type === 'success' && response.data) {
            this.incendios = response.data.content || [];
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

  cargarReportesRecientes(): void {
    this.cargando = true;
    this.incendioService.obtenerIncendiosRecientes()
      .subscribe({
        next: (response: ResponseReporte) => {
          this.cargando = false;
          if (response.type === 'success') {
            this.incendios = response.data || [];
          } else {
            this.error = response.listMessage?.join(', ') || 'Error al cargar reportes recientes';
          }
        },
        error: (error) => {
          this.cargando = false;
          this.error = 'Error al cargar reportes recientes';
          console.error('Error:', error);
        }
      });
  }

  cargarHistorialExtinguidos(): void {
    this.cargando = true;
    const filtros = {
      estado: 'EXTINGUIDO',
      page: this.paginaActual,
      size: this.tamanoPagina,
      sortBy: 'fechaActualizacion',
      sortDirection: 'DESC'
    };

    this.incendioService.obtenerIncendios(filtros)
      .subscribe({
        next: (response: ResponseReporte) => {
          this.cargando = false;
          if (response.type === 'success' && response.data) {
            this.incendios = response.data.content || [];
            this.totalElementos = response.data.totalElements || 0;
            this.totalPaginas = response.data.totalPages || 0;
          } else {
            this.error = response.listMessage?.join(', ') || 'Error al cargar el historial';
          }
        },
        error: (error) => {
          this.cargando = false;
          this.error = 'Error al cargar el historial de incendios extinguidos';
          console.error('Error:', error);
        }
      });
  }

  cargarEstadisticas(): void {
    this.cargando = true;

    // Cargar todos los incendios para calcular estadísticas
    this.incendioService.obtenerIncendios({ size: 10000 })
      .subscribe({
        next: (response: ResponseReporte) => {
          this.cargando = false;
          if (response.type === 'success' && response.data) {
            const incendios = response.data.content || [];
            this.calcularEstadisticas(incendios);
          } else {
            this.error = 'Error al cargar estadísticas';
          }
        },
        error: (error) => {
          this.cargando = false;
          this.error = 'Error al cargar estadísticas';
          console.error('Error:', error);
        }
      });
  }

  calcularEstadisticas(incendios: IncendioAdmin[]): void {
    this.estadisticas = {
      totalIncendios: incendios.length,
      incendiosActivos: incendios.filter(i => ['REPORTADO', 'EN_CURSO'].includes(i.estado)).length,
      incendiosRecientes: incendios.filter(i => {
        const hace24h = new Date();
        hace24h.setHours(hace24h.getHours() - 24);
        return new Date(i.fechaReporte) > hace24h;
      }).length,
      incendiosControlados: incendios.filter(i => i.estado === 'CONTROLADO').length,
      incendiosExtinguidos: incendios.filter(i => i.estado === 'EXTINGUIDO').length,
      areaTotalAfectada: incendios.reduce((total, i) => total + (i.areaAfectada || 0), 0)
    };
  }

  // ========== GESTIÓN DE INCENDIOS ==========
  verDetalleIncendio(incendio: IncendioAdmin): void {
    this.cargando = true;
    this.incendioService.obtenerIncendioDetalle(incendio.idIncendio)
      .subscribe({
        next: (response: ResponseReporte) => {
          this.cargando = false;
          if (response.type === 'success') {
            this.incendioSeleccionado = response.data;

            // Si estamos en la vista de mapa, asegurar que el mapa permanezca funcional
            if (this.vistaActual === 'mapa' && isPlatformBrowser(this.platformId)) {
              setTimeout(() => {
                if (this.mapa) {
                  this.mapa.invalidateSize();
                }
              }, 200);
            }
          } else {
            this.error = 'Error al cargar el detalle del incendio';
          }
        },
        error: (error) => {
          this.cargando = false;
          this.error = 'Error al cargar el detalle del incendio';
          console.error('Error:', error);
        }
      });
  }

  actualizarEstadoIncendio(): void {
    if (!this.actualizacionForm.valid || !this.userInfo?.idUsuario) {
      this.error = 'Por favor complete todos los campos requeridos';
      return;
    }

    this.procesandoActualizacion = true;
    this.error = '';

    const datosActualizacion: ActualizarEstadoIncendio = {
      idIncendio: this.actualizacionForm.get('idIncendio')?.value,
      idUsuarioAdmin: this.userInfo.idUsuario,
      nuevoEstado: this.actualizacionForm.get('nuevoEstado')?.value,
      comentario: this.actualizacionForm.get('comentario')?.value,
      accionTomada: this.actualizacionForm.get('accionTomada')?.value
    };

    this.incendioService.actualizarEstadoIncendio(datosActualizacion)
      .subscribe({
        next: (response: ResponseReporte) => {
          this.procesandoActualizacion = false;
          if (response.type === 'success') {
            // Actualizar el incendio en la lista local si existe
            const index = this.incendios.findIndex(i => i.idIncendio === datosActualizacion.idIncendio);
            if (index !== -1 && response.data) {
              this.incendios[index] = response.data;
            }

            // Actualizar el incendio seleccionado si es el mismo
            if (this.incendioSeleccionado?.idIncendio === datosActualizacion.idIncendio) {
              this.incendioSeleccionado = response.data;
            }

            // Cerrar modal y mostrar mensaje de éxito
            this.cerrarModalActualizacion();
            console.log('Estado del incendio actualizado exitosamente');

            // Recargar datos según la vista actual
            switch (this.vistaActual) {
              case 'dashboard':
                this.cargarDashboard();
                break;
              case 'incendios':
                this.cargarIncendios();
                break;
              case 'historial':
                this.cargarHistorialExtinguidos();
                break;
            }
          } else {
            this.error = response.listMessage?.join(', ') || 'Error al actualizar el estado';
          }
        },
        error: (error) => {
          this.procesandoActualizacion = false;
          this.error = 'Error al actualizar el estado del incendio';
          console.error('Error:', error);
        }
      });
  }

  // ========== GESTIÓN DE MODALES ==========
  abrirModalActualizacion(incendio: IncendioAdmin): void {
    this.actualizacionForm.patchValue({
      idIncendio: incendio.idIncendio,
      nuevoEstado: incendio.estado,
      comentario: '',
      accionTomada: ''
    });
    this.mostrarModalActualizacion = true;
    this.error = '';
  }

  cerrarModalActualizacion(): void {
    this.mostrarModalActualizacion = false;
    this.actualizacionForm.reset();
    this.error = '';
    this.procesandoActualizacion = false;
  }

  abrirModalExportacion(): void {
    this.mostrarModalExportacion = true;
  }

  cerrarModalExportacion(): void {
    this.mostrarModalExportacion = false;
  }

  // ========== FUNCIONES DE EXPORTACIÓN ==========
  exportarDatos(formato: 'json' | 'csv' | 'excel'): void {
    this.cargando = true;
    const filtros = this.filtroForm.value;

    // Limpiar filtros vacíos
    Object.keys(filtros).forEach(key => {
      if (filtros[key] === '' || filtros[key] === null || filtros[key] === undefined) {
        delete filtros[key];
      }
    });

    switch (formato) {
      case 'json':
        this.incendioService.exportarJSON(filtros).subscribe({
          next: (data) => {
            this.descargarArchivo(data, 'incendios.json', 'application/json');
            this.cargando = false;
            this.cerrarModalExportacion();
          },
          error: (error) => {
            this.cargando = false;
            this.error = 'Error al exportar datos en formato JSON';
            console.error('Error:', error);
          }
        });
        break;

      case 'csv':
        this.incendioService.exportarCSV(filtros).subscribe({
          next: (data) => {
            this.descargarArchivo(data, 'incendios.csv', 'text/csv');
            this.cargando = false;
            this.cerrarModalExportacion();
          },
          error: (error) => {
            this.cargando = false;
            this.error = 'Error al exportar datos en formato CSV';
            console.error('Error:', error);
          }
        });
        break;

      case 'excel':
        this.incendioService.exportarExcel(filtros).subscribe({
          next: (blob) => {
            this.descargarBlob(blob, 'incendios.xlsx');
            this.cargando = false;
            this.cerrarModalExportacion();
          },
          error: (error) => {
            this.cargando = false;
            this.error = 'Error al exportar datos en formato Excel';
            console.error('Error:', error);
          }
        });
        break;
    }
  }

  private descargarArchivo(data: string, filename: string, type: string): void {
    const blob = new Blob([data], { type });
    this.descargarBlob(blob, filename);
  }

  private descargarBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // ========== FILTROS Y PAGINACIÓN ==========
  aplicarFiltros(): void {
    this.paginaActual = 0;
    this.cargarIncendios();
  }

  limpiarFiltros(): void {
    this.filtroForm.reset();
    this.paginaActual = 0;
    this.cargarIncendios();
  }

  irAPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas) {
      this.paginaActual = pagina;
      this.cargarIncendios();
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 0) {
      this.paginaActual--;
      this.cargarIncendios();
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas - 1) {
      this.paginaActual++;
      this.cargarIncendios();
    }
  }

  // ========== MÉTODOS DE UTILIDAD ==========
  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'REPORTADO': return 'bg-blue-100 text-blue-800';
      case 'EN_CURSO': return 'bg-yellow-100 text-yellow-800';
      case 'CONTROLADO': return 'bg-green-100 text-green-800';
      case 'EXTINGUIDO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  obtenerClaseUrgencia(urgencia: string): string {
    switch (urgencia) {
      case 'BAJA': return 'bg-green-100 text-green-800';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800';
      case 'ALTA': return 'bg-orange-100 text-orange-800';
      case 'CRITICA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  calcularDuracion(fechaInicio: Date, fechaFin?: Date): string {
    if (!fechaFin) return 'En curso';

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const duracionMs = fin.getTime() - inicio.getTime();

    const dias = Math.floor(duracionMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((duracionMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) {
      return `${dias}d ${horas}h`;
    } else {
      return `${horas}h`;
    }
  }

  get Math() {
    return Math;
  }

  // ========== GESTIÓN DE ARCHIVOS ==========
  esImagen(tipoArchivo: string): boolean {
  return tipoArchivo.toUpperCase() === 'IMAGEN';
  }

  esVideo(tipoArchivo: string): boolean {
   return tipoArchivo.toUpperCase() === 'VIDEO';
  }

  formatearTamanoArchivo(tamanoBytes: number): string {
    if (!tamanoBytes) return '0 B';

    const unidades = ['B', 'KB', 'MB', 'GB'];
    let tamano = tamanoBytes;
    let unidadIndex = 0;

    while (tamano >= 1024 && unidadIndex < unidades.length - 1) {
      tamano /= 1024;
      unidadIndex++;
    }

    return `${tamano.toFixed(1)} ${unidades[unidadIndex]}`;
  }

  obtenerThumbnailVideo(archivo: any): string {
    // Para videos, podríamos usar una imagen por defecto o generar un thumbnail
    // Por ahora retornamos una imagen por defecto
    return 'assets/img/video-thumbnail-default.svg';
  }

  abrirArchivoEnModal(archivo: any): void {
    this.archivoSeleccionado = archivo;
    this.mostrarModalArchivo = true;
  }

  cerrarModalArchivo(): void {
    this.mostrarModalArchivo = false;
    this.archivoSeleccionado = null;
  }

  descargarArchivoIndividual(archivo: any): void {
    // Crear un enlace temporal para descargar el archivo
    const link = document.createElement('a');
    link.href = archivo.urlArchivo;
    link.download = archivo.nombreArchivo;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onImageError(event: any): void {
    // Si la imagen no se puede cargar, mostrar una imagen por defecto
    event.target.src = 'assets/img/imagen-no-disponible.svg';
  }

  cerrarDetalle(): void {
    this.incendioSeleccionado = null;

    // Si estamos en la vista de mapa, necesitamos reinicializar el mapa
    // para asegurar que se muestre correctamente después de cerrar el modal
    if (this.vistaActual === 'mapa' && isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        if (this.mapa) {
          this.mapa.invalidateSize();
          console.log('Mapa redimensionado después de cerrar modal');
        } else {
          this.inicializarMapa();
        }
      }, 100);
    }
  }

  // ========== GESTIÓN DE NOTIFICACIONES ==========

  /**
   * Carga las notificaciones del usuario administrador
   */
  cargarNotificaciones(): void {
    if (!this.userInfo?.idUsuario) return;

    this.cargandoNotificaciones = true;
    this.error = '';

    this.notificacionService.obtenerNotificacionesUsuario(this.userInfo.idUsuario)
      .subscribe({
        next: (response: ResponseNotificacion) => {
          this.cargandoNotificaciones = false;
          if (response.type === 'success') {
            this.notificaciones = response.data || [];
            this.actualizarContadorNotificaciones();
          } else {
            this.error = 'Error al cargar las notificaciones';
          }
        },
        error: (error) => {
          this.cargandoNotificaciones = false;
          this.error = 'Error al cargar las notificaciones';
          console.error('Error:', error);
        }
      });
  }

  /**
   * Actualiza el contador de notificaciones no leídas
   */
  actualizarContadorNotificaciones(): void {
    if (!this.userInfo?.idUsuario) return;

    this.notificacionService.contarNotificacionesNoLeidas(this.userInfo.idUsuario)
      .subscribe({
        next: (response: ResponseNotificacion) => {
          if (response.type === 'success') {
            this.notificacionesNoLeidas = response.data || 0;
          }
        },
        error: (error) => {
          console.error('Error al contar notificaciones:', error);
        }
      });
  }

  /**
   * Inicia el intervalo para actualizar notificaciones automáticamente
   */
  iniciarIntervaloNotificaciones(): void {
    // Actualizar notificaciones cada 30 segundos
    setInterval(() => {
      if (this.userInfo?.idUsuario) {
        this.actualizarContadorNotificaciones();
        // Solo recargar todas las notificaciones si estamos en la vista de notificaciones
        if (this.vistaActual === 'notificaciones') {
          this.cargarNotificaciones();
        }
      }
    }, 30000);
  }

  /**
   * Marca una notificación como leída
   */
  marcarNotificacionComoLeida(notificacion: DtoNotificacion): void {
    if (!this.userInfo?.idUsuario || notificacion.leida) return;

    this.notificacionService.marcarComoLeida(notificacion.idNotificacion, this.userInfo.idUsuario)
      .subscribe({
        next: (response: ResponseNotificacion) => {
          if (response.type === 'success') {
            // Actualizar la notificación localmente
            notificacion.leida = true;
            notificacion.fechaLectura = new Date();
            this.actualizarContadorNotificaciones();
          }
        },
        error: (error) => {
          console.error('Error al marcar notificación como leída:', error);
        }
      });
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  marcarTodasNotificacionesComoLeidas(): void {
    if (!this.userInfo?.idUsuario) return;

    this.cargandoNotificaciones = true;

    this.notificacionService.marcarTodasComoLeidas(this.userInfo.idUsuario)
      .subscribe({
        next: (response: ResponseNotificacion) => {
          this.cargandoNotificaciones = false;
          if (response.type === 'success') {
            // Actualizar todas las notificaciones localmente
            this.notificaciones.forEach(notif => {
              if (!notif.leida) {
                notif.leida = true;
                notif.fechaLectura = new Date();
              }
            });
            this.notificacionesNoLeidas = 0;
            console.log('Todas las notificaciones marcadas como leídas');
          } else {
            this.error = 'Error al marcar las notificaciones como leídas';
          }
        },
        error: (error) => {
          this.cargandoNotificaciones = false;
          this.error = 'Error al marcar las notificaciones como leídas';
          console.error('Error:', error);
        }
      });
  }

  /**
   * Alterna la visibilidad del panel de notificaciones
   */
  togglePanelNotificaciones(): void {
    this.mostrarPanelNotificaciones = !this.mostrarPanelNotificaciones;
    if (this.mostrarPanelNotificaciones && this.notificaciones.length === 0) {
      this.cargarNotificaciones();
    }
  }

  /**
   * Abre el modal para crear una alerta general
   */
  abrirModalAlertaGeneral(): void {
    this.alertaGeneralForm.reset();
    this.mostrarModalAlertaGeneral = true;
    this.error = '';
  }

  /**
   * Cierra el modal de alerta general
   */
  cerrarModalAlertaGeneral(): void {
    this.mostrarModalAlertaGeneral = false;
    this.alertaGeneralForm.reset();
    this.error = '';
    this.procesandoAlerta = false;
  }

  /**
   * Crea una alerta general para todos los usuarios
   */
  crearAlertaGeneral(): void {
    if (!this.alertaGeneralForm.valid) {
      this.error = 'Por favor complete todos los campos correctamente';
      return;
    }

    this.procesandoAlerta = true;
    this.error = '';

    const alertaData: CrearAlertaGeneral = {
      titulo: this.alertaGeneralForm.get('titulo')?.value,
      mensaje: this.alertaGeneralForm.get('mensaje')?.value
    };

    this.notificacionService.crearAlertaGeneral(alertaData)
      .subscribe({
        next: (response: ResponseNotificacion) => {
          this.procesandoAlerta = false;
          if (response.type === 'success') {
            this.cerrarModalAlertaGeneral();
            console.log('Alerta general creada exitosamente');
            // Mostrar mensaje de éxito
            this.error = '';
          } else {
            this.error = response.listMessage?.join(', ') || 'Error al crear la alerta general';
          }
        },
        error: (error) => {
          this.procesandoAlerta = false;
          this.error = 'Error al crear la alerta general';
          console.error('Error:', error);
        }
      });
  }

  /**
   * Obtiene la clase CSS según el tipo de notificación
   */
  obtenerClaseNotificacion(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'NUEVO_REPORTE': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CAMBIO_ESTADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ALERTA_GENERAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'SISTEMA': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Obtiene el icono según el tipo de notificación
   */
  obtenerIconoNotificacion(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'NUEVO_REPORTE': return 'fire';
      case 'CAMBIO_ESTADO': return 'refresh';
      case 'ALERTA_GENERAL': return 'warning';
      case 'SISTEMA': return 'info';
      default: return 'bell';
    }
  }

  /**
   * Obtiene la clase CSS según la prioridad de la notificación
   * Como no hay campo prioridad en la BD, usamos el tipo para determinar la importancia
   */
  obtenerClasePrioridad(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'ALERTA_GENERAL': return 'border-l-4 border-red-500'; // Alta prioridad
      case 'NUEVO_REPORTE': return 'border-l-4 border-orange-500'; // Media prioridad
      case 'CAMBIO_ESTADO': return 'border-l-4 border-blue-500'; // Media prioridad
      case 'SISTEMA': return 'border-l-4 border-gray-500'; // Baja prioridad
      default: return 'border-l-4 border-gray-500';
    }
  }

  /**
   * Obtiene la etiqueta legible del tipo de notificación
   */
  getTipoNotificacionLabel(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'NUEVO_REPORTE': return 'Nuevo Reporte';
      case 'CAMBIO_ESTADO': return 'Cambio de Estado';
      case 'ALERTA_GENERAL': return 'Alerta General';
      case 'SISTEMA': return 'Sistema';
      default: return 'General';
    }
  }

  /**
   * Obtiene la "prioridad" basada en el tipo (para mostrar en la UI)
   */
  obtenerPrioridadPorTipo(tipo: string): string {
    switch (tipo.toUpperCase()) {
      case 'ALERTA_GENERAL': return 'ALTA';
      case 'NUEVO_REPORTE': return 'MEDIA';
      case 'CAMBIO_ESTADO': return 'MEDIA';
      case 'SISTEMA': return 'BAJA';
      default: return 'BAJA';
    }
  }

  /**
   * Función trackBy para optimizar el renderizado de la lista de notificaciones
   */
  trackByNotificacion(index: number, notificacion: DtoNotificacion): string {
    return notificacion.idNotificacion;
  }

  // ============================================
  // MÉTODOS DEL MAPA
  // ============================================

  /**
   * Inicializa el mapa cuando se cambia a la vista de mapa
   */
  inicializarMapa(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('SSR detectado, evitando inicialización del mapa');
      return;
    }

    if (this.vistaActual === 'mapa') {
      // Verificar si el contenedor del mapa existe
      const contenedorMapa = document.getElementById('mapa-incendios');

      // Si el contenedor no existe o está vacío, necesitamos recrear el mapa
      if (!contenedorMapa || contenedorMapa.innerHTML === '' || !this.mapa) {
        // Limpiar referencias previas del mapa si existen
        if (this.mapa) {
          try {
            this.mapa.remove();
            this.mapa = null;
            this.grupoMarcadores = null;
            this.marcadores = [];
            console.log('Mapa anterior limpiado');
          } catch (error) {
            console.log('Error al limpiar mapa anterior:', error);
          }
        }

        setTimeout(async () => {
          await this.cargarLeaflet();
          this.crearMapa();
          this.cargarIncendiosEnMapa();
        }, 100);
      } else {
        // Si el mapa ya existe y el contenedor está presente, verificar si es funcional
        try {
          if (this.mapa) {
            this.mapa.invalidateSize();
            this.actualizarMarcadores();
          }
        } catch (error) {
          console.log('Error al redimensionar mapa, recreando:', error);
          // Si hay error, recrear el mapa
          this.mapa = null;
          this.inicializarMapa();
        }
      }
    }
  }  /**
   * Carga Leaflet dinámicamente solo en el navegador
   */
  private async cargarLeaflet(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      this.L = await import('leaflet');
      console.log('Leaflet cargado dinámicamente');
    } catch (error) {
      console.error('Error al cargar Leaflet:', error);
      this.error = 'Error al cargar el mapa';
    }
  }

  /**
   * Crea la instancia del mapa usando Leaflet
   */
  crearMapa(): void {
    if (!isPlatformBrowser(this.platformId) || !this.L) {
      console.log('No se puede crear el mapa: SSR o Leaflet no cargado');
      return;
    }

    // Verificar si el contenedor del mapa existe
    const contenedorMapa = document.getElementById('mapa-incendios');
    if (!contenedorMapa) {
      console.error('Contenedor del mapa no encontrado');
      setTimeout(() => this.crearMapa(), 200); // Reintentar en 200ms
      return;
    }

    // Limpiar el contenedor completamente
    contenedorMapa.innerHTML = '';

    // Asegurar que el contenedor tenga dimensiones
    if (contenedorMapa.offsetHeight === 0) {
      contenedorMapa.style.height = '600px';
    }

    try {
      // Coordenadas centrales de Perú (Lima)
      const centroLatitud = -12.0464;
      const centroLongitud = -77.0428;

      // Crear el mapa con Leaflet
      this.mapa = this.L.map('mapa-incendios').setView([centroLatitud, centroLongitud], 6);

      // Agregar tile layer (OpenStreetMap)
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 3
      }).addTo(this.mapa);

      // Crear grupo de marcadores
      this.grupoMarcadores = this.L.layerGroup().addTo(this.mapa);

      // Configurar iconos personalizados para Leaflet
      this.configurarIconosLeaflet();

      // Setup funciones globales
      this.setupGlobalFunctions();

      // Forzar redimensionamiento del mapa
      setTimeout(() => {
        if (this.mapa) {
          this.mapa.invalidateSize();
        }
      }, 100);

      console.log('Mapa inicializado con Leaflet exitosamente');
    } catch (error) {
      console.error('Error al crear el mapa:', error);
      this.error = 'Error al inicializar el mapa';
    }
  }

  /**
   * Configura los iconos personalizados para Leaflet
   */
  configurarIconosLeaflet(): void {
    if (!this.L) return;

    // Fix para iconos por defecto de Leaflet
    delete (this.L.Icon.Default.prototype as any)._getIconUrl;
    this.L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }

  /**
   * Función global para seleccionar incendio desde popup
   */
  private setupGlobalFunctions(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    (window as any).seleccionarIncendioDesdePopup = (idIncendio: string) => {
      const incendio = this.incendios.find(i => i.idIncendio === idIncendio);
      if (incendio) {
        // Llamar al método completo que carga los detalles desde el servidor
        this.verDetalleIncendio(incendio);
      }
    };
  }

  /**
   * Crea un icono personalizado según el estado y prioridad
   */
  crearIconoPersonalizado(estado: string, nivelUrgencia: string): any {
    if (!this.L) return null;

    const colorEstado = this.obtenerColorEstado(estado);
    const size = this.obtenerTamanoSegunUrgencia(nivelUrgencia);

    // SVG personalizado para el marcador
    const svgIcon = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${colorEstado}" stroke="#ffffff" stroke-width="2"/>
        <path d="M12 6v6l4 2" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;

    return this.L.divIcon({
      html: svgIcon,
      className: 'custom-fire-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2]
    });
  }

  /**
   * Obtiene el tamaño del marcador según el nivel de urgencia
   */
  obtenerTamanoSegunUrgencia(nivelUrgencia: string): number {
    switch (nivelUrgencia?.toUpperCase()) {
      case 'CRITICA': return 32;
      case 'ALTA': return 28;
      case 'MEDIA': return 24;
      case 'BAJA': return 20;
      default: return 24;
    }
  }  /**
   * Carga los incendios como marcadores en el mapa
   */
  cargarIncendiosEnMapa(): void {
    if (!this.mapa || !this.grupoMarcadores || !this.L) return;

    // Limpiar marcadores existentes
    this.grupoMarcadores.clearLayers();
    this.marcadores = [];

    // Filtrar incendios según los filtros del mapa
    const incendiosFiltrados = this.filtrarIncendiosParaMapa();

    // Crear marcadores para cada incendio filtrado
    incendiosFiltrados.forEach(incendio => {
      if (incendio.latitud && incendio.longitud) {
        const marcador = this.crearMarcador(incendio);
        if (marcador) {
          this.marcadores.push(marcador);
          this.grupoMarcadores!.addLayer(marcador);
        }
      }
    });

    // Ajustar la vista del mapa si hay marcadores
    if (this.marcadores.length > 0) {
      const grupo = new this.L.FeatureGroup(this.marcadores);
      this.mapa.fitBounds(grupo.getBounds().pad(0.1));
    }

    console.log(`Cargados ${this.marcadores.length} marcadores en el mapa`);
  }

  /**
   * Crea un marcador para un incendio específico
   */
  crearMarcador(incendio: IncendioAdmin): any {
    if (!this.L) return null;

    const icono = this.crearIconoPersonalizado(incendio.estado, incendio.nivelUrgencia);
    if (!icono) return null;

    const marcador = this.L.marker([incendio.latitud, incendio.longitud], {
      icon: icono
    });

    // Agregar datos personalizados al marcador
    (marcador as any).incendioData = incendio;

    // Crear popup con información del incendio
    const popupContent = `
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">Incendio en ${incendio.nombreCiudad}</h4>
        <p style="margin: 5px 0;"><strong>Estado:</strong>
          <span style="
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 11px;
            background: ${this.obtenerColorEstado(incendio.estado)}30;
            color: ${this.obtenerColorEstado(incendio.estado)};
          ">${incendio.estado}</span>
        </p>
        <p style="margin: 5px 0;"><strong>Urgencia:</strong>
          <span style="
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 11px;
            background: ${this.obtenerColorPrioridad(incendio.nivelUrgencia)}30;
            color: ${this.obtenerColorPrioridad(incendio.nivelUrgencia)};
          ">${incendio.nivelUrgencia}</span>
        </p>
        <p style="margin: 5px 0;"><strong>Área:</strong> ${incendio.areaAfectada} hectáreas</p>
        <p style="margin: 5px 0;"><strong>Fecha:</strong> ${this.formatearFecha(incendio.fechaReporte)}</p>
        ${incendio.descripcion ? `<p style="margin: 5px 0;"><strong>Descripción:</strong> ${incendio.descripcion.substring(0, 100)}...</p>` : ''}
        <div style="margin-top: 10px; text-align: center;">
          <button onclick="window.seleccionarIncendioDesdePopup('${incendio.idIncendio}')"
                  style="
                    background: #ff6b35;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                  ">
            Ver Detalles
          </button>
        </div>
      </div>
    `;

    // Configurar popup con opciones personalizadas
    marcador.bindPopup(popupContent, {
      closeButton: true,
      autoClose: true,
      closeOnClick: false
    });

    // Event listeners para mostrar popup en hover
    marcador.on('mouseover', () => {
      marcador.openPopup();
    });

    marcador.on('mouseout', () => {
      // Cerrar popup después de un pequeño delay para permitir interacción
      setTimeout(() => {
        marcador.closePopup();
      }, 1000);
    });

    // Event listener para seleccionar el incendio al hacer click
    marcador.on('click', () => {
      this.incendioSeleccionado = incendio;
    });

    // Mantener el popup abierto cuando se hace hover sobre él
    marcador.on('popupopen', () => {
      const popup = marcador.getPopup();
      const popupElement = popup?.getElement();

      if (popupElement) {
        // Cancelar el cierre cuando se hace hover sobre el popup
        popupElement.addEventListener('mouseenter', () => {
          clearTimeout((marcador as any).closeTimer);
        });

        // Programar el cierre cuando se sale del popup
        popupElement.addEventListener('mouseleave', () => {
          (marcador as any).closeTimer = setTimeout(() => {
            marcador.closePopup();
          }, 1000);
        });
      }
    });

    return marcador;
  }

  /**
   * Filtra incendios según los criterios del mapa
   */
  filtrarIncendiosParaMapa(): IncendioAdmin[] {
    return this.incendios.filter(incendio => {
      // Filtro por estado
      const estadoFiltro = this.filtrosMapa.estados;
      let estadoValido = false;

      switch (incendio.estado) {
        case 'REPORTADO':
          estadoValido = estadoFiltro.reportado;
          break;
        case 'EN_CURSO':
          estadoValido = estadoFiltro.enCurso;
          break;
        case 'CONTROLADO':
          estadoValido = estadoFiltro.controlado;
          break;
        case 'EXTINGUIDO':
          estadoValido = estadoFiltro.extinguido;
          break;
      }

      if (!estadoValido) return false;

      // Filtro por prioridad (si existe) - usar nivelUrgencia
      if (incendio.nivelUrgencia) {
        const prioridadFiltro = this.filtrosMapa.prioridades;
        let prioridadValida = false;

        switch (incendio.nivelUrgencia.toUpperCase()) {
          case 'ALTA':
          case 'CRITICA':
            prioridadValida = prioridadFiltro.alta;
            break;
          case 'MEDIA':
            prioridadValida = prioridadFiltro.media;
            break;
          case 'BAJA':
            prioridadValida = prioridadFiltro.baja;
            break;
        }

        if (!prioridadValida) return false;
      }

      // Filtro por fecha
      if (this.filtrosMapa.fechaInicio) {
        const fechaInicio = new Date(this.filtrosMapa.fechaInicio);
        const fechaIncendio = new Date(incendio.fechaReporte);
        if (fechaIncendio < fechaInicio) return false;
      }

      if (this.filtrosMapa.fechaFin) {
        const fechaFin = new Date(this.filtrosMapa.fechaFin);
        fechaFin.setHours(23, 59, 59, 999); // Incluir todo el día
        const fechaIncendio = new Date(incendio.fechaReporte);
        if (fechaIncendio > fechaFin) return false;
      }

      return true;
    });
  }

  /**
   * Actualiza la visualización del mapa aplicando los filtros actuales
   */
  actualizarVisualizacionMapa(): void {
    if (!this.mapa) return;

    // Simplemente recargar los marcadores con los filtros actuales
    this.cargarIncendiosEnMapa();

    console.log(`Mapa actualizado con ${this.marcadores.length} marcadores`);
  }

  /**
   * Obtiene el color según el estado del incendio
   */
  obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'REPORTADO': return '#ff9800'; // Naranja
      case 'EN_CURSO': return '#f44336'; // Rojo
      case 'CONTROLADO': return '#2196f3'; // Azul
      case 'EXTINGUIDO': return '#4caf50'; // Verde
      default: return '#757575'; // Gris
    }
  }

  obtenerColorPrioridad(prioridad: string): string {
    switch (prioridad.toUpperCase()) {
      case 'CRITICA': return '#b71c1c'; // Rojo muy oscuro
      case 'ALTA': return '#d32f2f'; // Rojo oscuro
      case 'MEDIA': return '#f57c00'; // Naranja oscuro
      case 'BAJA': return '#388e3c'; // Verde oscuro
      default: return '#616161'; // Gris oscuro
    }
  }

  aplicarFiltrosMapa(): void {
    if (isPlatformBrowser(this.platformId) && this.mapa && this.L) {
      this.cargarIncendiosEnMapa();
    }
  }

  limpiarFiltrosMapa(): void {
    // Resetear filtros de estado
    this.filtrosMapa.estados = {
      reportado: true,
      enCurso: true,
      controlado: true,
      extinguido: false
    };

    // Resetear filtros de nivel de urgencia (prioridad)
    this.filtrosMapa.prioridades = {
      alta: true,      // Incluye ALTA y CRITICA
      media: true,
      baja: true
    };

    // Resetear filtros de fecha
    this.filtrosMapa.fechaInicio = '';
    this.filtrosMapa.fechaFin = '';

    // Aplicar filtros actualizados
    this.aplicarFiltrosMapa();
  }
  centrarMapa(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.mapa && this.marcadores.length > 0 && this.L) {
      // Crear un grupo con todos los marcadores
      const grupo = new this.L.FeatureGroup(this.marcadores);
      // Ajustar la vista para mostrar todos los marcadores
      this.mapa.fitBounds(grupo.getBounds().pad(0.1));
      console.log('Mapa centrado en todos los marcadores');
    } else if (this.mapa) {
      // Si no hay marcadores, centrar en Perú
      this.mapa.setView([-12.0464, -77.0428], 6);
      console.log('Mapa centrado en coordenadas por defecto');
    }
  }

  /**
   * Actualiza los marcadores del mapa recargando los incendios
   */
  actualizarMarcadores(): void {
    if (isPlatformBrowser(this.platformId) && this.mapa && this.L) {
      this.cargarIncendiosEnMapa();
      console.log('Marcadores del mapa actualizados');
    }
  }

  cerrarInfoPanel(): void {
    this.incendioSeleccionado = null;
  }

}
