import { Component, inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HeaderClient } from '../../shared/header-client/header-client';
import { IncendioService, ReporteIncendio } from '../../core/service/incendio/incendio.service';
import { TokenService } from '../../core/service/oauth/token.service';
import { UserService } from '../../core/service/user/user.service';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  population?: number;
  region?: string;
}

@Component({
  selector: 'app-new-report',
  imports: [HeaderClient, CommonModule, ReactiveFormsModule,FormsModule],
  templateUrl: './new-report.html',
  styleUrl: './new-report.css'
})
export class NewReport implements OnDestroy {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private incendioService = inject(IncendioService);
  private tokenService = inject(TokenService);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Form
  reportForm!: FormGroup;

  // Modal and search
  isModalOpen = false;
  searchTerm = '';
  cities: City[] = [];
  nearbyCities: City[] = [];
  isLoading = false;
  isLoadingNearby = false;
  searchSubject = new Subject<string>();

  // Location
  isGettingLocation = false;
  locationError = '';
  selectedLocation = {
    isAutomatic: true,
    latitude: 34.1000,
    longitude: 14.005,
    cityName: '',
    country: '',
    region: '',
    population: 0
  };

  // File upload
  selectedFiles: File[] = [];
  filePreviewUrls: string[] = [];
  isDragOver = false;
  isSubmitting = false;

  // Feedback
  showSuccess = false;
  showError = false;
  errorMessage = '';

  constructor() {
    this.initializeForm();
    this.setupSearch();
    this.getCurrentLocation();
  }

  private initializeForm() {
    this.reportForm = this.fb.group({
      tipoVegetacion: ['', [Validators.required]],
      fuenteIncendio: ['', [Validators.required]],
      areaAfectada: ['', [Validators.required, Validators.min(0.1)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) {
          return of([]);
        }
        this.isLoading = true;
        return this.searchCities(term);
      })
    ).subscribe({
      next: (cities) => {
        this.cities = cities;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error searching cities:', error);
        this.cities = [];
        this.isLoading = false;
      }
    });

    // Cargar ciudades cercanas al inicializar
    this.loadNearbyCities();
  }

  private searchCities(term: string) {
    const apiKey = environment.ninjasApiKey;
    const url = `https://api.api-ninjas.com/v1/city?name=${encodeURIComponent(term)}`;

    return this.http.get<City[]>(url, {
      headers: {
        'X-Api-Key': apiKey
      }
    }).pipe(
      catchError(error => {
        console.error('API Error:', error);
        return of([]);
      })
    );
  }

