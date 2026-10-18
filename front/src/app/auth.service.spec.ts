import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL, AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('AuthService', () => {
  const baseUrl = 'https://api.example.test';
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: baseUrl }],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('inicia sem acessar a API quando não existe sessão', () => {
    let usuario = 'pendente';
    service.iniciarSessao().subscribe(resultado => usuario = resultado ? resultado.nome : 'anonima');
    expect(usuario).toBe('anonima');
    expect(service.carregando()).toBe(false);
    http.expectNone(() => true);
  });

  it('cadastra, autentica e carrega o perfil da nova conta', () => {
    const dados = { nome: 'Ana', email: 'ana@example.test', senha: 'SenhaForte123!' };
    let nome = '';
    service.cadastrar(dados).subscribe(usuario => nome = usuario.nome);

    const cadastro = http.expectOne(`${baseUrl}/api/auth/register`);
    expect(cadastro.request.body).toEqual(dados);
    cadastro.flush(null, { status: 201, statusText: 'Created' });

    const login = http.expectOne(`${baseUrl}/api/identity/login?useCookies=false`);
    expect(login.request.body).toEqual({ email: dados.email, password: dados.senha });
    login.flush({ tokenType: 'Bearer', accessToken: 'token-acesso', expiresIn: 3600, refreshToken: 'refresh' });

    const perfil = http.expectOne(`${baseUrl}/api/auth/me`);
    expect(perfil.request.headers.get('Authorization')).toBe('Bearer token-acesso');
    perfil.flush({ id: 'u1', nome: 'Ana', email: dados.email });

    expect(nome).toBe('Ana');
    expect(service.usuario()?.id).toBe('u1');
    expect(sessionStorage.getItem('tarefas.access-token')).toBe('token-acesso');
  });

  it('limpa a sessão e não autentica quando o login falha', () => {
    sessionStorage.setItem('tarefas.access-token', 'token-antigo');
    service.entrar({ email: 'ana@example.test', senha: 'senha-errada' }).subscribe({ error: () => undefined });
    http.expectOne(`${baseUrl}/api/identity/login?useCookies=false`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(sessionStorage.getItem('tarefas.access-token')).toBeNull();
    expect(service.usuario()).toBeNull();
  });
});
