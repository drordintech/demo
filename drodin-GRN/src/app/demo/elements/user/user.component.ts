import { Component, OnInit, HostListener } from '@angular/core';
import { userService, user } from '../user/user.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';
import { ManufacturerService,Manufacturer } from '../manufacturer/manufacturer.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class userComponent implements OnInit {
  users: user[] = [];
  manufacturers: Manufacturer[] = [];
  newuser: user = { userId: 0, emailAddress: '',isActive:true };
  editinguser: user | null = null;
  filters = { name: '',IsActive:true };
  activeFilter: string = '';
  tempuserName: string = '';
  selectedMenufacturer: string = '';
  currentuserId: string | null = null;

  constructor(private userService: userService,private manufacturerService: ManufacturerService) { }

  ngOnInit() { 
    this.loadusers(); 
    this.loadManufacturers(); 
  }

  loadManufacturers() {
    this.manufacturerService.getManufacturers().subscribe((data) => {
      this.manufacturers = data;
    });
  }

  loadusers() {
    this.userService.getusers().subscribe((data) => {
      this.users = data;
    });
  }

  // Helper methods for stats
  getActiveUsers(): user[] {
    return this.users.filter(user => user.isActive);
  }

  getInactiveUsers(): user[] {
    return this.users.filter(user => !user.isActive);
  }

  getUniqueEmails(): string[] {
    const emails = this.users.map(user => user.emailAddress);
    return [...new Set(emails)];
  }

  getLastLoginDate(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return now.toLocaleDateString('en-US', options);
  }

  openAdduserModal() {
    this.newuser = { userId: 0, emailAddress: '',isActive:true };
    this.editinguser = null;
    this.tempuserName = '';
    const modalElement = document.getElementById('adduserModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  filtereduser() {
    return this.users.filter(user =>
      (!this.filters.name || user.emailAddress.toLowerCase().includes(this.filters.name.toLowerCase()))&&
      (!this.filters.IsActive || user.isActive)
    );
  }

  adduser() {
    this.newuser.emailAddress = this.tempuserName;
    this.userService.createuser(this.newuser).subscribe(() => {
      this.loadusers();
      this.newuser = { userId: 0, emailAddress: '',isActive:true };
      const modalElement = document.getElementById('adduserModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        modal?.hide();
      }
    });
  }

  edituser(user: user) {
    this.editinguser = { ...user };
    this.tempuserName = user.emailAddress;

    const modalElement = document.getElementById('adduserModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  updateuser() {
    if (this.editinguser) {
      this.editinguser.emailAddress = this.tempuserName;
      this.userService
        .updateuser(this.editinguser.userId, this.editinguser)
        .subscribe(() => {
          this.loadusers();
          this.editinguser = null; // Reset after update
          const modalElement = document.getElementById('adduserModal');
          if (modalElement) {
            const modal = Modal.getInstance(modalElement);
            modal?.hide(); // Hide the modal after saving
          }
        });
    }
  }
  
  deleteuser(userId: number) {
    this.userService.deleteuser(userId).subscribe(() => this.loadusers());
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const filterPopup = document.querySelector('.filter-popup');
    const filterIcon = document.querySelector('.filter-icon');
    if (
      filterPopup && !filterPopup.contains(event.target as Node) &&
      filterIcon && !filterIcon.contains(event.target as Node)
    ) {
      this.activeFilter = '';
    }
  }

  toggleFilter(filterName: string) {
    this.activeFilter = this.activeFilter === filterName ? '' : filterName;
  }

  linkMenufacturer(userId: number) { 
    this.currentuserId = userId.toString();
    this.selectedMenufacturer = "";
    const modalElement = document.getElementById('linkManufacturerModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  toggleUserActive(user: any): void {
    user.isActive = !user.isActive;
    // Optionally, call a service or API to save this change
    console.log(`User ${user.emailAddress} active status: ${user.isActive}`);
    
    // Update the user in the backend
    this.userService.updateuser(user.userId, user).subscribe(() => {
      console.log('User status updated successfully');
    }, error => {
      console.error('Error updating user status:', error);
      // Revert the change if update fails
      user.isActive = !user.isActive;
    });
  }
}
