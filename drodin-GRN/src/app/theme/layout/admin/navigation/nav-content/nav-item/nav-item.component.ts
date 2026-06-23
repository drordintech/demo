// Angular import
import { Component, Input } from '@angular/core';

// Project import
import { NavigationItem } from '../../navigation';

@Component({
  selector: 'app-nav-item',
  templateUrl: './nav-item.component.html',
  styleUrls: ['./nav-item.component.scss']
})
export class NavItemComponent {
  // public props
  @Input() item!: NavigationItem;

  // public method
  closeOtherMenu(event: any) {
    const ele = event.target;
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent.parentElement.parentElement;
      const last_parent = up_parent.parentElement;
      const sections = document.querySelectorAll('.pcoded-hasmenu');
      for (let i = 0; i < sections.length; i++) {
        sections[i].classList.remove('active');
        sections[i].classList.remove('pcoded-trigger');
      }

      if (last_parent.classList.contains('pcoded-hasmenu')) {
        last_parent.classList.add('active');
        last_parent.classList.add('pcoded-trigger');
      }
    }
    if ((document.querySelector('app-navigation.coded-navbar') as HTMLDivElement).classList.contains('mob-open')) {
      (document.querySelector('app-navigation.coded-navbar') as HTMLDivElement).classList.remove('mob-open');
    }
  }

  getMenuItemDescription(title: string): string {
    switch (title) {
      case 'Dashboard':
        return 'View analytics and overview';
      case 'Setup GRN':
        return 'Create and manage GRNs';
      case 'Setup Supplier':
        return 'Manage supplier information';
      case 'Setup Product':
        return 'Configure product catalog';
      case 'Setup User':
        return 'User management system';
      case 'Setup Responsible Person':
        return 'Assign responsibility roles';
      case 'GRN Report Supplier Wise':
        return 'Supplier-based GRN analysis';
      case 'State Wise GRN Report':
        return 'Geographic GRN distribution';
      case 'Responsible Person Wise GRN Report':
        return 'Person-based GRN tracking';
      default:
        return 'Navigate to this section';
    }
  }
}
