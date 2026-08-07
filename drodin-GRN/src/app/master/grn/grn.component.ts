import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbNavModule, NgbModal, NgbDatepickerModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { Modal } from 'bootstrap';
import { product, productService } from '../product/product.service';
import { Supplier, SupplierService } from '../supplier/supplier.service';
import { grnService } from './grn.service';

export interface FieldConfig {
  label: string;
  type: 'text' | 'number' | 'select' | 'readonly' | 'checkbox' | 'date';
}

export const FIELD_CONFIG: Record<string, FieldConfig> = {
  sno: { label: 'S.No', type: 'readonly' },
  product: { label: 'Product', type: 'select' },
  sku: { label: 'SKU / Code', type: 'text' },
  asPerParty: { label: 'As Per Party', type: 'number' },
  quantityasperparty: { label: 'As Per Party', type: 'number' },
  received: { label: 'Received Qty', type: 'number' },
  receivedQuantity: { label: 'Received Qty', type: 'number' },
  passed: { label: 'Passed Qty', type: 'number' },
  rejected: { label: 'Rejected Qty', type: 'number' },
  miscellaneous: { label: 'Miscellaneous Qty', type: 'number' },
  status: { label: 'Status', type: 'select' },
  demandedByParty: { label: 'Demanded By Party', type: 'select' },
  MRP: { label: 'MRP', type: 'number' },
  batchno: { label: 'Batch No', type: 'text' },
  expiryDate: { label: 'Expiry Date', type: 'date' },
  returnToParty: { label: 'Return to Party', type: 'checkbox' },
  retQty: { label: 'Return Qty', type: 'number' },
  remarks: { label: 'Remarks 1', type: 'text' },
  remarks2: { label: 'Remarks 2', type: 'text' }
};

export const TAB_COLUMNS: Record<string, string[]> = {
  intake: ['sno', 'product', 'asPerParty', 'received'],
  center: [
    'sno', 'product', 'passed', 'rejected', 'miscellaneous', 'status', 'demandedByParty',
    'MRP', 'batchno', 'expiryDate', 'returnToParty', 'retQty', 'remarks', 'remarks2'
  ]
};

export interface GrnRow {
  sno: number;
  product: any;
  sku: string;
  asPerParty: number;
  received: number;
  passed: number;
  rejected: number;
  miscellaneous?: number;
  status: string;
  demandedByParty: string;
  demandedbyparty?: string;
  isEditingStatus?: boolean;
  selectedProduct?: any;
  searchText?: string;
  quantityasperparty?: number;
  receivedQuantity?: number;
  MRP?: number;
  batchno?: string;
  dateofexpiry?: string;
  expiryDate?: string;
  remarks?: string;
  remarks2?: string;
  statusofrejected?: string;
  statusofpassed?: string;
  statusofmiscellaneous?: string;
  RetrunToParty?: boolean;
  returnToParty?: boolean;
  retQty?: number;
  filteredProducts?: any[];
  qtyWarning?: string;
}

@Component({
  selector: 'app-grn',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbNavModule, SharedModule, NgbDatepickerModule, NgbDropdownModule],
  templateUrl: './grn.component.html',
  styleUrls: ['./grn.component.scss']
})

export class grnComponent implements OnInit {
  FIELD_CONFIG = FIELD_CONFIG;
  TAB_COLUMNS = TAB_COLUMNS;

  getActiveColumns(): string[] {
    const rawCols = TAB_COLUMNS[this.activeTab] || TAB_COLUMNS['intake'] || [];
    const otherCols = rawCols.filter(c => c !== 'sno' && c !== 'product');
    return ['sno', 'product', ...otherCols];
  }

  getFieldConfig(colKey: string): FieldConfig {
    return FIELD_CONFIG[colKey] || { label: colKey, type: 'text' };
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'badge bg-secondary';
    const s = status.toLowerCase();
    if (s.includes('pending')) return 'badge bg-warning text-dark';
    if (s.includes('passed') || s.includes('approved') || s.includes('complete')) return 'badge bg-success';
    if (s.includes('rejected')) return 'badge bg-danger';
    return 'badge bg-secondary';
  }

  @ViewChild('supplierInfoModal') supplierInfoModal!: ElementRef;
  @ViewChild('supplier2InfoModal') supplier2InfoModal!: ElementRef;
  @ViewChild('productInfoModal') productInfoModal!: ElementRef;
  @ViewChild('grnProductListpopup') grnProductListpopup!: ElementRef;
  @ViewChild('addSupplierModal') addSupplierModal!: ElementRef;
  navCollapsedMob = true;
  products: product[] = [];
  selectedSupplierName: string = '';  selectedGRNName: string = ''; selectedResperson: string = ''; 
  selectedSupplierName2: string = '';  
  selectedsupplier: string = '';
  selectedsupplier2: string = '';
  selectedResponsiblePerson: string = '';
  selectedResponsiblePersonName: any;
  selectedResponsiblePersondetail:any = null;
  selectedgrnstatus: string = '';  selectedgrnOldstatus: string = '';
  dockernumber:string='';
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  filteredSuppliers2: Supplier[] = [];

  statesList: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  tempNewSupplierName: string = '';
  tempNewSupplierState: string = '';
  tempNewSupplierAddress: string = '';
  tempNewSupplierEmail: string = '';
  tempNewSupplierPhone: string = '';
  tempNewSupplierOtherInfo: string = '';

