import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-custom-switch',
  standalone: false,
  templateUrl: './custom-switch.component.html',
  styleUrl: './custom-switch.component.scss'
})

export class CustomSwitchComponent {
  @Input() value = false; // Initial value
  @Output() valueChange = new EventEmitter<boolean>(); // Emit changes

  toggle(): void {
    this.value = !this.value;
    this.valueChange.emit(this.value); // Notify parent component
  }
}
