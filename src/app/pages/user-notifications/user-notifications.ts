import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificacionService, DtoNotificacion, ResponseNotificacion } from '../../core/service/notificacion/notificacion.service';
import { TokenService } from '../../core/service/oauth/token.service';
import { UserService } from '../../core/service/user/user.service';
import { HeaderClient } from '../../shared/header-client/header-client';

@Component({
  selector: 'app-user-notifications',
  imports: [CommonModule, FormsModule, HeaderClient],
  templateUrl: './user-notifications.html',
  styleUrl: './user-notifications.css'
})
export class UserNotifications implements OnInit {

  // Exponer Math para usar en el template
  Math = Math;

  // Estado del usuario
  userInfo: any = null;
  isLoggedIn: boolean = false;

  // Estados de la aplicación
  cargando: boolean = false;
  error: string = '';

  // Datos de notificaciones
  notificaciones: DtoNotificacion[] = [];
  notificacionesNoLeidas: number = 0;
  cargandoNotificaciones: boolean = false;

  // Filtros
  filtroTipo: string = '';
  filtroLeidas: string = 'todas'; // 'todas', 'leidas', 'no_leidas'

  // Paginación
  paginaActual: number = 0;
  tamanoPagina: number = 10;
  totalElementos: number = 0;
  totalPaginas: number = 0;

  constructor(
    private notificacionService: NotificacionService,
    private tokenService: TokenService,
    private userService: UserService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUser();
    }
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
            console.log("Usuario cargado:", this.userInfo.nombre);

            // Cargar notificaciones después de cargar el usuario
            this.cargarNotificaciones();
            this.actualizarContadorNotificaciones();
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

  // ========== GESTIÓN DE NOTIFICACIONES ==========

  /**
   * Carga las notificaciones del usuario con filtros
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
            let notificaciones = response.data || [];

            // Aplicar filtros localmente
            notificaciones = this.aplicarFiltros(notificaciones);

            // Simular paginación local
            this.totalElementos = notificaciones.length;
            this.totalPaginas = Math.ceil(this.totalElementos / this.tamanoPagina);

            const inicio = this.paginaActual * this.tamanoPagina;
            const fin = inicio + this.tamanoPagina;
            this.notificaciones = notificaciones.slice(inicio, fin);

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
   * Aplica filtros a las notificaciones
   */
  aplicarFiltros(notificaciones: DtoNotificacion[]): DtoNotificacion[] {
    let filtradas = [...notificaciones];

    // Filtrar por tipo
    if (this.filtroTipo && this.filtroTipo !== '') {
      filtradas = filtradas.filter(n => n.tipoNotificacion === this.filtroTipo);
    }

    // Filtrar por estado de lectura
    if (this.filtroLeidas === 'leidas') {
      filtradas = filtradas.filter(n => n.leida);
    } else if (this.filtroLeidas === 'no_leidas') {
      filtradas = filtradas.filter(n => !n.leida);
    }

    // Ordenar por fecha de creación (más recientes primero)
    filtradas.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

    return filtradas;
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
            // Recargar notificaciones para reflejar los cambios
            this.cargarNotificaciones();
            this.actualizarContadorNotificaciones();
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

  // ========== FILTROS Y PAGINACIÓN ==========

  /**
   * Aplica los filtros seleccionados
   */
  aplicarFiltroSeleccionado(): void {
    this.paginaActual = 0;
    this.cargarNotificaciones();
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroTipo = '';
    this.filtroLeidas = 'todas';
    this.paginaActual = 0;
    this.cargarNotificaciones();
  }

  /**
   * Cambia de página
   */
  irAPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas) {
      this.paginaActual = pagina;
      this.cargarNotificaciones();
    }
  }

  /**
   * Página anterior
   */
  paginaAnterior(): void {
    if (this.paginaActual > 0) {
      this.paginaActual--;
      this.cargarNotificaciones();
    }
  }

  /**
   * Página siguiente
   */
  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas - 1) {
      this.paginaActual++;
      this.cargarNotificaciones();
    }
  }

  // ========== MÉTODOS DE UTILIDAD ==========

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
   * Función trackBy para optimizar el renderizado de la lista de notificaciones
   */
  trackByNotificacion(index: number, notificacion: DtoNotificacion): string {
    return notificacion.idNotificacion;
  }

  /**
   * Navega al detalle del incendio si existe
   */
  verIncendioRelacionado(idIncendio: string): void {
    if (idIncendio) {
      // Navegar al detalle del incendio
      this.router.navigate(['/incendio', idIncendio]);
    }
  }
}
