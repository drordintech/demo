import { Component, OnInit ,AfterViewInit} from '@angular/core';
import { SupplierService, Supplier } from '../../master/supplier/supplier.service';
import { grnService,Grn  } from '../../master/grn/grn.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-grnreportsupplierwise',
  standalone: true,
  imports: [FormsModule, CommonModule, NgbDropdownModule],
  templateUrl: './grnreportsupplierwise.component.html',
  styleUrl: './grnreportsupplierwise.component.scss'
})

export class GrnreportsupplierwiseComponent implements OnInit,AfterViewInit {
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  dateTo = '';
  dateFrom = '';
  selectedsupplier = '';
  selectedSupplierName = '';  
  grnList: Grn[] = [];
  groupedGrnList: { supplierName: string, grns: any[], isExpanded?: boolean }[] = [];
  isReportGenerated = false;
  currentDate = new Date();

  constructor(private supplierService: SupplierService,  private grnService: grnService) {}

  ngOnInit() {
    this.loadsuppliers(); 
  }

  ngAfterViewInit() {
    // Modern UI doesn't need bootstrap accordion
  }

  loadsuppliers() {
    this.supplierService.getSuppliers().subscribe(data => {
      this.suppliers = data;
      this.filteredSuppliers = data;
    });
  }

  filterSuppliers(event: any) {
    const search = event.target.value.toLowerCase();
    this.filteredSuppliers = this.suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(search)
    );
  }

  selectSupplier(id: any) {
    this.selectedsupplier = id;
    this.onSupplierChange();
  }

  getSelectedSupplierName(): string {
    if (this.selectedsupplier === '-2') return 'All Suppliers';
    if (!this.selectedsupplier) return 'Choose a supplier...';
    const supplier = this.suppliers.find(s => s.supplierID === +this.selectedsupplier);
    return supplier ? supplier.name : 'Choose a supplier...';
  }

  onSupplierChange() {
    this.selectedSupplierName = this.getSelectedSupplierName();
  }

  canGenerateReport(): boolean {
    return !!this.selectedsupplier && !!this.dateFrom && !!this.dateTo;
  }

  getReport() {
    if (!this.selectedsupplier) {
      alert('Please select a supplier.');
      return;
    }

    if (!this.dateFrom || !this.dateTo) {
      alert('Please select both Date From and Date To.');
      return;
    }

    const fromDate = new Date(this.dateFrom).getTime();
    const toDate = new Date(this.dateTo).getTime();
  
    if (fromDate > toDate) {
      alert('Date From cannot be later than Date To.');
      return;
    }

    const reportParams = {
      supplierId: this.selectedsupplier,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo
    };

    this.grnService.getGrnReport(reportParams).subscribe({
      next: (response) => {
        this.grnList = response;
        console.log('Report Data:', response);

        const groupedData = this.grnList.reduce((acc, grn) => {
          const key = grn.supplierName;
          if (!acc[key]) {
            acc[key] = { supplierName: key, grns: [], isExpanded: false };
          }
          // Add isExpanded property to each GRN
          const grnWithExpanded = { ...grn, isExpanded: false };
          acc[key].grns.push(grnWithExpanded);
          return acc;
        }, {} as { [key: string]: { supplierName: string, grns: any[], isExpanded?: boolean } });
    
        this.groupedGrnList = Object.values(groupedData);
        this.isReportGenerated = true; 

      },
      error: (error) => {
        console.error('Error fetching report:', error);
      }
    });
  }

  toggleSupplier(index: number) {
    this.groupedGrnList[index].isExpanded = !this.groupedGrnList[index].isExpanded;
  }

  toggleGrn(supplierIndex: number, grnIndex: number) {
    this.groupedGrnList[supplierIndex].grns[grnIndex].isExpanded = 
      !this.groupedGrnList[supplierIndex].grns[grnIndex].isExpanded;
  }

  getTotalGrns(): number {
    return this.groupedGrnList.reduce((total, group) => total + group.grns.length, 0);
  }

  getSupplierDateRange(group: any): string {
    if (!group.grns || group.grns.length === 0) return 'No dates';
    
    const dates = group.grns.map((grn: any) => new Date(grn.createdAt));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    if (minDate.toDateString() === maxDate.toDateString()) {
      return minDate.toLocaleDateString();
    }
    
    return `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getPrint(): void {
    const printContent = document.querySelector('.results-section');
    if (!printContent) {
      console.error('Print content not found');
      return;
    }
    
    const printWindow = window.open('', '', 'width=900,height=600');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }
  
    printWindow.document.write(`
      <html>
      <head>
        <title>GRN Report - Supplier Wise</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 20px; 
            background: white;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 1rem;
          }
          .table, .table th, .table td { 
            border: 1px solid #dee2e6; 
          }
          .table th, .table td { 
            padding: 8px; 
            text-align: left; 
            font-size: 12px;
          }
          .table th {
            background-color: #f8f9fa;
            font-weight: 600;
          }
          .supplier-header {
            background-color: #e9ecef;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
          }
          .grn-header {
            background-color: #f8f9fa;
            padding: 8px;
            margin-bottom: 5px;
            border-radius: 3px;
          }
          h1, h2, h3, h4 {
            color: #333;
          }
        </style>
      </head>
      <body>
        <h2 class="text-center mb-4">GRN Report - Supplier Wise</h2>
        <div class="mb-3">
          <strong>Report Period:</strong> ${this.dateFrom} to ${this.dateTo}<br>
          <strong>Generated On:</strong> ${new Date().toLocaleString()}
        </div>
        ${printContent.innerHTML}
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function () { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }
}
