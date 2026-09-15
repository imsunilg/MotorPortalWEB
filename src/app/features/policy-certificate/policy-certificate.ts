import { Component } from '@angular/core';
import { ComingSoon } from '../../shared/components/coming-soon/coming-soon';

@Component({
  selector: 'app-policy-certificate',
  standalone: true,
  imports: [ComingSoon],
  templateUrl: './policy-certificate.html',
  styleUrl: './policy-certificate.css',
})
export class PolicyCertificate {
  readonly title = 'Policy Certificate';
}
