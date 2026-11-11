import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-social-links',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './social-links.component.html',
  styleUrl: './social-links.component.css'
})
export class SocialLinksComponent {}
