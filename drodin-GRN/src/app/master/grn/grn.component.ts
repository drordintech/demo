import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbNavModule, NgbModal, NgbDatepickerModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { Modal } from 'bootstrap';
import { product, productService } from '../product/product.service';
import { Supplier, SupplierService } from '../supplier/supplier.service';
import { grnService } from './grn.service';

@Component({
  selector: 'app-grn',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbNavModule, SharedModule, NgbDatepickerModule, NgbDropdownModule],
  templateUrl: './grn.component.html',
  styleUrls: ['./grn.component.scss']
})

export class grnComponent implements OnInit {
  @ViewChild('supplierInfoModal') supplierInfoModal!: ElementRef;
  @ViewChild('supplier2InfoModal') supplier2InfoModal!: ElementRef;
  @ViewChild('productInfoModal') productInfoModal!: ElementRef;
  @ViewChild('grnProductListpopup') grnProductListpopup!: ElementRef;
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
  ResponsiblePersons: any[] = [];
  grnList: any[] = [];    challanList: any[] = [];  challanOldList: any[] = [];
  grnListrpt: any[] = [];
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

  grnstatus = [
    { id: 1, name: 'Pending ' },
    { id: 2, name: 'Complete' },
  ];

  date = '';
  searchText: string = '';
  activeTab: string = 'home'; // Track active tab

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

