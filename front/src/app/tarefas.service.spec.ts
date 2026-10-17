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
});
