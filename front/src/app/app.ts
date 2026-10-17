import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { Tarefa, TarefasService } from './tarefas.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly service = inject(TarefasService);
  private readonly tituloInput = viewChild<ElementRef<HTMLInputElement>>('tituloInput');
  private readonly listaTitulo = viewChild<ElementRef<HTMLHeadingElement>>('listaTitulo');
  readonly tarefas = signal<Tarefa[]>([]);
  readonly titulo = signal('');
  readonly carregando = signal(true);
  readonly ocupada = signal(false);
  readonly erro = signal('');
  readonly erroTitulo = signal('');
  readonly aviso = signal('');

  ngOnInit() { this.carregar(); }

  carregar() {
    this.carregando.set(true);
    this.erro.set('');
    this.service.listar().subscribe({
      next: tarefas => { this.tarefas.set(tarefas); this.carregando.set(false); },
      error: () => {
        this.erro.set('Não foi possível carregar as tarefas. Confira se a API está em execução.');
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
    if (this.ocupada() || tarefa.concluida) return;
    this.ocupada.set(true);
    this.erro.set('');
    this.aviso.set('');
    this.service.concluir(tarefa.id).subscribe({
      next: atualizada => {
        this.tarefas.update(tarefas => tarefas.map(item => item.id === atualizada.id ? atualizada : item));
        this.ocupada.set(false);
        this.aviso.set('Tarefa concluída.');
        this.listaTitulo()?.nativeElement.focus();
      },
      error: () => {
        this.ocupada.set(false);
        this.erro.set('Não foi possível concluir a tarefa. Tente novamente.');
      },
    });
  }
}
