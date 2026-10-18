import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL, Tarefa, TarefasService } from './tarefas.service';

describe('TarefasService', () => {
  const url = '/api/tarefas';
  const tarefa: Tarefa = { id: 7, titulo: 'Estudar Git', concluida: false };
  let service: TarefasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: url },
      ],
    });
    service = TestBed.inject(TarefasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista as tarefas retornadas pela API', () => {
    let resultado: Tarefa[] | undefined;
    service.listar().subscribe(tarefas => resultado = tarefas);

    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    request.flush([tarefa]);

    expect(resultado).toEqual([tarefa]);
  });

  it('envia o título para cadastrar e recebe a tarefa criada', () => {
    let resultado: Tarefa | undefined;
    service.criar(tarefa.titulo).subscribe(criada => resultado = criada);

    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ titulo: 'Estudar Git' });
    request.flush(tarefa);

    expect(resultado).toEqual(tarefa);
  });

  it('conclui a tarefa pelo ID e recebe seu estado atualizado', () => {
    let resultado: Tarefa | undefined;
    service.concluir(7).subscribe(atualizada => resultado = atualizada);

    const request = http.expectOne(`${url}/7/concluir`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
    request.flush({ ...tarefa, concluida: true });

    expect(resultado?.concluida).toBe(true);
  });

  it('reabre uma tarefa concluída pelo ID', () => {
    let resultado: Tarefa | undefined;
    service.reabrir(7).subscribe(tarefa => resultado = tarefa);

    const request = http.expectOne(`${url}/7/reabrir`);
    expect(request.request.method).toBe('PATCH');
    request.flush({ ...tarefa, concluida: false });

    expect(resultado?.concluida).toBe(false);
  });

  it('atualiza o título da tarefa', () => {
    let resultado: Tarefa | undefined;
    service.atualizar(7, 'Revisar Git').subscribe(tarefa => resultado = tarefa);

    const request = http.expectOne(`${url}/7`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ titulo: 'Revisar Git' });
    request.flush({ ...tarefa, titulo: 'Revisar Git' });

    expect(resultado?.titulo).toBe('Revisar Git');
  });

  it('apaga a tarefa pelo ID', () => {
    let concluido = false;
    service.excluir(7).subscribe(() => concluido = true);

    const request = http.expectOne(`${url}/7`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(concluido).toBe(true);
  });
});
