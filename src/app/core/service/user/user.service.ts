import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUser = environment.apiUser;

  constructor(
    private httpClient: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  getUserByUserId(userId: string): Observable<any> {
    return this.httpClient.get(`${this.apiUser}/get/${userId}`);
  }
}
