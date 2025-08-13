import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RolService {

  private apiRol = environment.apiRol;
  constructor(private httpClient: HttpClient) { }

  getRolByUserId(idUsuario: string): Observable<any> {
    const url = `${this.apiRol}/user/${idUsuario}`;
    return this.httpClient.get<any>(url);
  }

}
