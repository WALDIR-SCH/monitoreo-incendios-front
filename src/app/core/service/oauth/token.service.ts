
import { isPlatformBrowser } from '@angular/common';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const TOKEN_KEY = 'AuthToken';
@Injectable({
  providedIn: 'root'
})
export class TokenService  {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.loggedInSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.initLoggedInState();
  }

  private initLoggedInState() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(TOKEN_KEY);
      this.loggedInSubject.next(!!token);
    }
  }

  public getToken(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(TOKEN_KEY) || '';
    }
    return '';
  }

  public setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(TOKEN_KEY, token);
      this.loggedInSubject.next(true);
    }
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  public decodeToken(): any {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return null;
    }
  }

  public getUserId(): string | null {
    const decodedToken = this.decodeToken();
    return decodedToken?.idUsuario || null;
  }

  public logOut(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.clear();
      this.loggedInSubject.next(false);
    }
  }
}
