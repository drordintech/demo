import { Component, OnInit, HostListener } from '@angular/core';
import { responsiblepersonService, responsibleperson } from '../responsibleperson/responsibleperson.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-responsibleperson',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './responsibleperson.component.html',
  styleUrls: ['./responsibleperson.component.scss']
})

export class responsiblepersonComponent implements OnInit {
  responsiblepersons: responsibleperson[] = [];
  Brands: any[] = [];
  newresponsibleperson: responsibleperson = { id: 0, name: '' };
  editingresponsibleperson: responsibleperson | null = null;
  filters = { name: '' };
  activeFilter: string = '';
  tempresponsiblepersonName: string = '';  
  tempresponsiblepersoncode: string = '';
  selectedbrand: string = '';
  currentresponsiblepersonId: string | null = null;
  constructor(private responsiblepersonService: responsiblepersonService) { }
  ngOnInit() { 
    this.loadresponsiblepersons(); 
    }
  loadresponsiblepersons() {
    this.responsiblepersonService.getresponsiblepersons().subscribe((data) => {
      this.responsiblepersons = data;
    });
  }
  
  openAddresponsiblepersonModal() {
    this.newresponsibleperson = { id: 0, name: '' };
    this.editingresponsibleperson = null;
    this.tempresponsiblepersonName = '';this.tempresponsiblepersoncode = '';
    const modalElement = document.getElementById('addresponsiblepersonModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  filteredresponsibleperson() {
    return this.responsiblepersons.filter(responsibleperson =>
      (!this.filters.name || responsibleperson.name.toLowerCase().includes(this.filters.name.toLowerCase()))
    );
  }

  addresponsibleperson() {
    
    this.newresponsibleperson.name = this.tempresponsiblepersonName;
    // this.newresponsibleperson.responsiblepersonCode = this.tempresponsiblepersoncode;
    // this.newresponsibleperson.BrandId = Number(this.selectedbrand);
    
    this.responsiblepersonService.createresponsibleperson(this.newresponsibleperson).subscribe(() => {
      this.loadresponsiblepersons();
      this.newresponsibleperson = { id: 0, name: ''};
      const modalElement = document.getElementById('addresponsiblepersonModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        modal?.hide();
      }
    });
  }

 
  editresponsibleperson(responsibleperson: responsibleperson) {
   
    this.editingresponsibleperson = { ...responsibleperson };
    this.tempresponsiblepersonName = responsibleperson.name;

    const modalElement = document.getElementById('addresponsiblepersonModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  
  
  updateresponsibleperson() {
    debugger
    if (this.editingresponsibleperson) {
      
      this.editingresponsibleperson.name = this.tempresponsiblepersonName;
      // this.editingresponsibleperson.responsiblepersonCode = this.tempresponsiblepersoncode;
      // this.editingresponsibleperson.BrandId = Number(this.selectedbrand);
      
      this.responsiblepersonService
        .updateresponsibleperson(this.editingresponsibleperson.id, this.editingresponsibleperson)
        .subscribe(() => {
          this.loadresponsiblepersons();
          this.editingresponsibleperson = null; // Reset after update
          const modalElement = document.getElementById('addresponsiblepersonModal');
          if (modalElement) {
            const modal = Modal.getInstance(modalElement);
            modal?.hide(); // Hide the modal after saving
          }
        });
    }
  }
  
  deleteresponsibleperson(responsiblepersonId: number) {
    this.responsiblepersonService.deleteresponsibleperson(responsiblepersonId).subscribe(() => this.loadresponsiblepersons());
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

  // Helper methods for stats cards
  getActivePersons(): responsibleperson[] {
    // For now, consider all persons as active since there's no status field
    return this.responsiblepersons;
  }

  getUniqueNames(): string[] {
    const names = this.responsiblepersons
      .map(person => person.name)
      .filter(name => name && name.trim() !== '');
    return [...new Set(names)];
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  linkMenufacturer(responsiblepersonId: number) { 
    this. currentresponsiblepersonId= responsiblepersonId.toString();
    this.selectedbrand="";
    const modalElement = document.getElementById('linkManufacturerModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }
 
}