  // Cargar ciudades cercanas a la ubicación actual
  private loadNearbyCities() {
    if (!this.selectedLocation.latitude || !this.selectedLocation.longitude) {
      return;
    }

    this.isLoadingNearby = true;
    const apiKey = environment.ninjasApiKey;
    const lat = this.selectedLocation.latitude;
    const lng = this.selectedLocation.longitude;
    const radius = 1.0; // Radio de 1 grado (~111 km aproximadamente)

    const url = `https://api.api-ninjas.com/v1/city?min_lat=${lat - radius}&max_lat=${lat + radius}&min_lon=${lng - radius}&max_lon=${lng + radius}`;

    this.http.get<City[]>(url, {
      headers: {
        'X-Api-Key': apiKey
      }
    }).pipe(
      catchError(error => {
        console.error('Error loading nearby cities:', error);
        return of([]);
      })
    ).subscribe(cities => {
      if (cities && cities.length > 0) {
        // Calcular distancias y ordenar por proximidad
        const citiesWithDistance = cities.map(city => ({
          ...city,
          distance: this.calculateDistance(lat, lng, city.latitude, city.longitude)
        }));

        // Ordenar por distancia y tomar las 8 más cercanas
        this.nearbyCities = citiesWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 8)
          .map(({ distance, ...city }) => city); // Remover la propiedad distance
      }
      this.isLoadingNearby = false;
    });
  }

  // Calcular distancia entre dos puntos geográficos (fórmula de Haversine simplificada)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get city information by coordinates
  private getCityInfoByCoordinates(lat: number, lng: number) {
    const apiKey = environment.ninjasApiKey;
    const tolerance = 0.1; // Tolerance for coordinate search
    const url = `https://api.api-ninjas.com/v1/city?min_lat=${lat - tolerance}&max_lat=${lat + tolerance}&min_lon=${lng - tolerance}&max_lon=${lng + tolerance}`;

    this.http.get<City[]>(url, {
      headers: {
        'X-Api-Key': apiKey
      }
    }).pipe(
      catchError(error => {
        console.error('API Error getting city by coordinates:', error);
        return of([]);
      })
    ).subscribe(cities => {
      if (cities && cities.length > 0) {
        // Find the closest city
        const closestCity = cities.reduce((prev, curr) => {
          const prevDistance = Math.sqrt(Math.pow(prev.latitude - lat, 2) + Math.pow(prev.longitude - lng, 2));
          const currDistance = Math.sqrt(Math.pow(curr.latitude - lat, 2) + Math.pow(curr.longitude - lng, 2));
          return currDistance < prevDistance ? curr : prev;
        });

        this.updateLocationInfo(closestCity);
      }
    });
  }

  // Get city information by name
  private getCityInfoByName(cityName: string) {
    const apiKey = environment.ninjasApiKey;
    const url = `https://api.api-ninjas.com/v1/city?name=${encodeURIComponent(cityName)}`;

    this.http.get<City[]>(url, {
      headers: {
        'X-Api-Key': apiKey
      }
    }).pipe(
      catchError(error => {
        console.error('API Error getting city by name:', error);
        return of([]);
      })
    ).subscribe(cities => {
      if (cities && cities.length > 0) {
        this.updateLocationInfo(cities[0]);
      }
    });
  }

  // Update location information with complete city data
  private updateLocationInfo(city: City) {
    this.selectedLocation.cityName = city.name;
    this.selectedLocation.country = city.country;
    this.selectedLocation.region = city.region || '';
    this.selectedLocation.population = city.population || 0;

    console.log('Ciudad actualizada con información completa:', this.selectedLocation);
  }

  openModal() {
    this.isModalOpen = true;
    this.searchTerm = '';
    this.cities = [];

    // Cargar ciudades cercanas si no las tenemos
    if (this.nearbyCities.length === 0 && !this.isLoadingNearby) {
      this.loadNearbyCities();
    }

    // Focus the input after the modal is rendered
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
  }

  closeModal() {
    this.isModalOpen = false;
    this.searchTerm = '';
    this.cities = [];
  }

  onSearchInput() {
    this.searchSubject.next(this.searchTerm);
  }

  selectCity(city: City) {
    this.selectedLocation = {
      isAutomatic: false,
      latitude: city.latitude,
      longitude: city.longitude,
      cityName: city.name,
      country: city.country,
      region: '',
      population: 0
    };
    this.closeModal();

    // Get complete city information
    this.getCityInfoByName(city.name);
  }

  // Handle keyboard events
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  // Geolocation methods
  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.locationError = 'La geolocalización no está soportada por este navegador';
      return;
    }

    this.isGettingLocation = true;
    this.locationError = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.selectedLocation = {
          isAutomatic: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          cityName: '',
          country: '',
          region: '',
          population: 0
        };
        this.isGettingLocation = false;
        console.log('Ubicación obtenida:', this.selectedLocation);

        // Get city information by coordinates
        this.getCityInfoByCoordinates(position.coords.latitude, position.coords.longitude);

        // Recargar ciudades cercanas con la nueva ubicación
        this.loadNearbyCities();
      },
      (error) => {
        this.isGettingLocation = false;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError = 'Permisos de ubicación denegados';
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            this.locationError = 'Tiempo de espera agotado al obtener la ubicación';
            break;
          default:
            this.locationError = 'Error desconocido al obtener la ubicación';
            break;
        }
        console.error('Error de geolocalización:', this.locationError);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  }

  // Get map URL based on current location
  getMapUrl(): SafeResourceUrl {
    let url: string;

    if (this.selectedLocation.cityName) {
      // If we have a city name, use it for the map
      const query = encodeURIComponent(`${this.selectedLocation.cityName}, ${this.selectedLocation.country}`);
      url = `https://maps.google.com/maps?q=${query}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    } else {
      // Use coordinates
      const lat = this.selectedLocation.latitude;
      const lng = this.selectedLocation.longitude;
      url = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Retry getting location
  retryLocation() {
    this.getCurrentLocation();
  }

  // File upload methods
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.addFiles(files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files);
      this.addFiles(files);
    }
  }

  private addFiles(files: File[]) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'image/jpg','image/webp'];
    const maxSize = 1 * 1024 * 1024; // Reducido a 1MB por archivo
    const maxTotalSize = 3 * 1024 * 1024; // 3MB total máximo

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        this.showErrorMessage(`El archivo ${file.name} no es un tipo válido. Solo se permiten imágenes (JPEG, JPG, PNG, GIF, WEBP) y videos (MP4, WebM).`);
        continue;
      }

      if (file.size > maxSize) {
        this.showErrorMessage(`El archivo ${file.name} es demasiado grande. El tamaño máximo es 1MB por archivo.`);
        continue;
      }

      if (this.selectedFiles.length >= 3) {
        this.showErrorMessage('Solo se pueden subir máximo 3 archivos.');
        break;
      }

      // Verificar tamaño total
      const currentTotalSize = this.selectedFiles.reduce((total, f) => total + f.size, 0);
      if (currentTotalSize + file.size > maxTotalSize) {
        this.showErrorMessage('El tamaño total de archivos no puede exceder 15MB.');
        break;
      }

      // Check if file already exists
      if (!this.selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        this.selectedFiles.push(file);
        // Create preview URL for images
        if (file.type.startsWith('image/')) {
          this.filePreviewUrls.push(URL.createObjectURL(file));
        } else {
          this.filePreviewUrls.push('');
        }
      }
    }
  }

  removeFile(index: number) {
    // Revoke the object URL to free memory
    if (this.filePreviewUrls[index]) {
      URL.revokeObjectURL(this.filePreviewUrls[index]);
    }
    this.selectedFiles.splice(index, 1);
    this.filePreviewUrls.splice(index, 1);
  }

  getFilePreview(index: number): string {
    return this.filePreviewUrls[index] || '';
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }

  // Form submission
  async onSubmit() {
    if (this.reportForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    // Check if user is logged in using TokenService
    if (!this.tokenService.isLoggedIn()) {
      this.showErrorMessage('Debes estar logueado para enviar un reporte.');
      this.router.navigate(['/login']);
      return;
    }

    const userId = this.tokenService.getUserId();
    if (!userId) {
      this.showErrorMessage('Error al obtener información del usuario.');
      return;
    }

    this.isSubmitting = true;
    this.hideMessages();

    try {
      const formData = this.reportForm.value;

      const reportData: ReporteIncendio = {
        idUsuario: userId,
        tipoVegetacion: formData.tipoVegetacion,
        fuenteIncendio: formData.fuenteIncendio,
        areaAfectada: parseFloat(formData.areaAfectada),
        descripcion: formData.descripcion,
        nombreCiudad: this.selectedLocation.cityName || `GPS: ${this.selectedLocation.latitude.toFixed(4)}, ${this.selectedLocation.longitude.toFixed(4)}`,
        latitud: this.selectedLocation.latitude,
        longitud: this.selectedLocation.longitude,
        pais: this.selectedLocation.country || 'Unknown',
        region: this.selectedLocation.region || undefined,
        poblacion: this.selectedLocation.population > 0 ? this.selectedLocation.population : undefined,
        archivos: this.selectedFiles.length > 0 ? this.selectedFiles : undefined
      };

      console.log('Enviando datos del reporte:', reportData);
      console.log('Archivos a subir:', this.selectedFiles);

      // Create the report using the correct method name
      const response = await this.incendioService.reportarIncendio(reportData).toPromise();

      if (response?.type === 'success') {
        this.showSuccessMessage('¡Reporte enviado exitosamente! Las autoridades han sido notificadas.');
        this.resetForm();

        // Redirect after success
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      } else {
        throw new Error(response?.listMessage?.join(', ') || 'Error desconocido');
      }

    } catch (error: any) {
      console.error('Error al enviar reporte:', error);

      // Verificar si es un error de red pero el registro se creó exitosamente
      if (error?.status === 0 && error?.statusText === 'Unknown Error') {
        console.log('Posible error de red después de creación exitosa');

        // Esperar un momento y mostrar mensaje de éxito condicional
        this.showSuccessMessage('El reporte se está procesando. Si los archivos son grandes, puede tomar algunos minutos completar la subida.');

        setTimeout(() => {
          this.resetForm();
          this.router.navigate(['/']);
        }, 4000);

      } else if (error?.status === 201) {
        // Status 201 significa que se creó exitosamente
        this.showSuccessMessage('¡Reporte enviado exitosamente! Las autoridades han sido notificadas.');
        this.resetForm();

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);

      } else {
        // Error real
        this.showErrorMessage(
          error?.error?.listMessage?.join(', ') ||
          error?.message ||
          'Error al enviar el reporte. Por favor, inténtalo nuevamente.'
        );
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.reportForm.controls).forEach(key => {
      this.reportForm.get(key)?.markAsTouched();
    });
  }

  private resetForm() {
    this.reportForm.reset();

    // Clean up file preview URLs
    this.filePreviewUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    this.selectedFiles = [];
    this.filePreviewUrls = [];

    this.getCurrentLocation(); // Reset to current location
  }

  // Helper methods for validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.reportForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.reportForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        switch (fieldName) {
          case 'tipoVegetacion': return 'Debe seleccionar un tipo de vegetación.';
          case 'fuenteIncendio': return 'Debe seleccionar una fuente de incendio.';
          case 'areaAfectada': return 'El área afectada es requerida.';
          case 'descripcion': return 'La descripción es requerida.';
          default: return `El campo ${fieldName} es requerido.`;
        }
      }
      if (field.errors['minlength']) return `El campo ${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres.`;
      if (field.errors['maxlength']) return `El campo ${fieldName} debe tener máximo ${field.errors['maxlength'].requiredLength} caracteres.`;
      if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}.`;
    }
    return '';
  }

  // Message helpers
  private showSuccessMessage(message: string) {
    this.showSuccess = true;
    this.showError = false;
  }

  private showErrorMessage(message: string) {
    this.errorMessage = message;
    this.showError = true;
    this.showSuccess = false;
  }

  private hideMessages() {
    this.showSuccess = false;
    this.showError = false;
    this.errorMessage = '';
  }

  closeSuccess() {
    this.showSuccess = false;
  }

  closeError() {
    this.showError = false;
    this.errorMessage = '';
  }

  ngOnDestroy() {
    this.filePreviewUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
  }
}