  supplierFormSubmitted: boolean = false;
  supplierModalError: string = '';
  supplierModalSuccess: string = '';
  isSavingSupplier: boolean = false;
  ResponsiblePersons: any[] = [];
  filteredResponsiblePersons: any[] = [];
  rows: GrnRow[] = [];
  get grnList(): GrnRow[] { return this.rows; }
  set grnList(val: GrnRow[]) { this.rows = val; }
  challanList: any[] = [];  challanOldList: any[] = [];
  grnListrpt: any[] = [];
  // Pagination State for GRN Search Results
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 20, 50, 100];

  get paginatedGrnList(): any[] {
    if (!this.grnListrpt || this.grnListrpt.length === 0) return [];
    const start = (this.currentPage - 1) * this.pageSize;
    return this.grnListrpt.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    if (!this.grnListrpt || this.grnListrpt.length === 0) return 1;
    return Math.ceil(this.grnListrpt.length / this.pageSize);
  }

  get startRecord(): number {
    if (!this.grnListrpt || this.grnListrpt.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    if (!this.grnListrpt || this.grnListrpt.length === 0) return 0;
    return Math.min(this.currentPage * this.pageSize, this.grnListrpt.length);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(event: any): void {
    this.pageSize = Number(event.target.value);
    this.currentPage = 1;
  }

  getPageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    const pages: number[] = [];

    let start = Math.max(1, current - delta);
    let end = Math.min(total, current + delta);

    if (current <= delta) {
      end = Math.min(total, 1 + delta * 2);
    }
    if (current + delta >= total) {
      start = Math.max(1, total - delta * 2);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  grnListRptold: any[] = [];
  grnListRptoldSupplierName: string = '';
  grnListRptoldSupplierID: string = '';
  grnListRptoldGrnNo: string = '';grnListRptoldchallanno: string = '';oldChallanNumber: string = '';
  grnListRptoldResponsiblePerson: string = '';
  grnListRptoldgrnStatus: string = '';
  grnListRptolddokerno: string = '';
  grnID:number;
  eway:string='';
  grnNumber: string = '';challanNumber: string = '';
  todayDate:string='';
  selectedSupplierDetails: any = null;
  selectedRespersonDetails: any = null;
  selectedGRNDetails: any = null;
  selectedSupplierDetails2: any = null;
  selectedProductDetails: any = null;

  status = [
    { id: 1, name: 'Pending' },
    { id: 2, name: 'Approved' },
    { id: 3, name: 'Rejected' }
  ];

  demandedbyparty = [
    { id: 1, name: 'Credit Note' },
    { id: 2, name: 'Replacement' },
    { id: 3, name: 'Repaired' },
  ];

  statusofpassed = [
    { id: 1, name: 'Credit Note' },
    { id: 2, name: 'Replacement' },
    { id: 3, name: 'Repaired' },
  ];


  
  statusofrejected = [
    { id: 1, name: 'Retrun To Party' },
    { id: 2, name: 'On To Be Issued' },
    { id: 3, name: 'Can not Be Repaired' },
    { id: 4, name: 'Not Salable Condition' },
    { id: 5, name: 'No CN' },
    { id: 6, name: 'Out Of Warranty' },
    { id: 7, name: 'In Office Panchkula' },
  ];

  statusofmiscellaneous = [
    { id: 1, name: 'Credit Note' },
    { id: 2, name: 'Replacement' },
    { id: 3, name: 'Repaired' },
    { id: 4, name: 'Scrap' },
    { id: 5, name: 'Other' },
  ];

  grnstatus = [
    { id: 1, name: 'Pending ' },
    { id: 2, name: 'Complete' },
  ];

  date = '';
  fromDate: string = '';
  toDate: string = '';
  selectedPreset: string = '';
  searchText: string = '';
  activeTab: string = 'intake'; // Track active tab: 'intake' | 'service' | 'center' | 'profile'
  stepError: string = '';

  /** Editable footer fields — printed on GRN & Challan PDF */
  stockRepair = {
    stockReceivedParty: '',
    docketNoDate: '',
    transport: '',
    debitNoteInvoice: '',
    dateTime: ''
  };

  dispatch = {
    stockSentTo: '',
    challanInvoiceCreditNote: '',
    docketNoDate: '',
    transport: '',
    grnNo: '',
    noCreditNoteRemark: '',
    needDebitNoteRemark: ''
  };

  constructor(
      private GrnService: grnService,
      private supplierService:SupplierService,
      private productService: productService
  ) { }
 
  ngOnInit() {
    this.loadsuppliers(); 
    this.loadproducts();
    this.navMobClick();
    this.genrateGRN();
    this.genaratetodayDate();
    this.loadResponsiblePerson();
    this.genratechallanNumber();
    if (this.rows.length === 0) {
      this.addGrnRow();
    }
  }

  genrateGRN(){
    this.GrnService.genrateGRN().subscribe((data) => {
      this.grnNumber = data.grnNumber;
    });
  }

  genratechallanNumber(){
    this.GrnService.genratechallanNumber().subscribe((data) => {
      this.challanNumber = data.challanNumber;
    });
  }

  genaratetodayDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two-digit format
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    //const uniqueId = 'GRN-'+`${year}${month}${day}${hours}${minutes}${seconds}`;
    
    let hour = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    const formattedHour = String(hour).padStart(2, '0');

    this.todayDate = `${day}/${month}/${year} ${formattedHour}:${minute} ${ampm}`;
   // return uniqueId;
  }

  loadsuppliers(selectIdAfterLoad?: number) {
    this.supplierService.getSuppliers().subscribe((data) => {
      this.suppliers = data;
      this.filteredSuppliers = data;
      this.filteredSuppliers2 = data;
      if (selectIdAfterLoad) {
        this.selectSupplier(selectIdAfterLoad, false);
        this.selectSupplier(selectIdAfterLoad, true);
      }
    });
  }

  openAddSupplierModal() {
    this.resetNewSupplierForm();
    if (this.addSupplierModal) {
      const modal = new Modal(this.addSupplierModal.nativeElement);
      modal.show();
    }
  }

  closeAddSupplierModal() {
    if (this.addSupplierModal) {
      const modal = Modal.getInstance(this.addSupplierModal.nativeElement);
      modal?.hide();
    }
  }

  resetNewSupplierForm() {
    this.tempNewSupplierName = '';
    this.tempNewSupplierState = '';
    this.tempNewSupplierAddress = '';
    this.tempNewSupplierEmail = '';
    this.tempNewSupplierPhone = '';
    this.tempNewSupplierOtherInfo = '';
    this.supplierFormSubmitted = false;
    this.supplierModalError = '';
    this.supplierModalSuccess = '';
    this.isSavingSupplier = false;
  }

  saveNewSupplier() {
    this.supplierFormSubmitted = true;
    this.supplierModalError = '';
    this.supplierModalSuccess = '';

    if (!this.tempNewSupplierName || !this.tempNewSupplierName.trim()) {
      this.supplierModalError = 'Supplier name is required.';
      return;
    }

    const payload: Supplier = {
      supplierID: 0,
      name: this.tempNewSupplierName.trim(),
      address: this.tempNewSupplierAddress ? this.tempNewSupplierAddress.trim() : '',
      email: this.tempNewSupplierEmail ? this.tempNewSupplierEmail.trim() : '',
      phoneNumber: this.tempNewSupplierPhone ? this.tempNewSupplierPhone.trim() : '',
      otherInformation: this.tempNewSupplierOtherInfo ? this.tempNewSupplierOtherInfo.trim() : '',
      state: this.tempNewSupplierState || ''
    };

    this.isSavingSupplier = true;
    this.supplierService.createSupplier(payload).subscribe({
      next: (response: any) => {
        this.isSavingSupplier = false;
        this.supplierModalSuccess = 'Supplier added successfully!';
        
        const newId = (response && (response.supplierID || response.supplierId || response.id)) ? Number(response.supplierID || response.supplierId || response.id) : undefined;

        setTimeout(() => {
          this.closeAddSupplierModal();
          this.loadsuppliers(newId);
        }, 800);
      },
      error: (err: any) => {
        this.isSavingSupplier = false;
        this.supplierModalError = err?.error?.message || 'Failed to add supplier. Please try again.';
      }
    });
  }

  filterSuppliers(event: any, isUpdateTab: boolean = false) {
    const search = event.target.value.toLowerCase();
    const filtered = this.suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(search)
    );
    if (isUpdateTab) {
      this.filteredSuppliers2 = filtered;
    } else {
      this.filteredSuppliers = filtered;
    }
  }

  selectSupplier(id: any, isUpdateTab: boolean = false) {
    if (isUpdateTab) {
      this.selectedsupplier2 = id;
      this.onSupplierChange2();
    } else {
      this.selectedsupplier = id;
      this.onSupplierChange();
    }
  }

  getSelectedSupplierName(isUpdateTab: boolean = false): string {
    const selectedId = isUpdateTab ? this.selectedsupplier2 : this.selectedsupplier;
    if (selectedId === '' || selectedId === null || selectedId === undefined) return 'Select Supplier';
    if (isUpdateTab && String(selectedId) === '0') return 'All Suppliers';
    const supplier = this.suppliers.find(s => s.supplierID === +selectedId);
    return supplier ? supplier.name : 'Select Supplier';
  }

  loadResponsiblePerson() {
    this.supplierService.getloadResponsiblePerson().subscribe((data) => {
      this.ResponsiblePersons = data;
      this.filteredResponsiblePersons = data;
    });
  }

  filterResponsiblePersons(event: any) {
    const search = event.target.value.toLowerCase();
    this.filteredResponsiblePersons = this.ResponsiblePersons.filter(person => 
      person.name.toLowerCase().includes(search)
    );
  }

  selectResponsiblePerson(id: any) {
    this.selectedResponsiblePerson = id;
    this.onResponsiblePersonChange();
  }

  getSelectedResponsiblePersonName(): string {
    if (!this.selectedResponsiblePerson) return 'Select Responsible Person';
    const person = this.ResponsiblePersons.find(p => p.id === +this.selectedResponsiblePerson);
    return person ? person.name : 'Select Responsible Person';
  }

  onSupplierChange() {
    const selectedSupplier = this.suppliers.find(supplier => supplier.supplierID === Number(this.selectedsupplier));
    this.selectedSupplierName = selectedSupplier ? selectedSupplier.name : '';
    this.selectedSupplierDetails = selectedSupplier;
  }

  onGRNStatusChange(){
    const selectedGRN = this.grnstatus.find(grn => grn.id === Number(this.selectedgrnstatus));
    this.selectedGRNName = selectedGRN ? selectedGRN.name : '';
    this.selectedGRNDetails = selectedGRN;
  }

  onResponsiblePersonChange() {
    const selectedSup = this.ResponsiblePersons.find(a => a.id === Number(this.selectedResponsiblePerson));
    this.selectedResperson = selectedSup ? selectedSup.name : '';
    this.selectedRespersonDetails = selectedSup;
  }

  onSupplierChange2() {
    if (this.selectedsupplier2 === '' || this.selectedsupplier2 === null || this.selectedsupplier2 === undefined) {
      this.selectedSupplierName2 = '';
      this.selectedSupplierDetails2 = null;
      return;
    }
    if (String(this.selectedsupplier2) === '0') {
      this.selectedSupplierName2 = 'All Suppliers';
      this.selectedSupplierDetails2 = null;
      return;
    }
    const selectedSupplier = this.suppliers.find(supplier => supplier.supplierID === Number(this.selectedsupplier2));
    this.selectedSupplierName2 = selectedSupplier ? selectedSupplier.name : '';
    this.selectedSupplierDetails2 = selectedSupplier;
  }
 
  loadproducts() {
    this.productService.getproducts().subscribe((data) => {
      this.products = data;
      this.refreshRowProducts();
    });
  }

  /** Keep each row's product dropdown in sync after products load or when adding rows. */
  refreshRowProducts(): void {
    this.rows.forEach(row => {
      if (!row.searchText) {
        row.filteredProducts = [...this.products];
      } else {
        const search = row.searchText.toLowerCase();
        row.filteredProducts = this.products.filter(
          product => product.name.toLowerCase().includes(search)
        );
      }
    });
  }
  
  filterProducts(grn: any) {
    if (!grn.searchText) {
      grn.filteredProducts = [...this.products];
      grn.selectedProduct = grn.filteredProducts.length ? grn.filteredProducts[0].productId : null;
    } else {
      const search = grn.searchText.toLowerCase();
      grn.filteredProducts = this.products.filter(
        product => product.name.toLowerCase().includes(search)
      );
      grn.selectedProduct = grn.filteredProducts.length ? grn.filteredProducts[0].productId : null;
    }
  }
  
  addGrnRow() {
    const newRow: GrnRow = {
      sno: this.rows.length + 1,
      product: null,
      sku: '',
      asPerParty: 0,
      received: 0,
      passed: 0,
      rejected: 0,
      miscellaneous: 0,
      status: '',
      demandedByParty: '',
      demandedbyparty: '',
      selectedProduct: null,
      searchText: '',
      quantityasperparty: 0,
      receivedQuantity: 0,
      MRP: 0,
      batchno: '',
      dateofexpiry: '',
      remarks: '',
      remarks2: '',
      statusofrejected: '',
      statusofpassed: '',
      statusofmiscellaneous: '',
      RetrunToParty: false,
      returnToParty: false,
      retQty: 0,
      filteredProducts: [...this.products]
    };
    this.rows.push(newRow);
  }

  removeGrnRow(index: number) {
    this.rows.splice(index, 1);
    this.rows.forEach((row, i) => row.sno = i + 1);
  }
  
  updateQuantity(grn: any) {
    if (grn.quantityasperparty !== undefined) grn.asPerParty = grn.quantityasperparty;
    if (grn.receivedQuantity !== undefined) grn.received = grn.receivedQuantity;
    this.validateRow(grn);
  }

  validateRow(grn: any) {
    if (grn.quantityasperparty !== undefined) grn.asPerParty = grn.quantityasperparty;
    if (grn.receivedQuantity !== undefined) grn.received = grn.receivedQuantity;

    const received = Number(grn.receivedQuantity || grn.received || 0);
    const asPerParty = Number(grn.quantityasperparty || grn.asPerParty || 0);
    const passed = Number(grn.passed || 0);
    const rejected = Number(grn.rejected || 0);
    const miscellaneous = Number(grn.miscellaneous || 0);

    // Non-blocking warning — do NOT use alert() on blur (it locks focus and blocks further edits)
    let warning = '';
    if (asPerParty > 0 && received > asPerParty) {
      warning = `Row #${grn.sno || ''}: Received (${received}) exceeds As Per Party (${asPerParty}).`;
    } else if (received > 0 && (passed + rejected + miscellaneous) > received) {
      warning = `Row #${grn.sno || ''}: Passed + Rejected + Miscellaneous (${passed + rejected + miscellaneous}) exceeds Received (${received}).`;
    }

    grn.qtyWarning = warning;
    this.stepError = warning;
  }

  navMobClick() {
    if (this.navCollapsedMob && !document.querySelector('app-navigation.coded-navbar')?.classList.contains('mob-open')) {
      this.navCollapsedMob = !this.navCollapsedMob;
      setTimeout(() => {
        this.navCollapsedMob =!this.navCollapsedMob;
      }, 100);
    } else {
      this.navCollapsedMob = !this.navCollapsedMob;
    }
    if (document.querySelector('app-navigation.pc-sidebar')?.classList.contains('navbar-collapsed')) {
      document.querySelector('app-navigation.pc-sidebar')?.classList.remove('navbar-collapsed');
    }
    else{
      document.querySelector('app-navigation.pc-sidebar')?.classList.add('navbar-collapsed');
    }
  }

  Save() {
    // Final submit only from Repair Center — ensure intake + center data are both filled
    if (this.activeTab !== 'center') {
      this.goToRepairCenter();
      return;
    }

    if (!this.validateIntakeStep()) {
      this.activeTab = 'intake';
      return;
    }

    this.filteredGrnList();

    if (this.rows.length === 0) {
      alert("No GRN data to submit.");
      return;
    }
  
    for (const grn of this.rows) {
      const prodId = grn.selectedProduct || (typeof grn.product === 'number' ? grn.product : grn.product?.productId);
      if (!prodId) {
        alert("Please select a product for all rows.");
        return;
      }

      if ((grn.receivedQuantity ?? grn.received) < 0 || (grn.quantityasperparty ?? grn.asPerParty) < 0 || (grn.MRP ?? 0) < 0) {
        alert("Negative values are not allowed.");
        return;
      }
    }

    // Ensure challan list is ready before save/print (Return checkbox, Ret Qty, or rejected return status)
    this.buildChallanList();
  
    // Prepare payload for API (Flattening rows[] back into the original single-table payload shape)
    const payload = {
      grnNumber: this.grnNumber, 
      responsiblePerson: Number(this.selectedResponsiblePerson) || 0,
      dockerNo: this.dockernumber || '',
      Grnstatus: this.selectedgrnstatus || '',
      supplierId: Number(this.selectedsupplier) || 0,
      grnDetails: this.rows.map(grn => ({
        productId: grn.selectedProduct || (typeof grn.product === 'number' ? grn.product : grn.product?.productId || null),
        quantityAsPerParty: Number(grn.quantityasperparty ?? grn.asPerParty ?? 0),
        receivedQuantity: Number(grn.receivedQuantity ?? grn.received ?? 0),
        rejectedQuantity: Number(grn.rejected ?? 0),
        passedQuantity: Number(grn.passed ?? 0),
        miscellaneousQuantity: Number(grn.miscellaneous ?? 0),
        status: grn.status || '',
        demandedbyparty: grn.demandedbyparty || grn.demandedByParty || '',
        mrp: Number(grn.MRP ?? 0),
        batchNumber: grn.batchno || '',
        // Empty string breaks API DateTime binding — send null when not set
        expiryDate: grn.expiryDate ? grn.expiryDate : null,
        remarks1: grn.remarks || '',
        remarks2: grn.remarks2 || '',
        statusofrejected: grn.statusofrejected || '',
        statusofpassed: grn.statusofpassed || '',
        statusofmiscellaneous: grn.statusofmiscellaneous || '',
        approvedbycompany: "y",
        passedstatus: grn.statusofpassed || '',
        rejectedstatus: grn.statusofrejected || '',
        returnToParty: !!(grn.RetrunToParty || grn.returnToParty),
        quantity: Number(grn.retQty ?? 0)
      }))
    };
    this.GrnService.saveGrn(payload).subscribe({
      next: async (response) => {
        alert("GRN submitted successfully! GRN print/download window will open.");
        this.syncDispatchDefaults();
        this.buildChallanList();
        try {
          await this.printGRN();
          
          if (!this.challanList.length) {
            this.challanList = this.rows
              .filter(r => {
                const prodId = r.selectedProduct || (typeof r.product === 'number' ? r.product : r.product?.productId);
                return !!prodId;
              })
              .map(r => ({
                ...r,
                retQty: Number(r.retQty) > 0 ? r.retQty : (Number(r.rejected) > 0 ? r.rejected : (r.receivedQuantity ?? r.received ?? 0))
              }));
          }
          if (this.challanList.length > 0) {
            const downloadChallan = confirm("GRN print complete. Do you want to download/print the Challan as well?");
            if (downloadChallan) {
              this.savechallan();
              await this.printChallan();
            }
          }
        } catch (e) {
          console.error('Print failed:', e);
          alert('GRN saved, but print/PDF failed. You can reprint from Search Old GRN.');
        }
        this.grnList = [];
        window.location.reload();
      },
      error: (error) => {
        console.error("Error submitting GRN:", error);
        const apiMsg = error?.error?.message || error?.error?.error || error?.message || 'Please try again.';
        alert("Failed to submit GRN: " + apiMsg);
      }
    });
  }
  savechallan(){
    const payload = {
      challanNumber: this.challanNumber, 
      GRNNumber: this.grnNumber,
      supplierId: Number(this.selectedsupplier) || 0,
      challanDetails: this.challanList.map(grn => ({
        productId: grn.selectedProduct || (typeof grn.product === 'number' ? grn.product : grn.product?.productId),
        quantity: Number(grn.retQty) > 0 ? Number(grn.retQty) : Number(grn.rejected || 0),
        remarks: grn.remarks || '',
        aproxvalue: Number(grn.MRP ?? grn.mrp ?? 0),
      }))
    };
    this.GrnService.SaveChallan(payload).subscribe({
      next: (response) => {
        // keep challanList until print finishes
      },
      error: (error) => {
        console.error("Error submitting CHALLAN:", error);
        alert("Failed to submit CHALLAN. Please try again.");
      }
    });
    
  }

  /** Rows that belong on Challan: Return ticked, Ret Qty > 0, or reject reason is return-to-party. */
  buildChallanList(): any[] {
    this.challanList = this.rows.filter(grn => {
      const retQty = Number(grn.retQty || 0);
      const rejected = Number(grn.rejected || 0);
      const rejectStatus = String(grn.statusofrejected || '').toLowerCase();
      const isReturnFlag = !!(grn.RetrunToParty || grn.returnToParty);
      const isReturnStatus = rejectStatus.includes('retrun') || rejectStatus.includes('return');
      return isReturnFlag || retQty > 0 || (rejected > 0 && isReturnStatus);
    }).map(grn => {
      const retQty = Number(grn.retQty || 0);
      const rejected = Number(grn.rejected || 0);
      return {
        ...grn,
        retQty: retQty > 0 ? retQty : (rejected > 0 ? rejected : 0),
        RetrunToParty: true,
        returnToParty: true
      };
    });
    return this.challanList;
  }

  filteredGrnList(): any[] {
    // Prefer current challanList (built for print); otherwise rebuild
    if (this.challanList?.length) {
      return this.challanList;
    }
    return this.buildChallanList();
  }

  onReturnQtyChange(grn: any): void {
    if (Number(grn.retQty) > 0) {
      grn.returnToParty = true;
      grn.RetrunToParty = true;
    }
  }

  onRejectStatusChange(grn: any): void {
    const s = String(grn.statusofrejected || '').toLowerCase();
    if (s.includes('retrun') || s.includes('return')) {
      grn.returnToParty = true;
      grn.RetrunToParty = true;
      if (!Number(grn.retQty) && Number(grn.rejected) > 0) {
        grn.retQty = grn.rejected;
      }
    }
  }

  getProductName(productId: string): string {
    const product = this.products.find(p => p.productId === Number(productId));
    return product ? product.name : 'Unknown';
  }
 
  printGRN(): Promise<void> {
    const printContent = document.getElementById('printSection')?.innerHTML;
    if (!printContent) {
      return Promise.resolve();
    }
    const fileName = `GRN-${(this.grnNumber || 'document').replace(/[\\/:*?"<>|]/g, '-')}.pdf`;
    return this.openPrintWindow('Goods Received Note', printContent, fileName);
  }

  printChallan(): Promise<void> {
    const printContent = document.getElementById('printSectionChallan')?.innerHTML;
    if (!printContent) {
      return Promise.resolve();
    }
    const fileName = `Challan-${(this.challanNumber || 'document').toString().replace(/[\\/:*?"<>|]/g, '-')}.pdf`;
    return this.openPrintWindow('Challan', printContent, fileName);
  }

  printGRNPopup(): Promise<void> {
    const printContent = document.getElementById('printSectionpopup')?.innerHTML;
    if (!printContent) {
      return Promise.resolve();
    }
    const fileName = `GRN-${(this.grnListRptoldGrnNo || this.grnNumber || 'document').replace(/[\\/:*?"<>|]/g, '-')}.pdf`;
    return this.openPrintWindow('Goods Received Note', printContent, fileName);
  }

  printChallanOldPopup(): Promise<void> {
    const printContent = document.getElementById('printPOPUPSectionChallan')?.innerHTML;
    if (!printContent) {
      return Promise.resolve();
    }
    const fileName = `Challan-${(this.grnListRptoldchallanno || this.challanNumber || 'document').toString().replace(/[\\/:*?"<>|]/g, '-')}.pdf`;
    return this.openPrintWindow('Challan', printContent, fileName);
  }

  /** Shared print styles — zero @page margin so browser chrome has no room; PDF export bypasses browser headers entirely. */
  private getPrintStyles(): string {
    return `
      @page { size: A4 landscape; margin: 0 !important; }
      @page :left, @page :right, @page :first { margin: 0 !important; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        font-family: Arial, Helvetica, sans-serif;
        color: #161c25;
        font-size: 9px;
      }
      body { padding: 5mm 6mm !important; }
      .grn-print-doc {
        width: 100%;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .grn-print-date { text-align: right; font-size: 9px; margin: 0 0 2px; color: #525b69; }
      .grn-print-header { text-align: center; margin-bottom: 4px; }
      .grn-print-header h2 { margin: 0; font-size: 14px; color: #161c25; line-height: 1.2; }
      .grn-print-header h3 {
        margin: 3px 0 0;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.2px;
        color: #2196f3;
        border-top: 1px solid #2196f3;
        border-bottom: 1px solid #2196f3;
        padding: 2px 0;
        display: inline-block;
        min-width: 55%;
      }
      .grn-print-header p { margin: 0; font-size: 9px; color: #525b69; line-height: 1.25; }
      .grn-print-meta {
        width: 100%;
        border-collapse: collapse;
        margin: 4px 0 6px;
        table-layout: fixed;
      }
      .grn-print-meta td {
        border: 1px solid #90caf9;
        padding: 3px 5px;
        vertical-align: top;
        background: #e3f2fd;
      }
      .grn-print-meta span {
        display: block;
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        color: #525b69;
        margin-bottom: 1px;
      }
      .grn-print-meta strong {
        font-size: 9px;
        color: #161c25;
        word-break: break-word;
      }
      .grn-print-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 8px;
      }
      .grn-print-table th, .grn-print-table td {
        border: 1px solid #90caf9;
        padding: 2px 3px;
        text-align: center;
        vertical-align: middle;
        word-wrap: break-word;
        line-height: 1.2;
      }
      .grn-print-table thead th {
        background: #2196f3 !important;
        color: #fff !important;
        font-weight: 700;
        font-size: 7.5px;
        text-transform: uppercase;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .grn-print-table thead .group-intake,
      .grn-print-table thead .group-repair {
        background: #1c76da !important;
      }
      .grn-print-table .col-sno { width: 28px; }
      .grn-print-table .col-product { width: 120px; }
      .grn-print-table .text-start { text-align: left !important; padding-left: 4px; }
      .grn-print-table .text-end { text-align: right !important; }
      .grn-print-table .text-center { text-align: center !important; }
      .grn-print-table tbody tr:nth-child(even) td { background: #e3f2fd; }
      .grn-print-table tfoot td {
        background: #fff;
        font-size: 9px;
        padding: 3px 5px;
      }
      .grn-print-footer-blocks {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        align-items: start;
        margin-top: 6px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .grn-print-footer-blocks--grn-only { grid-template-columns: 1fr; }
      .grn-print-footer-blocks .grn-print-dispatch { width: 100%; margin-bottom: 0; }
      .grn-print-footer-blocks .grn-print-sign-table { grid-column: 1 / -1; }
      .grn-print-dispatch {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 4px;
        font-size: 8px;
        table-layout: fixed;
      }
      .grn-print-dispatch th, .grn-print-dispatch td {
        border: 1px solid #90caf9;
        padding: 2px 4px;
        vertical-align: middle;
        line-height: 1.2;
      }
      .grn-print-dispatch .section-repair,
      .grn-print-dispatch .section-dispatch {
        background: #2196f3 !important;
        color: #fff !important;
        text-align: left;
        font-size: 8px;
        letter-spacing: 0.2px;
        padding: 3px 4px !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .grn-print-dispatch .lbl-repair,
      .grn-print-dispatch .lbl-dispatch {
        width: 42%;
        color: #1c76da;
        font-weight: 700;
        text-transform: uppercase;
        background: #e3f2fd;
        font-size: 7px;
      }
      .grn-print-dispatch .val-edit input {
        width: 100%;
        border: 1px dashed #90caf9;
        background: #fff;
        padding: 1px 3px;
        font-size: 8px;
        color: #161c25;
        height: 16px;
      }
      .grn-print-dispatch .val-edit .frozen-value {
        display: inline-block;
        width: 100%;
        min-height: 14px;
        border-bottom: 1px solid #90caf9;
        font-size: 8px;
        color: #161c25;
        padding: 1px 2px;
      }
      .grn-print-sign-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 6px;
        font-size: 9px;
        clear: both;
      }
      .grn-print-sign-table td { border: none; padding: 8px 4px 2px; }
      .print-toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding: 10px 12px;
        background: #2196f3;
        color: #fff;
      }
      .print-toolbar button {
        border: 0;
        border-radius: 6px;
        padding: 8px 14px;
        font-weight: 600;
        cursor: pointer;
      }
      .print-toolbar .btn-print { background: #1c76da; color: #fff; }
      .print-toolbar .btn-close-preview { background: #e3f2fd; color: #161c25; }
      .print-toolbar button:disabled { opacity: 0.65; cursor: wait; }
    `;
  }

  /**
   * Preview + download PDF via html2pdf (not browser print).
   * Browser print headers/footers inject localhost URLs — client-side PDF avoids that entirely
   * for both GRN and Challan.
   */
  private openPrintWindow(title: string, bodyHtml: string, fileName: string): Promise<void> {
    const styles = this.getPrintStyles();

    return new Promise((resolve) => {
      const existing = document.getElementById('grn-print-preview-root');
      if (existing) {
        existing.remove();
      }

      const root = document.createElement('div');
      root.id = 'grn-print-preview-root';
      root.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(33,150,243,.25);overflow:auto;';
      root.innerHTML = `
        <div class="print-toolbar">
          <span style="margin-right:auto;font-size:12px;align-self:center;">
            ${title} — edit footer fields if needed, then <b>Download PDF</b> (no browser URL/footer).
          </span>
          <button type="button" class="btn-print" id="grnPrintBtn">Download PDF</button>
          <button type="button" class="btn-close-preview" id="grnClosePreviewBtn">Close</button>
        </div>
        <div id="grnPrintableArea" style="max-width:1100px;margin:16px auto 40px;background:#fff;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.25);">
          ${bodyHtml}
        </div>
        <style>${styles}</style>
      `;
      document.body.appendChild(root);

      let settled = false;
      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        try {
          root.remove();
        } catch { /* ignore */ }
        resolve();
      };

      const printBtn = root.querySelector('#grnPrintBtn') as HTMLButtonElement | null;
      const closeBtn = root.querySelector('#grnClosePreviewBtn') as HTMLButtonElement | null;
      const printable = root.querySelector('#grnPrintableArea') as HTMLElement | null;

      closeBtn?.addEventListener('click', finish);
      printBtn?.addEventListener('click', async () => {
        if (!printable || !printBtn) {
          finish();
          return;
        }
        printBtn.disabled = true;
        printBtn.textContent = 'Generating PDF…';
        try {
          await this.downloadCleanPdf(printable, fileName, styles);
          finish();
        } catch (err) {
          console.error(err);
          printBtn.disabled = false;
          printBtn.textContent = 'Download PDF';
          alert('PDF download failed. Please try again.');
        }
      });
    });
  }

  /** Replace editable inputs with plain text so the PDF captures current values (no localhost URL). */
  private freezeInputsForPdf(source: HTMLElement): HTMLElement {
    const clone = source.cloneNode(true) as HTMLElement;
    const liveControls = Array.from(source.querySelectorAll('input, textarea, select'));
    const cloneControls = Array.from(clone.querySelectorAll('input, textarea, select'));

    cloneControls.forEach((el, index) => {
      const live = liveControls[index] as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | undefined;
      let value = '';
      if (live instanceof HTMLSelectElement) {
        value = live.options[live.selectedIndex]?.text || live.value || '';
      } else if (live instanceof HTMLInputElement && live.type === 'checkbox') {
        value = live.checked ? 'Yes' : '';
      } else if (live) {
        value = (live as HTMLInputElement | HTMLTextAreaElement).value || '';
      }
      const span = document.createElement('span');
      span.className = 'frozen-value';
      span.textContent = value;
      el.replaceWith(span);
    });
    return clone;
  }

  /**
   * Build PDF with html2pdf.js — content + page numbers only.
   * Never uses window.print(), so Chrome/Edge cannot inject localhost / route footers.
   */
  private async downloadCleanPdf(printable: HTMLElement, fileName: string, styles: string): Promise<void> {
    const html2pdfModule: any = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const frozen = this.freezeInputsForPdf(printable);
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-10000px;top:0;width:1100px;background:#fff;z-index:-1;';
    host.innerHTML = `<style>${styles}</style>`;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:5mm 6mm;background:#fff;width:1100px;';
    wrap.appendChild(frozen);
    host.appendChild(wrap);
    document.body.appendChild(host);

    try {
      // Allow layout/styles to apply before canvas capture
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const opt = {
        margin: [8, 8, 12, 8],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1100
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      const worker = html2pdf().set(opt).from(wrap);
      await worker.toPdf();
      const pdf = await worker.get('pdf');
      const total = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(80);
        const w = pdf.internal.pageSize.getWidth();
        const h = pdf.internal.pageSize.getHeight();
        // Page number only — never URL / title / date from the browser
        pdf.text(`Page ${i} of ${total}`, w / 2, h - 5, { align: 'center' });
      }
      pdf.save(fileName);
    } finally {
      try {
        host.remove();
      } catch { /* ignore */ }
    }
  }

  openInfoModal() {
    if (this.supplierInfoModal) {
      const modal = new Modal(this.supplierInfoModal.nativeElement);
      modal.show();
    }
  }  
  openSupplierInfoModal() {
    if (this.supplier2InfoModal) {
      const modal = new Modal(this.supplier2InfoModal.nativeElement);
      modal.show();
    }
  }  
 
  openproductInfoModal(productId: number) {
    
    this.selectedProductDetails = this.products.find(product => product.productId === productId);
    if (this.productInfoModal && this.selectedProductDetails) {
      const modal = new Modal(this.productInfoModal.nativeElement);
      modal.show();
    }
  }

  setQuickDateRange(preset: string): void {
    this.selectedPreset = preset;
    const today = new Date();
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      this.fromDate = formatDateStr(today);
      this.toDate = formatDateStr(today);
    } else if (preset === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 6);
      this.fromDate = formatDateStr(startOfWeek);
      this.toDate = formatDateStr(today);
    } else if (preset === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      this.fromDate = formatDateStr(startOfMonth);
      this.toDate = formatDateStr(today);
    } else if (preset === 'all') {
      this.fromDate = '';
      this.toDate = '';
      this.date = '';
    }
  }

  searchGRN(): void {
    if (this.selectedsupplier2 === '' || this.selectedsupplier2 === null || this.selectedsupplier2 === undefined) {
      alert("Please select a Supplier before searching.");
      return;
    }
  
    if (!this.fromDate && !this.toDate && !this.date) {
      alert("Please select a Date or Date Range before searching.");
      return;
    }

    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      alert("From Date cannot be after To Date.");
      return;
    }
  
    const supplierIdNum = Number(this.selectedsupplier2);
    const params: any = { supplierId: supplierIdNum };

    if (this.fromDate) {
      params.dateFrom = this.formatDate(this.fromDate);
    }
    if (this.toDate) {
      params.dateTo = this.formatDate(this.toDate);
    }
    if (!this.fromDate && !this.toDate && this.date) {
      params.date = this.formatDate(this.date);
    }

    this.GrnService.getGRN(params).subscribe({
      next: (response) => {
        this.grnListrpt = response;
        this.currentPage = 1;
      },
      error: (err) => {
        console.error("Error fetching GRN:", err);
      }
    });
  }

  resetSearch(): void {
    this.selectedsupplier2 = '';
    this.date = '';
    this.fromDate = '';
    this.toDate = '';
    this.selectedPreset = '';
    this.grnListrpt = [];
    this.currentPage = 1;
    this.filteredSuppliers2 = this.suppliers;
  }

  resetNewGRNForm(): void {
    this.selectedsupplier = '';
    this.selectedSupplierName = '';
    this.selectedSupplierDetails = null;
    this.filteredSuppliers = this.suppliers;
    
    this.selectedResponsiblePerson = '';
    this.selectedResponsiblePersonName = null;
    this.selectedRespersonDetails = null;
    this.filteredResponsiblePersons = this.ResponsiblePersons;
    
    this.dockernumber = '';
    
    this.selectedgrnstatus = '';
    this.selectedGRNName = '';
    this.selectedGRNDetails = null;
  }
  
  // Utility function to format the date as 'YYYY-MM-DD' if needed
  private formatDate(date: string): string {
    return new Date(date).toISOString().split('T')[0];
  }

  editGRN(grn: any) {
    debugger
    if (this.grnProductListpopup) {
      this.grnListRptold = [...grn.grndetails];
      this.grnListRptoldSupplierName=grn.supplierName;
      this.grnListRptoldSupplierID=grn.supplierId;
      this.grnListRptoldGrnNo=grn.grnNumber;
      this.grnListRptoldchallanno=grn.challanNumber;
      this.grnListRptoldResponsiblePerson=grn.responsiblePerson;
      this.grnListRptoldgrnStatus=grn.grnStatus;
      debugger
      this.selectedgrnOldstatus=grn.grnStatus;
      this.grnListRptolddokerno=grn.dockerNumber;
      
      this.grnID=grn.id;
      
      this.grnListRptold = this.grnListRptold.map(grn => ({
        ...grn,
        expiryDate: grn.expiryDate ? grn.expiryDate.split('T')[0] : '' // Convert to YYYY-MM-DD
        //expiryDate: (grn.expiryDate === '0001-01-01T00:00:00' || !grn.expiryDate) ? '' : grn.expiryDate.split('T')[0] // Convert to YYYY-MM-DD or empty if default
      }));
      const modal = new Modal(this.grnProductListpopup.nativeElement);
      modal.show();
    }
    
  } 
  
  filteredGrnOldList(): any[] {
    this.challanOldList=this.grnListRptold.filter(grn => grn.returnToParty === true);
    return this.challanOldList;
  }

  updateGrnRow(){
    this.grnListRptold.push({ 
      productId: null ,
      //packSize:'',
      quantityAsPerParty:0,
      receivedQuantity: 0,
      rejectedQuantity:0,
      passedQuantity:0,
      miscellaneousQuantity:0,
      passedstatus:'',
      rejectedstatus:'',
      statusofmiscellaneous:'',
      returnToParty:false,
      quantity:0,
      status:'',
      demandedbyparty:'',
      mrp:0,
      batchNumber:'',
      expiryDate:'',
      remarks1:'',
      remarks2:'',
      statusofrejected:'',
      statusofpassed:'',
     });
  }
  
  removeGrnOldRow(index: number) {
    this.grnListRptold.splice(index, 1);
  }

  getResponsiblePersonIdByName(name: string): number | undefined {
    const person = this.ResponsiblePersons?.find((p: any) => p.name === name);
    return person ? person.id : undefined;
  }

  UpdateoldGRN(){
    this.filteredGrnOldList();
    if (this.grnListRptold.length === 0) {
      alert("No GRN data to submit.");
      return;
    }
  
    for (const grn of this.grnListRptold) {
      if (!grn.productId) {
        alert("Please select a product for all rows.");
        return;
      }
      // if (!grn.packSize || grn.packSize.trim() === '') {
      //   alert("Pack size cannot be empty.");
      //   return;
      // }
      if (grn.receivedQuantity < 0 || grn.quantityAsPerParty < 0 || grn.mrp < 0) {
        alert("Negative values are not allowed.");
        return;
      }
    }
    const responsiblePersonId = this.getResponsiblePersonIdByName(this.grnListRptoldResponsiblePerson);
    const payload = {
      grnNumber: this.grnListRptoldGrnNo, 
      responsiblePerson:responsiblePersonId,
      Grnstatus:this.selectedgrnOldstatus,
      dockerNo:this.grnListRptolddokerno,
      supplierId: this.grnListRptoldSupplierID,
      grnDetails: this.grnListRptold.map(grn => ({
      productId: grn.productId,
        quantityAsPerParty: grn.quantityAsPerParty,
        receivedQuantity: grn.receivedQuantity,
        rejectedQuantity: grn.rejectedQuantity,
        passedQuantity: grn.passedQuantity,
        miscellaneousQuantity: grn.miscellaneousQuantity || 0,
        status: grn.status,
        demandedbyparty:grn.demandedbyparty,
        mrp: grn.mrp,
        batchNumber: grn.batchNumber,
        expiryDate: grn.expiryDate ? grn.expiryDate : null,
        remarks1: grn.remarks1,
        remarks2: grn.remarks2,
        statusofrejected:grn.rejectedstatus,
        statusofpassed:grn.passedstatus,
        statusofmiscellaneous:grn.statusofmiscellaneous || '',
        approvedbycompany:"y",
        passedstatus:grn.passedstatus,
        rejectedstatus:grn.rejectedstatus,
        returnToParty:grn.returnToParty,
        quantity:grn.quantity
      }))
    };

    this.GrnService.UpdateGrn(this.grnID,payload).subscribe({
      next: async (response) => {
        alert("GRN Updated successfully! GRN print/download window will open.");
        try {
          await this.printGRNPopup();
          if (this.challanOldList && this.challanOldList.length > 0) {
            const downloadChallan = confirm("GRN print complete. Do you want to download/print the Challan as well?");
            if (downloadChallan) {
              this.updatechallan();
              await this.printChallanOldPopup();
            }
          }
        } catch (e) {
          console.error('Print failed:', e);
        }
        this.grnListRptold = []; 
        window.location.reload();
      },
      error: (error) => {
        console.error("Error submitting GRN:", error);
        alert("Failed to submit GRN. Please try again.");
      }
    });
  
  }  


  updatechallan(){

    const payload = {
      challanNumber: this.grnListRptoldchallanno, 
      grnNumber: this.grnListRptoldGrnNo, 
      supplierId: this.grnListRptoldSupplierID,
      challanDetails: this.challanOldList.map(grn => ({
        productId: grn.productId,
        quantity: grn.quantity,
        remarks: grn.remarks1,
        aproxvalue: grn.mrp,
      }))
    };

    this.GrnService.updateChallan(Number(this.grnListRptoldchallanno),payload).subscribe({
      next: (response) => {
        this.challanOldList = []; 
      },
      error: (error) => {
        console.error("Error submitting GRN:", error);
        alert("Failed to submit GRN. Please try again.");
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'badge bg-success'; // Green for approved
      case 'pending':
        return 'badge bg-warning'; // Yellow for pending
      case 'rejected':
        return 'badge bg-danger'; // Red for rejected
      default:
        return 'badge bg-secondary'; // Grey for unknown status
    }
  }

  // Method to handle tab changes
  onTabChange(tabId: string) {
    if (tabId === 'center') {
      this.goToRepairCenter();
      return;
    }
    this.stepError = '';
    this.activeTab = tabId;
  }

  /** Validate Product Intake fields, then move to Repair Center step. */
  goToRepairCenter(): void {
    this.stepError = '';
    if (!this.validateIntakeStep()) {
      return;
    }
    this.syncDispatchDefaults();
    this.activeTab = 'center';
  }

  /** Prefill dispatch / stock-repair footer fields from current GRN data (editable). */
  syncDispatchDefaults(): void {
    const supplier = this.selectedSupplierName || '';
    if (!this.stockRepair.stockReceivedParty) {
      this.stockRepair.stockReceivedParty = supplier;
    }
    if (!this.dispatch.stockSentTo) {
      this.dispatch.stockSentTo = supplier;
    }
    if (!this.dispatch.grnNo) {
      this.dispatch.grnNo = this.grnNumber || '';
    }
    if (!this.dispatch.challanInvoiceCreditNote && this.challanNumber) {
      this.dispatch.challanInvoiceCreditNote = `CHALLAN NO:- ${this.challanNumber}`;
    }
    if (!this.stockRepair.dateTime) {
      this.stockRepair.dateTime = this.getLocalDateTimeValue();
    }
  }

  /** Format for input[type=datetime-local]: YYYY-MM-DDTHH:mm */
  getLocalDateTimeValue(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}`;
  }

  backToIntake(): void {
    this.stepError = '';
    this.activeTab = 'intake';
  }

  /** Old logic: only product is required to continue / submit. */
  validateIntakeStep(): boolean {
    if (!this.rows.length) {
      this.stepError = 'Please add at least one product row.';
      return false;
    }

    for (const grn of this.rows) {
      const prodId = grn.selectedProduct ?? (typeof grn.product === 'number' ? grn.product : grn.product?.productId);
      if (prodId === null || prodId === undefined || prodId === '') {
        this.stepError = 'Please select a product for all rows.';
        return false;
      }
      if ((grn.receivedQuantity ?? grn.received ?? 0) < 0 || (grn.quantityasperparty ?? grn.asPerParty ?? 0) < 0) {
        this.stepError = 'Negative quantity values are not allowed.';
        return false;
      }
    }

    this.stepError = '';
    return true;
  }

  
}


