import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Attachment } from '../../../shared/types/network.types';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {
  private apiUrl = `${environment.apiUrl}/attachments`;

  constructor(private http: HttpClient) {}

  getAttachments(entityType: string, entityId: string): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${this.apiUrl}`, {
      params: { entityType, entityId }
    });
  }

  uploadAttachment(
    file: File,
    entityType: string,
    entityId: string,
    description: string
  ): Observable<HttpEvent<Attachment>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('description', description);

    const request = new HttpRequest('POST', this.apiUrl, formData, {
      reportProgress: true
    });

    return this.http.request<Attachment>(request);
  }

  deleteAttachment(attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${attachmentId}`);
  }

  downloadAttachment(attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${attachmentId}/download`, {
      responseType: 'blob'
    });
  }

  updateAttachment(
    attachmentId: string,
    updates: Pick<Attachment, 'description'>
  ): Observable<Attachment> {
    return this.http.patch<Attachment>(`${this.apiUrl}/${attachmentId}`, updates);
  }
} 