import { Component, OnInit, HostListener } from '@angular/core';
import { SupplierService, Supplier } from '../supplier/supplier.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-Supplier',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './Supplier.component.html',
  styleUrls: ['./Supplier.component.scss']
})
export class SupplierComponent implements OnInit {
  Suppliers: Supplier[] = [];
  newSupplier: Supplier = { supplierID: 0, name: '', address: '', email: '', phoneNumber: '', otherInformation: '', state: '' };
  editingSupplier: Supplier | null = null;
  selectedSalt: string = '';
  activeFilter: string = '';
  statesList: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ]; // All States and UTs of India
  filters = { name: '', address: '', email: '', phoneNumber: '', otherInformation: '', state: '' };

  // Temporary fields for add/edit form
  tempSupplierName: string = '';
  tempSupplierAddress: string = '';
  tempSupplierEmail: string = '';
  tempSupplierphoneNumber: string = '';
  tempSupplierotherInfo: string = '';
  tempSupplierState: string = '';

  constructor(private SupplierService: SupplierService) {}

  ngOnInit() { 
    this.loadSuppliers(); 
  }

  loadSuppliers() {
    this.SupplierService.getSuppliers().subscribe((data) => {
      this.Suppliers = data;
    });
  }

  openAddSupplierModal() {
    this.editingSupplier = null;
    this.tempSupplierName = '';
    this.tempSupplierAddress = '';
    this.tempSupplierEmail = '';
    this.tempSupplierphoneNumber = '';
    this.tempSupplierotherInfo = '';
    this.tempSupplierState = '';

    const modalElement = document.getElementById('addSupplierModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  editSuppliers(Supplier: Supplier) {
    this.editingSupplier = { ...Supplier };
    this.tempSupplierName = Supplier.name;
    this.tempSupplierAddress = Supplier.address;
    this.tempSupplierEmail = Supplier.email;
    this.tempSupplierphoneNumber = Supplier.phoneNumber;
    this.tempSupplierotherInfo = Supplier.otherInformation;
    this.tempSupplierState = Supplier.state || '';

    const modalElement = document.getElementById('addSupplierModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  updateSupplier() {
    if (this.editingSupplier) {
      this.editingSupplier.name = this.tempSupplierName;
      this.editingSupplier.address = this.tempSupplierAddress;
      this.editingSupplier.email = this.tempSupplierEmail;
      this.editingSupplier.phoneNumber = this.tempSupplierphoneNumber;
      this.editingSupplier.otherInformation = this.tempSupplierotherInfo;
      this.editingSupplier.state = this.tempSupplierState;

      this.SupplierService.updateSupplier(this.editingSupplier.supplierID, this.editingSupplier).subscribe(() => {
        this.loadSuppliers();
        this.editingSupplier = null;
        const modalElement = document.getElementById('addSupplierModal');
        if (modalElement) {
          const modal = Modal.getInstance(modalElement);
          modal?.hide();
        }
      });
    }
  }

  addSupplier() {
    this.newSupplier = {
      supplierID: 0,
      name: this.tempSupplierName,
      address: this.tempSupplierAddress,
      email: this.tempSupplierEmail,
      phoneNumber: this.tempSupplierphoneNumber,
      otherInformation: this.tempSupplierotherInfo,
      state: this.tempSupplierState
    };

    this.SupplierService.createSupplier(this.newSupplier).subscribe(() => {
      this.loadSuppliers();
      this.newSupplier = { supplierID: 0, name: '', address: '', email: '', phoneNumber: '', otherInformation: '', state: '' };
      const modalElement = document.getElementById('addSupplierModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        modal?.hide();
      }
    });
  }
  deleteSupplier(SupplierId: number) {
    var SupplierIds=SupplierId.toString();
    this.SupplierService.deleteSupplier(SupplierIds).subscribe(() => this.loadSuppliers());
  }
  activeCardFilter: string = 'all';

  setCardFilter(filterType: string) {
    if (this.activeCardFilter === filterType) {
      this.activeCardFilter = 'all';
    } else {
      this.activeCardFilter = filterType;
    }
  }

  filteredSuppliers() {
    return this.Suppliers.filter(Supplier => {
      const matchesName = !this.filters.name || (Supplier.name && Supplier.name.toLowerCase().includes(this.filters.name.toLowerCase()));
      const matchesAddress = !this.filters.address || (Supplier.address && Supplier.address.toLowerCase().includes(this.filters.address.toLowerCase()));
      const matchesEmail = !this.filters.email || (Supplier.email && Supplier.email.toLowerCase().includes(this.filters.email.toLowerCase()));
      const matchesOther = !this.filters.otherInformation || (Supplier.otherInformation && Supplier.otherInformation.toLowerCase().includes(this.filters.otherInformation.toLowerCase()));
      const matchesPhone = !this.filters.phoneNumber || (Supplier.phoneNumber && Supplier.phoneNumber.includes(this.filters.phoneNumber));

      if (!matchesName || !matchesAddress || !matchesEmail || !matchesOther || !matchesPhone) {
        return false;
      }

      if (this.activeCardFilter === 'states') {
        return !!(Supplier.state && Supplier.state.trim() !== '');
      } else if (this.activeCardFilter === 'email') {
        return !!(Supplier.email && Supplier.email.trim() !== '' && Supplier.email.toLowerCase() !== 'null');
      } else if (this.activeCardFilter === 'phone') {
        return !!(Supplier.phoneNumber && Supplier.phoneNumber.trim() !== '' && Supplier.phoneNumber.toLowerCase() !== 'null');
      }

      return true;
    });
  }

  toggleFilter(filterName: string) {
    this.activeFilter = this.activeFilter === filterName ? '' : filterName;
  }

  // Helper methods for stats cards
  getUniqueStates(): string[] {
    const states = this.Suppliers
      .map(supplier => supplier.state)
      .filter(state => state && state.trim() !== '');
    return [...new Set(states)];
  }

  getSuppliersWithEmail(): Supplier[] {
    return this.Suppliers.filter(supplier => 
      supplier.email && supplier.email.trim() !== '' && supplier.email.toLowerCase() !== 'null'
    );
  }

  getSuppliersWithPhone(): Supplier[] {
    return this.Suppliers.filter(supplier => 
      supplier.phoneNumber && supplier.phoneNumber.trim() !== '' && supplier.phoneNumber.toLowerCase() !== 'null'
    );
  }

}
