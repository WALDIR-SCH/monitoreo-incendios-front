import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GoogleAuthService } from '../../core/service/oauth/google-auth.service';
import { LoginService } from '../../core/service/oauth/login.service';
import { TokenService } from '../../core/service/oauth/token.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginData: any = {
    email: '',
    contrasenha: ''
  };
  alert: { type: string; message: string } | null = null;
  isLoggingIn: boolean = false;
  showPassword: boolean = false;

  constructor(
    private loginService: LoginService,
    private tokenService: TokenService,
    private googleAuthService: GoogleAuthService,
    private router: Router, @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const { idToken, accessToken } = this.googleAuthService.handleGoogleCallback();
      if (idToken && accessToken) {
        this.loginWithGoogle(idToken, accessToken);
      }
    }
  }

  showAlert(type: string, message: string): void {
    this.alert = { type, message };
    setTimeout(() => {
      this.alert = null;
    }, 5000);
  }
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    if (!this.loginData.email || !this.loginData.contrasenha) {
      this.showAlert('error', 'Todos los campos son obligatorios.');
      return;
    }
    this.isLoggingIn = true;

    this.loginService.login(this.loginData.email, this.loginData.contrasenha).subscribe(
      (response) => {
        if (response.type === 'success') {
          const jwtToken = response.data.jwtToken;
          const nombreRol = response.data.nombreRol;
          this.tokenService.setToken(jwtToken);
          this.showAlert('success', response.listMessage[0]);

          // Redireccionamos según el rol
          if (nombreRol === 'ADMINISTRADOR') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.showAlert('error', 'Credenciales incorrectas.');
          this.isLoggingIn = false;
        }

      },
      (error) => {
        console.error('Error al iniciar sesión:', error);
        this.showAlert('error', 'Error al iniciar sesión. Inténtalo de nuevo.');
        this.isLoggingIn = false;

      }
    );
  }

  loginWithGoogle(idToken: string, accessToken: string): void {
    this.googleAuthService.registerWithGoogle(idToken, accessToken).subscribe(
      (response) => {
        if (response.type === 'success') {
          const jwtToken = response.data.jwtToken;
          this.tokenService.setToken(jwtToken);
          this.showAlert('success', response.listMessage[0]);
          this.router.navigate(['/']);
        } else {
          this.showAlert('error', response.listMessage[0]);
        }
      },
      (error) => {
        console.error('Error al iniciar sesión con Google:', error);
        this.showAlert('error', 'Error al iniciar sesión con Google.');
      }
    );
  }

  initiateGoogleLogin(): void {
    this.googleAuthService.loginAndRegisterWithGoogleOauth();
  }
}
