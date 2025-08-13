import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private apiUser =environment.apiUser;
  constructor(private httpClient: HttpClient) { }

  public login(email: string, contrasenha: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const body = new URLSearchParams();
    body.set('email', email);
    body.set('contrasenha', contrasenha);

    return this.httpClient.post(`${this.apiUser}/login`, body.toString(), { headers });
  }

}
