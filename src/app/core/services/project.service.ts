import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, ProjectStatus } from '../../interfaces/project.interface';
import { Client, ClientType } from '../../shared/types/network.types';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${environment.apiUrl}/projects`);
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${environment.apiUrl}/projects/${id}`);
  }

  createProject(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${environment.apiUrl}/projects`, project);
  }

  updateProject(id: number, project: Partial<Project>): Observable<Project> {
    return this.http.patch<Project>(`${environment.apiUrl}/projects/${id}`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/projects/${id}`);
  }

  getClients(type?: ClientType): Observable<Client[]> {
    const params = type ? new HttpParams().set('type', type) : new HttpParams();
    return this.http.get<Client[]>(`${environment.apiUrl}/clients`, { params });
  }

  getClientById(clientId: string): Observable<Client> {
    return this.http.get<Client>(`${environment.apiUrl}/clients/${clientId}`);
  }

  createClient(client: Omit<Client, 'id'>): Observable<Client> {
    return this.http.post<Client>(`${environment.apiUrl}/clients`, client);
  }

  updateClient(clientId: string, updates: Partial<Client>): Observable<Client> {
    return this.http.patch<Client>(`${environment.apiUrl}/clients/${clientId}`, updates);
  }

  deleteClient(clientId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/clients/${clientId}`);
  }

  assignClientToProject(projectId: string, clientId: string): Observable<Project> {
    return this.http.post<Project>(`${environment.apiUrl}/projects/${projectId}/clients/${clientId}`, {});
  }

  removeClientFromProject(projectId: string, clientId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/projects/${projectId}/clients/${clientId}`);
  }

  getProjectClients(projectId: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${environment.apiUrl}/projects/${projectId}/clients`);
  }

  getClientProjects(clientId: string): Observable<Project[]> {
    return this.http.get<Project[]>(`${environment.apiUrl}/clients/${clientId}/projects`);
  }
} 