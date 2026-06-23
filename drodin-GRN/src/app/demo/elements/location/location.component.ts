import { Component, OnInit, HostListener } from '@angular/core';
import { locationService, location } from '../location/location.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';
import { ManufacturerService, Manufacturer } from '../manufacturer/manufacturer.service';
@Component({
  selector: 'app-location',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class locationComponent implements OnInit {
  locations: location[] = [];
  manufacturers: Manufacturer[] = [];
  newLocation: location = { locationId: 0, name: '' };
  editinglocation: location | null = null;
  filters = { name: '' };
  activeFilter: string = '';
  templocationName: string = '';
  selectedMenufacturer: string = '';
  currentlocationId: string | null = null;
  constructor(private locationService: locationService, private manufacturerService: ManufacturerService) { }
  ngOnInit() { this.loadlocations(); this.loadManufacturers(); }
  loadManufacturers() {
    this.manufacturerService.getManufacturers().subscribe((data) => {
      this.manufacturers = data;
    });
  }
  loadlocations() {
    this.locationService.getlocations().subscribe((data) => {
      this.locations = data;
    });
  }

  openAddlocationModal() {
    this.newLocation = { locationId: 0, name: '' };
    this.editinglocation = null;
    this.templocationName = '';
    const modalElement = document.getElementById('addLocationModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  filteredlocation() {
    return this.locations.filter(location =>
      (!this.filters.name || location.name.toLowerCase().includes(this.filters.name.toLowerCase()))
    );
  }

  addlocation() {
    this.newLocation.name = this.templocationName;
    this.locationService.createlocation(this.newLocation).subscribe(() => {
      this.loadlocations();
      this.newLocation = { locationId: 0, name: '' };
      const modalElement = document.getElementById('addLocationModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        modal?.hide();
      }
    });
  }


  editlocation(location: location) {

    this.editinglocation = { ...location };
    this.templocationName = location.name;

    const modalElement = document.getElementById('addLocationModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }



  updatelocation() {
    if (this.editinglocation) {
      this.editinglocation.name = this.templocationName;
      this.locationService
        .updatelocation(this.editinglocation.locationId, this.editinglocation)
        .subscribe(() => {
          this.loadlocations();
          this.editinglocation = null; // Reset after update
          const modalElement = document.getElementById('addLocationModal');
          if (modalElement) {
            const modal = Modal.getInstance(modalElement);
            modal?.hide(); // Hide the modal after saving
          }
        });
    }
  }

  deletelocation(locationId: number) {
    this.locationService.deletelocation(locationId).subscribe(() => this.loadlocations());
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

  linkMenufacturer(locationId: number) {
    this.currentlocationId = locationId.toString();
    this.selectedMenufacturer = "";
    const modalElement = document.getElementById('linkManufacturerModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

}

