import { Injectable, signal } from '@angular/core';

const ACCESS_TOKEN_KEY = 'tarefas.access-token';

@Injectable({ providedIn: 'root' })
export class AuthSessionStore {
  readonly accessToken = signal<string | null>(this.lerToken());

  salvarToken(token: string) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    this.accessToken.set(token);
  }

  limpar() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    this.accessToken.set(null);
  }

  private lerToken() {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }
}
