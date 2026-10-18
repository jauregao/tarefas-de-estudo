import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Tarefa, TarefasService } from './tarefas.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly service = inject(TarefasService);
  readonly auth = inject(AuthService);
  private readonly tituloInput = viewChild<ElementRef<HTMLInputElement>>('tituloInput');
  private readonly listaTitulo = viewChild<ElementRef<HTMLHeadingElement>>('listaTitulo');
  readonly tarefas = signal<Tarefa[]>([]);
  readonly titulo = signal('');
  readonly editandoId = signal<number | null>(null);
  readonly tituloEdicao = signal('');
  readonly confirmandoExclusaoId = signal<number | null>(null);
  readonly nome = signal('');
  readonly email = signal('');
  readonly senha = signal('');
  readonly modoCadastro = signal(false);
  readonly carregando = signal(false);
  readonly ocupada = signal(false);
  readonly erro = signal('');
  readonly erroAuth = signal('');
  readonly erroTitulo = signal('');
  readonly aviso = signal('');

  ngOnInit() {
    this.auth.iniciarSessao().subscribe(usuario => {
      if (usuario) this.carregar();
    });
  }

  alternarModoAcesso() {
    this.modoCadastro.update(cadastro => !cadastro);
    this.erroAuth.set('');
  }

  enviarAcesso(event: Event) {
    event.preventDefault();
    if (this.ocupada()) return;
    this.erroAuth.set('');
    this.ocupada.set(true);

    const acesso = this.modoCadastro()
      ? this.auth.cadastrar({ nome: this.nome().trim(), email: this.email().trim(), senha: this.senha() })
      : this.auth.entrar({ email: this.email().trim(), senha: this.senha() });

    acesso.subscribe({
      next: () => {
        this.senha.set('');
        this.ocupada.set(false);
        this.carregar();
      },
      error: erro => {
        this.erroAuth.set(this.mensagemDeAcesso(erro));
        this.ocupada.set(false);
      },
    });
  }

  sair() {
    this.auth.sair();
    this.tarefas.set([]);
    this.titulo.set('');
    this.aviso.set('');
    this.erro.set('');
    this.erroAuth.set('');
  }

  carregar() {
    this.carregando.set(true);
    this.erro.set('');
    this.service.listar().subscribe({
      next: tarefas => { this.tarefas.set(tarefas); this.carregando.set(false); },
      error: () => {
        this.erro.set('Não foi possível carregar suas tarefas. Tente novamente.');
        this.carregando.set(false);
      },
    });
  }

  criar(event: Event) {
    event.preventDefault();
    if (this.ocupada() || this.carregando()) return;
    this.erroTitulo.set('');
    this.aviso.set('');
    const titulo = this.titulo().trim();
    if (!titulo) {
      this.erroTitulo.set('Informe o título da tarefa.');
      this.tituloInput()?.nativeElement.focus();
      return;
    }
    this.ocupada.set(true);
    this.erro.set('');
    this.service.criar(titulo).subscribe({
      next: tarefa => {
        this.tarefas.update(tarefas => [...tarefas, tarefa]);
        this.titulo.set('');
        this.ocupada.set(false);
        this.aviso.set('Tarefa adicionada.');
        this.tituloInput()?.nativeElement.focus();
      },
      error: () => {
        this.ocupada.set(false);
        this.erro.set('Não foi possível adicionar a tarefa. Tente novamente.');
      },
    });
  }

  concluir(tarefa: Tarefa) {
    if (this.ocupada()) return;
    this.ocupada.set(true);
    this.erro.set('');
    this.aviso.set('');
    const alternar = tarefa.concluida
      ? this.service.reabrir(tarefa.id)
      : this.service.concluir(tarefa.id);
    alternar.subscribe({
      next: atualizada => {
        this.tarefas.update(tarefas => tarefas.map(item => item.id === atualizada.id ? atualizada : item));
        this.ocupada.set(false);
        this.aviso.set(atualizada.concluida ? 'Tarefa concluída.' : 'Tarefa reaberta.');
        this.listaTitulo()?.nativeElement.focus();
      },
      error: () => {
        this.ocupada.set(false);
        this.erro.set('Não foi possível concluir a tarefa. Tente novamente.');
      },
    });
  }

  iniciarEdicao(tarefa: Tarefa) {
    this.editandoId.set(tarefa.id);
    this.tituloEdicao.set(tarefa.titulo);
    this.confirmandoExclusaoId.set(null);
    this.aviso.set('');
    this.erro.set('');
  }

  cancelarEdicao() {
    this.editandoId.set(null);
    this.tituloEdicao.set('');
  }

  salvarEdicao(tarefa: Tarefa) {
    if (this.ocupada()) return;
    const titulo = this.tituloEdicao().trim();
    if (!titulo) {
      this.erro.set('Informe o título da tarefa.');
      return;
    }
    this.ocupada.set(true);
    this.erro.set('');
    this.aviso.set('');
    this.service.atualizar(tarefa.id, titulo).subscribe({
      next: atualizada => {
        this.tarefas.update(tarefas => tarefas.map(item => item.id === atualizada.id ? atualizada : item));
        this.cancelarEdicao();
        this.ocupada.set(false);
        this.aviso.set('Tarefa atualizada.');
        this.listaTitulo()?.nativeElement.focus();
      },
      error: () => {
        this.ocupada.set(false);
        this.erro.set('Não foi possível atualizar a tarefa. Tente novamente.');
      },
    });
  }

  pedirExclusao(tarefa: Tarefa) {
    this.confirmandoExclusaoId.set(tarefa.id);
    this.editandoId.set(null);
    this.aviso.set('');
  }

  cancelarExclusao() {
    this.confirmandoExclusaoId.set(null);
  }

  excluir(tarefa: Tarefa) {
    if (this.ocupada()) return;
    this.ocupada.set(true);
    this.erro.set('');
    this.aviso.set('');
    this.service.excluir(tarefa.id).subscribe({
      next: () => {
        this.tarefas.update(tarefas => tarefas.filter(item => item.id !== tarefa.id));
        this.confirmandoExclusaoId.set(null);
        this.ocupada.set(false);
        this.aviso.set('Tarefa apagada.');
        this.listaTitulo()?.nativeElement.focus();
      },
      error: () => {
        this.ocupada.set(false);
        this.erro.set('Não foi possível apagar a tarefa. Tente novamente.');
      },
    });
  }

  private mensagemDeAcesso(erro: unknown) {
    if (erro instanceof HttpErrorResponse && erro.status === 401)
      return 'E-mail ou senha incorretos.';

    const erros = (erro as HttpErrorResponse)?.error?.errors as Record<string, string[]> | undefined;
    const mensagens = erros ? Object.values(erros).flat() : [];
    return mensagens.join(' ') || 'Não foi possível concluir o acesso. Confira os dados e tente novamente.';
  }
}
