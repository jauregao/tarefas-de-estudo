import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Tarefa {
  id: number;
  titulo: string;
  concluida: boolean;
}

// Configuração local explícita para acompanhar a requisição na aula de nuvem.
// Configuração por ambiente será trabalhada na aula de build/publicação.
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root', factory: () => 'http://localhost:5027/api/tarefas',
});

@Injectable({ providedIn: 'root' })
export class TarefasService {
  private readonly http = inject(HttpClient);
  private readonly url = inject(API_URL);

  listar() { return this.http.get<Tarefa[]>(this.url); }
  criar(titulo: string) { return this.http.post<Tarefa>(this.url, { titulo }); }
  concluir(id: number) { return this.http.patch<Tarefa>(`${this.url}/${id}/concluir`, {}); }
}
