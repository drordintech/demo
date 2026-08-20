import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  intake: ['sno', 'product', 'asPerParty', 'received', 'shortageQty'],
  center: [
    'sno', 'product', 'received', 'shortageQty', 'passed', 'rejected', 'miscellaneous', 'status',
    'returnToParty', 'retQty', 'remarks'
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
  shortageQty?: number;
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
  @ViewChild('submitSuccessModal') submitSuccessModal!: ElementRef;
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
  invoiceReceiptImage: string | null = null;
  invoiceDocuments: any[] = [];
  grnListRptoldInvoiceReceiptImage: string = '';
  grnListRptoldDocuments: any[] = [];
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
  set grnList(val: GrnRow[]) {
    this.rows = val;
    this.refreshRowProducts();
  }
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

  getTotalRepairedItems(): number {
    if (!this.rows || this.rows.length === 0) return 0;
    const totalQty = this.rows.reduce((sum, row) => sum + (Number(row.receivedQuantity) || 0), 0);
    return totalQty > 0 ? totalQty : this.rows.length;
  }

  getStockInventoryValue(): number {
    if (!this.rows || this.rows.length === 0) return 0;
    return this.rows.reduce((sum, row) => {
      const price = Number(row.MRP) || Number((row as any).mrp) || Number((row.product as any)?.MRP) || Number((row.product as any)?.mrp) || 0;
      const qty = Number(row.receivedQuantity) || 1;
      return sum + (price * qty);
    }, 0);
  }

  getNetPayable(): number {
    const value = this.getStockInventoryValue();
    return Math.round(value * 1.18);
  }

  constructor(
      private GrnService: grnService,
      private supplierService:SupplierService,
      private productService: productService,
      private sanitizer: DomSanitizer
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
    this.fetchStockRepairDefaults();
  }

  isStockRepairManuallyEdited: boolean = false;
  stockRepairAutoFillMessage: string = '';
  private stockRepairSessionCache: Map<string, any> = new Map();

  onStockRepairManualEdit(): void {
    this.isStockRepairManuallyEdited = true;
    this.stockRepairAutoFillMessage = '';
  }

  fetchStockRepairDefaults(): void {
    this.stockRepairAutoFillMessage = '';
    const payload = {
      supplierId: Number(this.selectedsupplier) || 0,
      responsiblePerson: Number(this.selectedResponsiblePerson) || null,
      dockerNumber: this.dockernumber || null,
      grnStatus: this.selectedgrnstatus || null
    };

    if (payload.supplierId <= 0) return;

    const cacheKey = `${payload.supplierId}_${payload.responsiblePerson || ''}_${payload.dockerNumber || ''}_${payload.grnStatus || ''}`;

    if (this.stockRepairSessionCache.has(cacheKey)) {
      const cachedRes = this.stockRepairSessionCache.get(cacheKey);
      this.applyStockRepairDefaults(cachedRes);
      return;
    }

    this.GrnService.getStockRepairDefaults(payload).subscribe({
      next: (res: any) => {
        console.log('Stock Repair Defaults Response:', res);
        if (res) {
          this.stockRepairSessionCache.set(cacheKey, res);
          this.applyStockRepairDefaults(res);
        }
      },
      error: (err: any) => {
        console.error('Error fetching stock repair defaults:', err);
        this.stockRepairAutoFillMessage = 'Auto-fill unavailable, enter manually';
      }
    });
  }

  private applyStockRepairDefaults(res: any): void {
    if (!res) return;

    if (this.isStockRepairManuallyEdited) {
      const confirmOverwrite = window.confirm(
        'New supplier default values are available. Overwrite your manually entered Stock Repair details?'
      );
      if (!confirmOverwrite) {
        return;
      }
    }

    this.stockRepair.stockReceivedParty = this.cleanValue(res.stockReceivedParty) || this.selectedSupplierName || '';
    this.stockRepair.docketNoDate = this.cleanValue(res.docketNoDate);
    this.stockRepair.transport = this.cleanValue(res.transport);
    this.stockRepair.debitNoteInvoice = this.cleanValue(res.debitNoteInvoice);
    this.stockRepair.dateTime = this.cleanValue(res.dateTime);

    this.isStockRepairManuallyEdited = false;
  }

  private cleanValue(val: any): string {
    if (val === null || val === undefined || val === 'null' || val === 'undefined') {
      return '';
    }
    return String(val).trim();
  }

  isGeneratingExport: boolean = false;

  hasValidProducts(): boolean {
    if (!this.rows || this.rows.length === 0) return false;
    return this.rows.some(r => {
      const rAny = r as any;
      return !!rAny.selectedProduct || !!rAny.product || !!rAny.product_name || !!rAny.productName;
    });
  }

  getFormattedDateForFileName(): string {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}${mm}${yyyy}`;
  }

  downloadPdf(): void {
    if (!this.hasValidProducts()) {
      alert('Minimum requirement: Please select at least one product in the table before downloading.');
      return;
    }

    this.isGeneratingExport = true;
    const isPending = (this.selectedgrnstatus || '').toLowerCase() === 'pending';
    const fileName = `GRN-${this.grnNumber || '1755'}_${this.getFormattedDateForFileName()}.pdf`;

    const printContainer = document.createElement('div');
    printContainer.style.padding = '20px';
    printContainer.style.fontFamily = 'Arial, sans-serif';
    printContainer.style.color = '#333';
    printContainer.style.position = 'relative';

    const draftWatermarkHtml = isPending ? `
      <div style="position: absolute; top: 35%; left: 15%; transform: rotate(-30deg); font-size: 80px; font-weight: 900; color: rgba(220, 53, 69, 0.18); text-transform: uppercase; letter-spacing: 10px; pointer-events: none; z-index: 1000; border: 8px solid rgba(220, 53, 69, 0.18); padding: 10px 40px; border-radius: 12px;">
        DRAFT
      </div>
    ` : '';

    const seenProductIdsPdf = new Set<string>();
    let rowsHtml = '';
    let validPdfRowCount = 0;
    this.rows.forEach((row, index) => {
      const r = row as any;
      const prodVal = r.selectedProduct || r.product;
      const resolvedName = this.getProductName(prodVal) || r.product_name || r.productName || r.name || '';
      if (resolvedName || prodVal) {
        const pName = resolvedName || `Product #${index + 1}`;
        const pKey = `${prodVal || pName}`;
        if (seenProductIdsPdf.has(pKey)) {
          return;
        }
        seenProductIdsPdf.add(pKey);
        validPdfRowCount++;

        const partyQty = r.quantityasperparty || r.asPerParty || r.QuantityAsPerParty || 0;
        const recQty = r.receivedQuantity || r.received || r.ReceivedQuantity || 0;
        const shortage = Math.max(0, Number(partyQty) - Number(recQty));
        const isExcess = Number(recQty) > Number(partyQty) && Number(partyQty) > 0;
        const shortageStyle = isExcess ? 'color: #0369a1;' : (shortage > 0 ? 'color: #b91c1c; background: #fef2f2;' : 'color: #15803d;');
        const shortageDisplay = isExcess ? '0 <span style="background:#0ea5e9;color:#fff;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700;margin-left:3px;">EXCESS</span>' : `${shortage}`;
        rowsHtml += `
          <tr>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${validPdfRowCount}</td>
            <td style="border: 1px solid #ccc; padding: 8px;">${pName}</td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${partyQty}</td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${recQty}</td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: 700; ${shortageStyle}">${shortageDisplay}</td>
          </tr>
        `;
      }
    });

    printContainer.innerHTML = `
      ${draftWatermarkHtml}
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2196f3; padding-bottom: 10px; margin-bottom: 15px;">
        <div>
          <h2 style="margin: 0; color: #1565c0; font-size: 24px;">GOODS RECEIVED NOTE (GRN)</h2>
          <small style="color: #666;">Dr. Odin Enterprise ERP</small>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; font-size: 16px; color: #333;">GRN NO: ${this.grnNumber || 'GRN-1755'}</div>
          <div style="font-size: 12px; color: #666;">Date: ${this.todayDate || new Date().toLocaleString()}</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <tr>
          <td style="padding: 6px 10px; font-weight: bold; width: 20%;">STOCK RECEIVED PARTY:</td>
          <td style="padding: 6px 10px; width: 30%;">${this.stockRepair.stockReceivedParty || this.getSelectedSupplierName(false) || '-'}</td>
          <td style="padding: 6px 10px; font-weight: bold; width: 20%;">GRN STATUS:</td>
          <td style="padding: 6px 10px;"><span style="font-weight: bold; color: ${isPending ? '#dc3545' : '#28a745'};">${this.selectedgrnstatus || 'Pending'}</span></td>
        </tr>
      </table>

      <div style="background: #2196f3; color: white; padding: 6px 10px; font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">
        STOCK REPAIR & SENT TO PARTY AS PER DETAILS
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; border: 1px solid #bbdefb;">
        <tr style="background: #e3f2fd; color: #1565c0; font-weight: bold;">
          <th style="padding: 6px; border: 1px solid #cbd5e1;">RESPONSIBLE PERSON</th>
          <th style="padding: 6px; border: 1px solid #cbd5e1;">DOCKET NO / DATE</th>
          <th style="padding: 6px; border: 1px solid #cbd5e1;">TRANSPORT</th>
          <th style="padding: 6px; border: 1px solid #cbd5e1;">DEBIT / INVOICE NO & DATE</th>
          <th style="padding: 6px; border: 1px solid #cbd5e1;">DATE & TIME</th>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">${this.getSelectedResponsiblePersonName() || '-'}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">${this.stockRepair.docketNoDate || this.dockernumber || '-'}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">${this.stockRepair.transport || '-'}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">${this.stockRepair.debitNoteInvoice || '-'}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">${this.stockRepair.dateTime || '-'}</td>
        </tr>
      </table>

      <div style="background: #2196f3; color: white; padding: 6px 10px; font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">
        PRODUCT INTAKE DETAILS
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px;">
        <thead>
          <tr style="background: #1976d2; color: white;">
            <th style="border: 1px solid #ccc; padding: 8px; width: 8%;">S.NO</th>
            <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">PRODUCT NAME</th>
            <th style="border: 1px solid #ccc; padding: 8px; width: 17%;">QTY AS PER PARTY</th>
            <th style="border: 1px solid #ccc; padding: 8px; width: 17%;">QTY RECEIVED</th>
            <th style="border: 1px solid #ccc; padding: 8px; width: 15%;">SHORTAGE QTY</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 35px; padding-top: 15px; font-size: 11px; font-weight: 500; color: #333;">
        <div>Inspection Done By: ___________________</div>
        <div style="text-align: center;">Authorized Signature: ___________________</div>
        <div style="text-align: right;">Received By: ___________________</div>
      </div>

      <div style="display: flex; justify-content: space-between; border-top: 1px solid #ccc; padding-top: 10px; font-size: 11px; color: #666; margin-top: 20px;">
        <div>Total Products Added: <strong>${validPdfRowCount}</strong></div>
        <div>Generated Timestamp: ${new Date().toLocaleString()}</div>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    import('html2pdf.js').then((html2pdfModule: any) => {
      const html2pdf = (window as any).html2pdf || html2pdfModule.default || html2pdfModule;
      (html2pdf as any)().set(opt).from(printContainer).save().then(() => {
        this.isGeneratingExport = false;
      }).catch(() => {
        this.isGeneratingExport = false;
      });
    }).catch(() => {
      if ((window as any).html2pdf) {
        (window as any).html2pdf().set(opt).from(printContainer).save().then(() => {
          this.isGeneratingExport = false;
        });
      } else {
        this.isGeneratingExport = false;
        alert('Generating PDF file...');
      }
    });
  }

  downloadExcel(): void {
    if (!this.hasValidProducts()) {
      alert('Minimum requirement: Please select at least one product in the table before downloading.');
      return;
    }

    this.isGeneratingExport = true;
    const fileName = `GRN-${this.grnNumber || '1755'}_${this.getFormattedDateForFileName()}.xlsx`;

    const seenProductIdsExcel = new Set<string>();
    let productRowsXml = '';
    let validExcelRowCount = 0;
    this.rows.forEach((row, index) => {
      const r = row as any;
      const prodVal = r.selectedProduct || r.product;
      const resolvedName = this.getProductName(prodVal) || r.product_name || r.productName || r.name || '';
      if (resolvedName || prodVal) {
        const pName = resolvedName || `Product #${index + 1}`;
        const pKey = `${prodVal || pName}`;
        if (seenProductIdsExcel.has(pKey)) {
          return;
        }
        seenProductIdsExcel.add(pKey);
        validExcelRowCount++;

        const partyQty = r.quantityasperparty || r.asPerParty || r.QuantityAsPerParty || 0;
        const recQty = r.receivedQuantity || r.received || r.ReceivedQuantity || 0;
        const shortage = Math.max(0, Number(partyQty) - Number(recQty));
        const isExcess = Number(recQty) > Number(partyQty) && Number(partyQty) > 0;
        const shortageText = isExcess ? '0 (Excess)' : `${shortage}`;
        productRowsXml += `
          <tr>
            <td style="text-align: center; border: 1px solid #cccccc;">${validExcelRowCount}</td>
            <td style="border: 1px solid #cccccc;">${pName}</td>
            <td style="text-align: center; border: 1px solid #cccccc;">${partyQty}</td>
            <td style="text-align: center; border: 1px solid #cccccc;">${recQty}</td>
            <td style="text-align: center; border: 1px solid #cccccc; font-weight: bold; color: ${isExcess ? '#0369a1' : (shortage > 0 ? '#b91c1c' : '#15803d')};">${shortageText}</td>
          </tr>
        `;
      }
    });

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>GRN Export</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      </head>
      <body>
        <table>
          <tr><td colspan="5" style="font-size: 16pt; font-weight: bold; color: #1565c0;">GOODS RECEIVED NOTE (GRN)</td></tr>
          <tr>
            <td><b>GRN No:</b></td><td>${this.grnNumber || 'GRN-1755'}</td>
            <td><b>Date:</b></td><td colspan="2">${this.todayDate || new Date().toLocaleDateString()}</td>
          </tr>
          <tr>
            <td><b>Stock Received Party:</b></td><td>${this.stockRepair.stockReceivedParty || this.getSelectedSupplierName(false) || '-'}</td>
            <td><b>GRN Status:</b></td><td colspan="2">${this.selectedgrnstatus || 'Pending'}</td>
          </tr>
          <tr><td colspan="5"></td></tr>
          <tr style="background-color: #2196f3; color: white; font-weight: bold;">
            <td colspan="5">STOCK REPAIR & SENT TO PARTY AS PER DETAILS</td>
          </tr>
          <tr style="background-color: #e3f2fd; font-weight: bold;">
            <td>Responsible Person</td><td>Docket No / Date</td><td>Transport</td><td colspan="2">Debit / Invoice No & Date</td>
          </tr>
          <tr>
            <td>${this.getSelectedResponsiblePersonName() || '-'}</td>
            <td>${this.stockRepair.docketNoDate || this.dockernumber || '-'}</td>
            <td>${this.stockRepair.transport || '-'}</td>
            <td colspan="2">${this.stockRepair.debitNoteInvoice || '-'}</td>
          </tr>
          <tr><td colspan="5"></td></tr>
          <tr style="background-color: #1976d2; color: white; font-weight: bold;">
            <td>S.No</td><td>Product Name</td><td>Qty As Per Party</td><td>Qty Received</td><td>Shortage Qty</td>
          </tr>
          ${productRowsXml}
          <tr><td colspan="5"></td></tr>
          <tr>
            <td>Inspection Done By: ___________________</td>
            <td colspan="2" style="text-align: center;">Authorized Signature: ___________________</td>
            <td colspan="2" style="text-align: right;">Received By: ___________________</td>
          </tr>
          <tr><td colspan="5"></td></tr>
          <tr>
            <td colspan="2">Total Products Added: ${validExcelRowCount}</td>
            <td colspan="3">Generated Timestamp: ${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.isGeneratingExport = false;
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
    } else {
      const search = grn.searchText.toLowerCase();
      grn.filteredProducts = this.products.filter(
        product => product.name.toLowerCase().includes(search)
      );
    }
  }

  highlightMatch(text: string, search: string): SafeHtml {
    if (!search || !text) {
      return this.sanitizer.bypassSecurityTrustHtml(text || '');
    }
    const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    const highlighted = text.replace(regex, '<span style="background-color: #fff3cd; color: #856404; font-weight: bold; padding: 0 2px; border-radius: 2px;">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
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

  /** Calculate shortage qty for a single row: max(0, asPerParty - received) */
  getShortageQty(grn: any): number {
    const asPerParty = Number(grn.quantityasperparty || grn.asPerParty || 0);
    const received = Number(grn.receivedQuantity || grn.received || 0);
    const diff = asPerParty - received;
    return diff > 0 ? diff : 0;
  }

  /** Check if received > asPerParty (excess delivery) */
  isExcessDelivery(grn: any): boolean {
    const asPerParty = Number(grn.quantityasperparty || grn.asPerParty || 0);
    const received = Number(grn.receivedQuantity || grn.received || 0);
    return received > asPerParty && asPerParty > 0;
  }

  /** Sum shortage across all rows */
  getTotalShortageQty(): number {
    return this.rows.reduce((sum, row) => sum + this.getShortageQty(row), 0);
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
      invoiceReceiptImage: this.invoiceReceiptImage || '',
      documents: this.invoiceDocuments,
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
      next: (response) => {
        this.syncDispatchDefaults();
        this.buildChallanList();

        if (this.challanList.length > 0) {
          this.savechallan();
        }

        if (this.submitSuccessModal) {
          const modal = new Modal(this.submitSuccessModal.nativeElement);
          modal.show();
        } else {
          alert("GRN submitted successfully!");
          window.location.reload();
        }
      },
      error: (error) => {
        console.error("Error submitting GRN:", error);
        const apiMsg = error?.error?.message || error?.error?.error || error?.message || 'Please try again.';
        alert("Failed to submit GRN: " + apiMsg);
      }
    });
  }

  closeSuccessAndReload(): void {
    window.location.reload();
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

  getProductName(productId: any): string {
    if (productId === null || productId === undefined || productId === '') return '';
    if (typeof productId === 'object') {
      return productId.name || productId.productName || productId.product_name || '';
    }
    const product = this.products.find(p => (p as any).productId === Number(productId) || (p as any).id === Number(productId) || String((p as any).productId) === String(productId) || String((p as any).id) === String(productId));
    return product ? product.name : '';
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
      this.grnListRptoldInvoiceReceiptImage = grn.invoiceReceiptImage || '';
      this.grnListRptoldDocuments = [...(grn.documents || [])];
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
      invoiceReceiptImage: this.grnListRptoldInvoiceReceiptImage || '',
      documents: this.grnListRptoldDocuments,
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

  /** Format for input[type=date]: YYYY-MM-DD */
  getLocalDateTimeValue(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

  onInvoiceImageSelected(event: any): void {
    const files = Array.from(event.target.files || []) as File[];
    this.readDocuments(files).then(documents => {
      this.invoiceDocuments = [...this.invoiceDocuments, ...documents];
      if (!this.invoiceReceiptImage && this.invoiceDocuments.length) {
        this.invoiceReceiptImage = this.invoiceDocuments[0].fileContent;
      }
    });
  }

  clearInvoiceImage(): void {
    this.invoiceReceiptImage = null;
    this.invoiceDocuments = [];
    const fileInput = document.getElementById('invoiceImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onEditInvoiceImageSelected(event: any): void {
    const files = Array.from(event.target.files || []) as File[];
    this.readDocuments(files).then(documents => {
      this.grnListRptoldDocuments = [...this.grnListRptoldDocuments, ...documents];
      if (!this.grnListRptoldInvoiceReceiptImage && this.grnListRptoldDocuments.length) {
        this.grnListRptoldInvoiceReceiptImage = this.grnListRptoldDocuments[0].fileContent;
      }
    });
  }

  clearEditInvoiceImage(): void {
    this.grnListRptoldInvoiceReceiptImage = '';
    this.grnListRptoldDocuments = [];
    const fileInput = document.getElementById('editInvoiceImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  viewReceiptImage(imageUrl: string): void {
    if (imageUrl) {
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`<img src="${imageUrl}" style="max-width:100%; height:auto;" />`);
      }
    }
  }

  private readDocuments(files: File[]): Promise<any[]> {
    return Promise.all(files.map(file => new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ fileName: file.name, contentType: file.type || 'application/octet-stream', fileContent: reader.result as string });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
  }

  removeInvoiceDocument(index: number, isEdit = false): void {
    const documents = isEdit ? this.grnListRptoldDocuments : this.invoiceDocuments;
    documents.splice(index, 1);
    if (isEdit) {
      this.grnListRptoldInvoiceReceiptImage = documents[0]?.fileContent || '';
    } else {
      this.invoiceReceiptImage = documents[0]?.fileContent || null;
    }
  }

  downloadDocument(document: any): void {
    if (!document?.fileContent) return;
    const link = window.document.createElement('a');
    link.href = document.fileContent;
    link.download = document.fileName || 'grn-document';
    link.click();
  }

  openDocument(document: any): void {
    if (!document?.fileContent) return;
    const newTab = window.open(document.fileContent, '_blank', 'noopener,noreferrer');
    if (!newTab) {
      this.downloadDocument(document);
    }
  }

}


