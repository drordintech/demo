import { Component, OnInit, HostListener } from '@angular/core';
import { ManufacturerService, Manufacturer } from '../manufacturer/manufacturer.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';
import { saltService } from '../salt/salt.service';

@Component({
  selector: 'app-manufacturer',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './manufacturer.component.html',
  styleUrls: ['./manufacturer.component.scss']
})
export class manufacturerComponent implements OnInit {
  manufacturers: Manufacturer[] = [];
  newManufacturer: Manufacturer = { manufacturerId: 0, name: '', address: '', email: '', phoneNumber: '', otherInformation: '' };
  editingManufacturer: Manufacturer | null = null;
  currentManufacturerId: string | null = null;
  selectedSalt: string = '';
  saltOptions: any = [];
  activeFilter: string = '';
  filters = {    name: '',    address: '',    email: '',    phoneNumber: '' ,otherInformation:'' };
  tempManufacturerName: string = '';
  tempManufacturerAddress: string = '';
  tempManufacturerEmail: string = '';
  tempManufacturerphoneNumber: string = '';
  tempManufacturerotherInfo: string = '';

  constructor(private manufacturerService: ManufacturerService,
    private saltService: saltService
  ) { }
  ngOnInit() { this.loadManufacturers(); this.loadSalt(); }
  loadManufacturers() {
    this.manufacturerService.getManufacturers().subscribe((data) => {
      this.manufacturers = data;
    });
  }
  loadSalt() {
    this.saltService.getsalts().subscribe((data) => {
      this.saltOptions = data;
    });
  }
  
  deleteManufacturer(manufacturerId: number) {
    var manufacturerIds=manufacturerId.toString();
    this.manufacturerService.deleteManufacturer(manufacturerIds).subscribe(() => this.loadManufacturers());
  }

  linkSalt(manufacturerId: number) {
    this.currentManufacturerId = manufacturerId.toString();
    this.selectedSalt = ''; 
    const modalElement = document.getElementById('linkSaltModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }
  
  saveLinkSalt() {

    if (this.currentManufacturerId && this.selectedSalt) {
      console.log(`Linking Salt: ${this.selectedSalt} to Manufacturer ID: ${this.currentManufacturerId}`);

      this.manufacturerService.linkSaltwithManufacturer(this.currentManufacturerId, this.selectedSalt).subscribe({
        next: (data) => {
          this.currentManufacturerId = null;
          this.selectedSalt = '';
          const modalElement = document.getElementById('linkSaltModal');
          if (modalElement) {
            const modal = Modal.getInstance(modalElement);
            modal?.hide();
          }
          alert('Link created successfully!');
        },
        error: (error) => {
          if (error.status === 409) {
            alert('This link already exists.');
          } else {
            alert('An error occurred. Please try again.');
          }
          console.error('Error:', error);
        }
      });


    }
  }

  toggleFilter(filterName: string) {
    this.activeFilter = this.activeFilter === filterName ? '' : filterName;
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
  
  filteredManufacturers() {
    return this.manufacturers.filter(manufacturer =>
      (!this.filters.name || manufacturer.name.toLowerCase().includes(this.filters.name.toLowerCase())) &&
      (!this.filters.address || manufacturer.address.toLowerCase().includes(this.filters.address.toLowerCase())) &&
      (!this.filters.email || manufacturer.email.toLowerCase().includes(this.filters.email.toLowerCase())) &&
      (!this.filters.otherInformation || manufacturer.otherInformation.toLowerCase().includes(this.filters.otherInformation.toLowerCase())) &&
      (!this.filters.phoneNumber || manufacturer.phoneNumber.includes(this.filters.phoneNumber))
    );
  }

  openAddManufacturerModal() {
    this.newManufacturer = { manufacturerId: 0, name: '', address: '', email: '', phoneNumber: '', otherInformation: '' };
    this.editingManufacturer = null;
    this.tempManufacturerName = '';
    this.tempManufacturerAddress = '';
    this.tempManufacturerEmail = '';
    this.tempManufacturerphoneNumber = '';
    this.tempManufacturerotherInfo = '';

    const modalElement = document.getElementById('addManufacturerModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  editManufacturers(manufacturer: Manufacturer) {
    this.editingManufacturer = { ...manufacturer };
    this.tempManufacturerName = manufacturer.name;
    this.tempManufacturerAddress = manufacturer.address;
    this.tempManufacturerEmail = manufacturer.email;
    this.tempManufacturerphoneNumber = manufacturer.phoneNumber;
    this.tempManufacturerotherInfo = manufacturer.otherInformation;

    const modalElement = document.getElementById('addManufacturerModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  updateManufacturer() {
    if (this.editingManufacturer) {
      this.editingManufacturer.name = this.tempManufacturerName;
      this.editingManufacturer.address = this.tempManufacturerAddress;
      this.editingManufacturer.email = this.tempManufacturerEmail;
      this.editingManufacturer.phoneNumber = this.tempManufacturerphoneNumber;
      this.editingManufacturer.otherInformation = this.tempManufacturerotherInfo;

      this.manufacturerService
        .updateManufacturer(this.editingManufacturer.manufacturerId, this.editingManufacturer)
        .subscribe(() => {
          this.loadManufacturers();
          this.editingManufacturer = null;
          const modalElement = document.getElementById('addManufacturerModal');
          if (modalElement) {
            const modal = Modal.getInstance(modalElement);
            modal?.hide();
          }
        });
    }
  }
  addManufacturer() {
    this.newManufacturer.name = this.tempManufacturerName;
    this.newManufacturer.address = this.tempManufacturerAddress;
    this.newManufacturer.email = this.tempManufacturerEmail;
    this.newManufacturer.phoneNumber = this.tempManufacturerphoneNumber;
    this.newManufacturer.otherInformation = this.tempManufacturerotherInfo;
    this.manufacturerService.createManufacturer(this.newManufacturer).subscribe(() => {
      this.loadManufacturers();
      this.newManufacturer = { manufacturerId: 0, name: '', address: '', email: '', phoneNumber: '', otherInformation: '' };
      const modalElement = document.getElementById('addManufacturerModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        modal?.hide(); 
      }
    });
  }
}
