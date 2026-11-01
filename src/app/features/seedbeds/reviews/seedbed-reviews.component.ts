import { Component, Input, OnChanges, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SeedbedReviewsService } from './seedbed-reviews.service';

@Component({
  selector: 'app-seedbed-reviews', standalone: true, imports: [DatePipe, FormsModule],
  templateUrl: './seedbed-reviews.component.html', styleUrl: './reviews.css'
})
export class SeedbedReviewsComponent implements OnChanges {
  @Input({ required: true }) seedbedId = '';
  @Input({ required: true }) seedbedName = '';
  readonly store = inject(SeedbedReviewsService);
  readonly auth = inject(AuthService);
  private readonly selectedId = signal('');
  readonly published = computed(() => this.store.reviews().filter(review => review.seedbedId === this.selectedId() && review.status === 'publicada'));
  readonly columns = computed(() => {
    const reviews = this.published();
    return [0, 1, 2].map(offset => reviews.length ? Array.from({ length: Math.max(3, reviews.length) }, (_, index) => reviews[(index + offset) % reviews.length]) : []);
  });
  text = '';
  feedback = '';
  ngOnChanges(): void {
    this.selectedId.set(this.seedbedId);
    this.store.prepare(this.seedbedId, this.seedbedName);
    this.text = ''; this.feedback = '';
  }
  submit(): void {
    if (!this.auth.isAuthenticated() || !this.text.trim() || this.text.trim().length > 2000) return;
    this.store.submit(this.seedbedId, this.seedbedName, this.auth.profileName(), this.text);
    this.text = '';
    this.feedback = 'Reseña enviada a revisión en esta demostración. Será visible cuando un administrador la acepte.';
  }
  initials(name: string): string { return name.split(/\s+/).slice(0, 2).map(part => part[0]).join(''); }
}
