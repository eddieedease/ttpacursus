import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Invoice, InvoiceStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly http = inject(HttpClient);

  list(): Promise<Invoice[]> {
    return firstValueFrom(this.http.get<Invoice[]>('/api/invoices.php'));
  }

  create(input: { eventId: number; organisationId: number; unitPrice: number; notes?: string }): Promise<{ id: number; invoiceNumber: string }> {
    return firstValueFrom(this.http.post<{ id: number; invoiceNumber: string }>('/api/invoices.php', input));
  }

  setStatus(id: number, status: InvoiceStatus): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/invoices.php', { id, status }));
  }

  delete(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete('/api/invoices.php', { params: { id } }));
  }
}