  loadsuppliers() {
    this.supplierService.getSuppliers().subscribe((data) => {
      this.suppliers = data;
      this.filteredSuppliers = data;
      this.filteredSuppliers2 = data;
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
    if (!selectedId) return 'Select Supplier';
    const supplier = this.suppliers.find(s => s.supplierID === +selectedId);
    return supplier ? supplier.name : 'Select Supplier';
  }
  
  loadResponsiblePerson() {
    this.supplierService.getloadResponsiblePerson().subscribe((data) => {
      
      this.ResponsiblePersons = data;
    });
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

    // const selectedResponsiblePerson = this.ResponsiblePersons.find(a => a.id === Number(this.selectedResponsiblePerson));
    // this.selectedResponsiblePersonname = selectedResponsiblePerson ? selectedResponsiblePerson.name : '';
    // this.selectedResponsiblePersondetail = this.selectedResponsiblePersonname;
  }

  onSupplierChange2() {
    const selectedSupplier = this.suppliers.find(supplier => supplier.supplierID === Number(this.selectedsupplier2));
    this.selectedSupplierName2 = selectedSupplier ? selectedSupplier.name : '';
    this.selectedSupplierDetails2 = selectedSupplier;
  }
 
  loadproducts() {
    this.productService.getproducts().subscribe((data) => {
      this.products = data;
    });
  }
  
  filterProducts(grn: any) {
    if (!grn.searchText) {
      grn.filteredProducts = [...this.products]; // Reset to full list
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
    this.grnList.push({ 
      selectedProduct: null ,
      searchText:'',
      quantityasperparty:0,
      receivedQuantity: 0,
      rejected:0,
      passed:0,
      status:'',
      demandedbyparty:'',
      MRP:0,
      batchno:'',
      dateofexpiry:'',
      remarks:'',
      remarks2:'' ,
      statusofrejected:'',
      statusofpassed:'',
      RetrunToParty:false,
      retQty:0,
    });

      this.grnList = this.grnList.map(grn => ({
        ...grn,
        filteredProducts: [...this.products] 
      }));

  }

  removeGrnRow(index: number) {
    this.grnList.splice(index, 1);
  }
  
  updateQuantity(grn: any) {
    if (grn.receivedQuantity < 0) {
      alert('Warning: Quantity is negative!');
    }
    if (grn.quantityasperparty < 0) {
      alert('Warning: Quantity is negative!');
    }
    if (grn.MRP < 0) {
      alert('Warning: MRP is negative!');
    }
    if (grn.passed < 0) {
      alert('Warning: Passed quantity is negative!');
    }
    if (grn.passed < 0) {
      alert('Warning: Passed quantity is negative!');
    }
    if (grn.rejected < 0) {
      alert('Warning: Rejected quantity is negative!');
    }
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
debugger
    this.filteredGrnList();

    if (this.grnList.length === 0) {
      alert("No GRN data to submit.");
      return;
    }
  
    for (const grn of this.grnList) {
      if (!grn.selectedProduct) {
        alert("Please select a product for all rows.");
        return;
      }
      
      // if (!grn.packsize || grn.packsize.trim() === '') {
      //   alert("Pack size cannot be empty.");
      //   return;
      // }

      if (grn.receivedQuantity < 0 || grn.quantityasperparty < 0 || grn.MRP < 0) {
        alert("Negative values are not allowed.");
        return;
      }
    }
  
    // Prepare payload for API
    const payload = {
      grnNumber: this.grnNumber, 
      responsiblePerson:Number(this.selectedResponsiblePerson),
      dockerNo:this.dockernumber,
      Grnstatus:this.selectedgrnstatus,
      supplierId: this.selectedsupplier,
      grnDetails: this.grnList.map(grn => ({
        productId: grn.selectedProduct,
        quantityAsPerParty: grn.quantityasperparty,
        receivedQuantity: grn.receivedQuantity,
        rejectedQuantity: grn.rejected,
        passedQuantity: grn.passed,
        status: grn.status,
        demandedbyparty:grn.demandedbyparty,
        mrp: grn.MRP,
        batchNumber: grn.batchno,
        expiryDate: grn.expiryDate,
        remarks1: grn.remarks,
        remarks2: grn.remarks2,
        statusofrejected:grn.statusofrejected,
        statusofpassed:grn.statusofpassed,
        approvedbycompany:"y",
        passedstatus:grn.statusofpassed,
        rejectedstatus:grn.statusofrejected,
        returnToParty:grn.RetrunToParty,
        quantity:grn.retQty
      }))
    };
    this.GrnService.saveGrn(payload).subscribe({
      next: (response) => {
        alert("GRN submitted successfully!");
        this.printGRN();
        debugger
        if (this.challanList && this.challanList.length > 0) {
          this.savechallan();
          this.printChallan();
        }

        this.grnList = []; 
        window.location.reload();
      },
      error: (error) => {
        console.error("Error submitting GRN:", error);
        alert("Failed to submit GRN. Please try again.");
      }
    });
  }
  savechallan(){
debugger
    const payload = {
      challanNumber: this.challanNumber, 
      GRNNumber:this.grnNumber,
      supplierId: Number(this.selectedsupplier),
      challanDetails: this.challanList.map(grn => ({
        productId: grn.selectedProduct,
        quantity: grn.retQty,
        remarks: grn.remarks,
        aproxvalue: grn.MRP,
      }))
    };
    this.GrnService.SaveChallan(payload).subscribe({
      next: (response) => {
        this.challanList = []; 
      },
      error: (error) => {
        console.error("Error submitting CHALLAN:", error);
        alert("Failed to submit CHALLAN. Please try again.");
      }
    });
    
  }

  filteredGrnList(): any[] {
    this.challanList=this.grnList.filter(grn => grn.RetrunToParty === true);
    return this.challanList;
  }

  getProductName(productId: string): string {
    const product = this.products.find(p => p.productId === Number(productId));
    return product ? product.name : 'Unknown';
  }
 
  printGRN() {
    const printContent = document.getElementById('printSection')?.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `<html><head><title>GRN</title>
    <link rel="stylesheet" href="styles.css">
    </head><body>${printContent}</body></html>`;
    window.print();
    document.body.innerHTML = originalContent;
   // window.location.reload();  // Reload page to restore original content
  }

  printChallan() {
    const printContent = document.getElementById('printSectionChallan')?.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `<html><head><title>Challan</title>
    <link rel="stylesheet" href="styles.css">
    </head><body>${printContent}</body></html>`;
    window.print();
    document.body.innerHTML = originalContent;
    //window.location.reload();  // Reload page to restore original content
  }
  
  printGRNPopup() {
    const printContent = document.getElementById('printSectionpopup')?.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `<html><head><title>Print GRN</title>
    <link rel="stylesheet" href="styles.css">
    </head><body>${printContent}</body></html>`;
    window.print();
    document.body.innerHTML = originalContent;
    //window.location.reload();  // Reload page to restore original content
  }
  
  printChallanOldPopup() {
    const printContent = document.getElementById('printPOPUPSectionChallan')?.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `<html><head><title>Challan</title>
    <link rel="stylesheet" href="styles.css">
    </head><body>${printContent}</body></html>`;
    window.print();
    document.body.innerHTML = originalContent;
    //window.location.reload();  // Reload page to restore original content
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

  searchGRN(): void {

    if (!this.selectedsupplier2 || !this.date) {
      alert("Please select both Supplier and Date before searching.");
      return;
    }
  
    const formattedDate = this.formatDate(this.date);
    const params = { supplierId: this.selectedsupplier2, date: formattedDate };
  
    this.GrnService.getGRN(params).subscribe({
      next: (response) => {
        
        this.grnListrpt = response;
      },
      error: (err) => {
        console.error("Error fetching GRN:", err);
      }
    });
  }

  resetSearch(): void {
    this.selectedsupplier2 = '';
    this.date = '';
    this.grnListrpt = [];
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
      passedstatus:'',
      rejectedstatus:'',
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
        status: grn.status,
        demandedbyparty:grn.demandedbyparty,
        mrp: grn.mrp,
        batchNumber: grn.batchNumber,
        expiryDate: grn.expiryDate,
        remarks1: grn.remarks1,
        remarks2: grn.remarks2,
        statusofrejected:grn.rejectedstatus,
        statusofpassed:grn.passedstatus,
        approvedbycompany:"y",
        passedstatus:grn.passedstatus,
        rejectedstatus:grn.rejectedstatus,
        returnToParty:grn.returnToParty,
        quantity:grn.quantity
      }))
    };

    this.GrnService.UpdateGrn(this.grnID,payload).subscribe({
      next: (response) => {
        alert("GRN Updated successfully!");
        this.printGRNPopup();
        if (this.challanOldList && this.challanOldList.length > 0) {
          this.updatechallan();
          this.printChallanOldPopup();
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
    this.activeTab = tabId;
  }

  
}


