import { Component, OnInit, HostListener } from '@angular/core';
import { saltService, salt } from '../salt/salt.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';
import { ManufacturerService,Manufacturer } from '../manufacturer/manufacturer.service';
@Component({
  selector: 'app-salt',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './salt.component.html',
  styleUrls: ['./salt.component.scss']
})
export class saltComponent implements OnInit {
  salts: salt[] = [];
  manufacturers: Manufacturer[] = [];
  newsalt: salt = { saltId: 0, name: '' };
  editingsalt: salt | null = null;
  filters = { name: '' };
  activeFilter: string = '';
  tempSaltName: string = '';
  selectedMenufacturer: string = '';
  currentSaltId: string | null = null;
    constructor(private SaltService: saltService,private manufacturerService: ManufacturerService) { }
  ngOnInit() { this.loadsalts(); this.loadManufacturers(); }
  loadManufacturers() {
    this.manufacturerService.getManufacturers().subscribe((data) => {
      this.manufacturers = data;
    });
  }
  loadsalts() {
    this.SaltService.getsalts().subscribe((data) => {
      this.salts = data;
    });
  }

  openAddSaltModal() {
    this.newsalt = { saltId: 0, name: '' };
    this.editingsalt = null;
    this.tempSaltName = '';
    const modalElement = document.getElementById('addSaltModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  filteredSalt() {
    return this.salts.filter(salt =>
      (!this.filters.name || salt.name.toLowerCase().includes(this.filters.name.toLowerCase()))
    );
  }

  addSalt() {
    this.newsalt.name = this.tempSaltName;
    this.SaltService.createsalt(this.newsalt).subscribe(() => {
      this.loadsalts();
      this.newsalt = { saltId: 0, name: '' };
      const modalElement = document.getElementById('addSaltModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        modal?.hide();
      }
    });
  }

 
  editSalt(salt: salt) {
   
    this.editingsalt = { ...salt };
    this.tempSaltName = salt.name;

    const modalElement = document.getElementById('addSaltModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  
  
  updateSalt() {
    if (this.editingsalt) {
      this.editingsalt.name = this.tempSaltName;
      this.SaltService
        .updatesalt(this.editingsalt.saltId, this.editingsalt)
        .subscribe(() => {
          this.loadsalts();
          this.editingsalt = null; // Reset after update
          const modalElement = document.getElementById('addSaltModal');
          if (modalElement) {
            const modal = Modal.getInstance(modalElement);
            modal?.hide(); // Hide the modal after saving
          }
        });
    }
  }
  
  deleteSalt(saltId: number) {
    this.SaltService.deletesalt(saltId).subscribe(() => this.loadsalts());
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

  linkMenufacturer(saltId: number) { 
    this. currentSaltId= saltId.toString();
    this.selectedMenufacturer="";
    const modalElement = document.getElementById('linkManufacturerModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }
  saveLinkManufacturer(){
    
    if (this.currentSaltId && this.selectedMenufacturer) {
      this.manufacturerService.linkSaltwithManufacturer(this.selectedMenufacturer, this.currentSaltId).subscribe({
        next: (data) => {
          // Success case
          this.currentSaltId = null;
          this.selectedMenufacturer="";
          const modalElement = document.getElementById('linkManufacturerModal');
          if (modalElement) {
            const modal = Modal.getInstance(modalElement);
            modal?.hide();
          }
          alert('Link created successfully!');
        },
        error: (error) => {
          // Handle conflict (409) and other errors
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
}
