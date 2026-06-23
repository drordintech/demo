import { Component, OnInit, HostListener } from '@angular/core';
import { linkmanufacturesaltService ,Manufacturer,saltByManufacId,saltStockLocationWise} from '../linkmanufacturesalt/linkmanufacturesalt.service';
import { ManufacturerService  } from '../manufacturer/manufacturer.service';
import { saltService  } from '../salt/salt.service';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
@Component({
  selector: 'app-linkmanufacturesalt',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './linkmanufacturesalt.component.html',
  styleUrls: ['./linkmanufacturesalt.component.scss']
})
export class linkmanufacturesaltComponent implements OnInit {
 
  manufacturers: Manufacturer[] = [];
  manufacturersBySaltId: Manufacturer[] = [];
  saltStockLocation: saltStockLocationWise[] = [];
  SaltDataByManufacturerId:saltByManufacId[]=[];
  selectedOption: string = ''; // Tracks selected radio button
  selectedSalt: string = '';   // Tracks selected dropdown value
  selectedManufacturer:string='';
  //selectedItems: number[] = [];

  filters = {
    name: '',
    address: '',
    email: '',
    phoneNumber: '', otherInformation: ''
  };
  
  activeFilter: string = ''; 
  saltOptions: any = [];
  
  constructor(private LinkmanufacturesaltService: linkmanufacturesaltService,
    private manufacturerService: ManufacturerService,
    private saltService:saltService
  ) {}
  ngOnInit() {
    this.loadManufacturers();
    this.loadSalt();
  }
  loadManufacturers() {
    this.LinkmanufacturesaltService.getManufacturers().subscribe((data) => {
      this.manufacturers = data;
    });
  }
  loadSalt() {
    this.saltService.getsalts().subscribe((data) => {
      this.saltOptions = data;
    });
  }
  filteredManufacturers() {
    return this.manufacturers.filter(manufacturer =>
      (!this.filters.name || manufacturer.name.toLowerCase().includes(this.filters.name.toLowerCase())) &&
      (!this.filters.address || manufacturer.address.toLowerCase().includes(this.filters.address.toLowerCase())) &&
      (!this.filters.email || manufacturer.email.toLowerCase().includes(this.filters.email.toLowerCase())) &&
      (!this.filters.phoneNumber || manufacturer.phoneNumber.includes(this.filters.phoneNumber))
    );
  }  

  filteredManufacturersBySaltid() {
    return this.manufacturersBySaltId.filter(manufacturer =>
      (!this.filters.name || manufacturer.name.toLowerCase().includes(this.filters.name.toLowerCase())) &&
      (!this.filters.address || manufacturer.address.toLowerCase().includes(this.filters.address.toLowerCase())) &&
      (!this.filters.email || manufacturer.email.toLowerCase().includes(this.filters.email.toLowerCase())) &&
      (!this.filters.otherInformation || manufacturer.otherInformation.toLowerCase().includes(this.filters.otherInformation.toLowerCase())) &&
      (!this.filters.phoneNumber || manufacturer.phoneNumber.includes(this.filters.phoneNumber))
    );
  }  

  
  filteredsaltStockLocation() {
    
    return this.saltStockLocation.filter(saltStockLocationWise =>
      (!this.filters.name || saltStockLocationWise.saltName.toLowerCase().includes(this.filters.name.toLowerCase())) 
    );
  }  


  filteredSaltByManufactureId() {
    return this.SaltDataByManufacturerId.filter(manufacturer =>
      (!this.filters.name || manufacturer.name.toLowerCase().includes(this.filters.name.toLowerCase())) 
    );
  }  

  toggleFilter(filterName: string) {
    this.activeFilter = this.activeFilter === filterName ? '' : filterName;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const filterPopup = document.querySelector('.filter-popup');
    const filterIcon = document.querySelector('.filter-icon');

    // Close popup if clicked outside the filter icon and filter popup
    if (
      filterPopup && !filterPopup.contains(event.target as Node) &&
      filterIcon && !filterIcon.contains(event.target as Node)
    ) {
      this.activeFilter = ''; // Close the popup
    }
  }

  // selectAll(event: Event) {
  //   const checked = (event.target as HTMLInputElement).checked;
  //   this.manufacturers.forEach(manufacturer => manufacturer.selected = checked);
  // }

  // // Check if all manufacturers are selected
  // isAllSelected() {
  //   return this.manufacturers.every(manufacturer => manufacturer.selected);
  // }


  onManufacturerChange(event: Event): void {
    
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Selected Manufacturer:', selectedValue);

    this.fetchManufacturerDetails(selectedValue);
    // Additional logic can be placed here
  }

  onSaltChange(event: Event): void {
    
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Selected salt:', selectedValue);
    this.fetchSaltDetails(selectedValue);
  }

  onSaltLocationChange(event: Event): void {
    
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Selected salt:', selectedValue);
    this.fetchSaltStockDetails(selectedValue);
  }

  fetchManufacturerDetails(manufacturerName: string): void {
    this.LinkmanufacturesaltService.fetchSaltDetailsbyManufacturer(manufacturerName).subscribe((data) => {
      this.SaltDataByManufacturerId = data;
    });
  }

  fetchSaltDetails(SaltName: string): void {
    
    this.LinkmanufacturesaltService.fetchManufacturerDetailsbySalt(SaltName).subscribe((data) => {
      
      this.manufacturersBySaltId = data;
    });
  }
  fetchSaltStockDetails(SaltName: string): void {
    
    this.LinkmanufacturesaltService.GetStockBySaltId(SaltName).subscribe((data) => {
      
      this.saltStockLocation = data;
    });
  }
  selectedItems: number[] = [];
  selectedItemssalt: number[] = [];
  
  onCheckboxChange(item: Manufacturer) {
    item.checked = !item.checked;
    this.updateSelectedItems();
  }

  onCheckboxsaltChange(item: any) {
    item.checked = !item.checked;
    this.updateSelectedItemssalt();
  }

  selectedManufacturers: any[] = [];
  selectedSalts: any[] = [];

  updateSelectedItems() {
    this.selectedItems = this.manufacturers
      .filter(item => item.checked)
      .map(item => item.manufacturerId);


      this.selectedManufacturers = this.manufacturers.filter(item => item.checked);
  }

  updateSelectedItemssalt() {
    this.selectedItemssalt = this.saltOptions
      .filter(item => item.checked)
      .map(item => item.saltId);

      this.selectedSalts = this.saltOptions.filter(item => item.checked);
  }

  searchQuery: string = '';

  get filteredManufacturer(): Manufacturer[] {
    return this.manufacturers.filter(item =>
      item.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  searchQuerySalt: string = '';

  get filteredsalt(): any[] {
    return this.saltOptions.filter(item =>
      item.name.toLowerCase().includes(this.searchQuerySalt.toLowerCase())
    );
  }

  linkedItems: { manufactureres: string; saltes: string }[] = [];


  linkSelectedItems() {
    this.linkedItems = []; // Clear existing links

    for (const manufacture of this.selectedManufacturers) {
      for (const saltOp of this.selectedSalts) {
        this.linkedItems.push({
          manufactureres: manufacture.name,
          saltes: saltOp.name
        });
        

      }
    }

    // Optionally log the result to the console
    console.log('Linked Items:', this.linkedItems);
  }
}
