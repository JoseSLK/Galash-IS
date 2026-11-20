import { DestroyRef, Directive, ElementRef, OnInit, Renderer2, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgControl } from '@angular/forms';

let nextId = 0;

/**
 * Shows the field's validation message right after the control once it is touched and invalid,
 * and links it with aria-invalid / aria-describedby (PT-NF-03, D005).
 * Usage: <input formControlName="name" galashFieldError="Ingresa el nombre." />
 */
@Directive({ selector: '[galashFieldError]' })
export class FieldErrorDirective implements OnInit {
  readonly galashFieldError = input.required<string>();
  private readonly control = inject(NgControl);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly id = `field-error-${++nextId}`;
  private message: HTMLElement | null = null;
  // aria-describedby the template already sets (e.g. a hint); kept alongside the error.
  private readonly ownDescription = this.host.getAttribute('aria-describedby');

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.control.control?.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.update());
  }

  private update(): void {
    const c = this.control.control;
    const show = !!c && c.invalid && c.touched;
    if (show && !this.message) {
      this.message = this.renderer.createElement('span');
      this.renderer.addClass(this.message, 'field-error');
      this.renderer.setAttribute(this.message, 'id', this.id);
      this.renderer.insertBefore(this.host.parentNode, this.message, this.host.nextSibling);
    }
    if (this.message) this.message.textContent = show ? this.galashFieldError() : '';
    if (show) {
      this.renderer.setAttribute(this.host, 'aria-invalid', 'true');
      this.renderer.setAttribute(this.host, 'aria-describedby', this.ownDescription ? `${this.ownDescription} ${this.id}` : this.id);
    } else {
      this.renderer.removeAttribute(this.host, 'aria-invalid');
      if (this.ownDescription) this.renderer.setAttribute(this.host, 'aria-describedby', this.ownDescription);
      else this.renderer.removeAttribute(this.host, 'aria-describedby');
      this.message?.remove();
      this.message = null;
    }
  }
}
