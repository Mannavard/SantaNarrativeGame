import { AfterViewInit, Component, OnDestroy } from '@angular/core';

/**
 * Phase 1: the game is the self-contained script in public/game/game.js.
 * It looks up its elements by id, so it is started only after this component's view (app.html) is rendered.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy {
  private script?: HTMLScriptElement;

  ngAfterViewInit(): void {
    this.script = document.createElement('script');
    this.script.src = 'game/game.js';
    document.body.appendChild(this.script);
  }

  ngOnDestroy(): void {
    this.script?.remove();
  }
}
