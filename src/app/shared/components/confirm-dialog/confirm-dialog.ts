import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * A minimal in-app confirmation modal. Shown/hidden by the host via the
 * `open` input (no global service — each host owns its own instance).
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  @Input() open = false;
  @Input() title = 'Please confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
