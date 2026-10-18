import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { App } from './app';
import { AuthService } from './auth.service';

const url = 'http://localhost:5027/api/tarefas';
const usuario = { id: 'usuario-1', nome: 'Amanda', email: 'amanda@example.test' };
describe('Quadro de tarefas', () => {
  let fixture: ComponentFixture<App>;
  let http: HttpTestingController;
  const authFalso = {
    usuario: signal(usuario),
    carregando: signal(false),
    iniciarSessao: () => of(usuario),
    cadastrar: vi.fn(), entrar: vi.fn(), sair: vi.fn(),
  };

  beforeEach(async () => {
    authFalso.usuario.set(usuario);
    authFalso.carregando.set(false);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: AuthService, useValue: authFalso },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  function listar(tarefas: unknown[] = []) {
    http.expectOne(url).flush(tarefas);
    fixture.detectChanges();
  }
  function preencher(titulo: string) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#titulo');
    input.value = titulo;
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('.painel form').dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  }

  it('mostra lista vazia depois da consulta', () => {
    listar();
    expect(fixture.nativeElement.textContent).toContain('Nenhuma tarefa cadastrada.');
  });
  it('não envia título só com espaços e identifica o erro no campo', () => {
    listar();
    preencher('   ');
    http.expectNone(req => req.method === 'POST');
    expect(fixture.nativeElement.querySelector('#titulo').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Informe o título da tarefa.');
  });
  it('envia cadastro à API e mostra a tarefa retornada', () => {
    listar();
    preencher('  Estudar nuvem  ');
    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ titulo: 'Estudar nuvem' });
    request.flush({ id: 1, titulo: 'Estudar nuvem', concluida: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('li').textContent).toContain('Estudar nuvem');
    expect(fixture.nativeElement.querySelector('#titulo').value).toBe('');
    expect(fixture.nativeElement.textContent).not.toContain('Nenhuma tarefa cadastrada.');
  });
  it('conclui pela API e atualiza o estado exibido', () => {
    listar([{ id: 1, titulo: 'Estudar', concluida: false }]);
    fixture.nativeElement.querySelector('li button').click();
    const request = http.expectOne(`${url}/1/concluir`);
    expect(request.request.method).toBe('PATCH');
    request.flush({ id: 1, titulo: 'Estudar', concluida: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('li').textContent).toContain('Concluída');
    expect(fixture.nativeElement.querySelector('li button[aria-label="Reabrir tarefa: Estudar"]').textContent).toContain('Reabrir');
    fixture.nativeElement.querySelector('li button[aria-label="Reabrir tarefa: Estudar"]').click();
    const reabrir = http.expectOne(`${url}/1/reabrir`);
    expect(reabrir.request.method).toBe('PATCH');
    reabrir.flush({ id: 1, titulo: 'Estudar', concluida: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('li button[aria-label="Concluir tarefa: Estudar"]').textContent).toContain('Concluir');
  });
  it('edita o título e atualiza a tarefa na lista', () => {
    listar([{ id: 1, titulo: 'Estudar', concluida: false }]);
    fixture.nativeElement.querySelector('[aria-label="Editar tarefa: Estudar"]').click();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#edicao-1');
    input.value = 'Revisar Git';
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('.edicao-tarefa').dispatchEvent(new Event('submit', { cancelable: true }));
    const request = http.expectOne(`${url}/1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ titulo: 'Revisar Git' });
    request.flush({ id: 1, titulo: 'Revisar Git', concluida: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('li h3').textContent).toContain('Revisar Git');
  });
  it('pede confirmação antes de apagar uma tarefa e remove após confirmar', () => {
    listar([{ id: 1, titulo: 'Estudar', concluida: true }]);
    fixture.nativeElement.querySelector('[aria-label="Apagar tarefa: Estudar"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Tem certeza de que deseja apagar “Estudar”?');
    fixture.nativeElement.querySelector('.popup-exclusao .perigo').click();
    const request = http.expectOne(`${url}/1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('li')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Tarefa apagada.');
  });
  it('informa falha de consulta e permite tentar novamente', () => {
    http.expectOne(url).flush('falha', { status: 500, statusText: 'Erro' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar');
    fixture.nativeElement.querySelector('.falha button').click();
    listar();
    expect(fixture.nativeElement.querySelector('.falha')).toBeNull();
  });
  it('mantém o título e informa quando o cadastro falha', () => {
    listar();
    preencher('Estudar');
    http.expectOne(url).flush('falha', { status: 500, statusText: 'Erro' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível adicionar');
    expect(fixture.nativeElement.querySelector('#titulo').value).toBe('Estudar');
  });
  it('atualiza o contador ao carregar, cadastrar, concluir e reabrir tarefas', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Tarefas pendentes:');
    listar();
    expect(fixture.nativeElement.textContent).toContain('Tarefas pendentes: 0');

    preencher('Revisar Git');
    http.expectOne(url).flush({ id: 1, titulo: 'Revisar Git', concluida: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tarefas pendentes: 1');

    fixture.nativeElement.querySelector('[aria-label="Concluir tarefa: Revisar Git"]').click();
    http.expectOne(url + '/1/concluir').flush({ id: 1, titulo: 'Revisar Git', concluida: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tarefas pendentes: 0');

    fixture.nativeElement.querySelector('[aria-label="Reabrir tarefa: Revisar Git"]').click();
    http.expectOne(url + '/1/reabrir').flush({ id: 1, titulo: 'Revisar Git', concluida: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tarefas pendentes: 1');
  });

  it('não conta tarefas que já vieram concluídas da API', () => {
    listar([
      { id: 1, titulo: 'Git', concluida: false },
      { id: 2, titulo: 'Cloud', concluida: true },
    ]);
    expect(fixture.nativeElement.textContent).toContain('Tarefas pendentes: 1');
  });

  it('não exibe contador quando a consulta falha', () => {
    http.expectOne(url).flush('falha', { status: 500, statusText: 'Erro' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Tarefas pendentes:');
  });
});

describe('Acesso ao quadro', () => {
  it('não mostra o conteúdo de tarefas sem uma sessão autenticada', async () => {
    const authAnonimo = {
      usuario: signal(null), carregando: signal(true),
      iniciarSessao: () => { authAnonimo.carregando.set(false); return of(null); },
      cadastrar: vi.fn(), entrar: vi.fn(), sair: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: AuthService, useValue: authAnonimo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#acesso-titulo')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#titulo')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Suas tarefas');
    TestBed.inject(HttpTestingController).expectNone(url);
  });
});
