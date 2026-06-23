import { Component, OnInit, AfterViewInit } from '@angular/core';
import { SupplierService, Supplier } from '../../master/supplier/supplier.service';
import { grnService, Grn } from '../../master/grn/grn.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
declare var bootstrap: any;

@Component({
  selector: 'app-grnreportPersonwise',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './grnreportPersonwise.component.html',
  styleUrl: './grnreportPersonwise.component.scss'
})

export class GrnreportPersonwiseComponent implements OnInit, AfterViewInit {
  suppliers: Supplier[] = [];
  dateTo = '';
  dateFrom = '';
  selectedsupplier = '';
  selectedState = '';
  selectedResponsiblePerson = '';
  selectedSupplierName = '';
  grnList: Grn[] = [];
  states: any[] = [];
  ResponsiblePersons: any[] = [];
  groupedGrnList: { supplierName: string, grns: any[] }[] = [];
  isReportGenerated = false;
  isLoading = false;

  // Validation flags
  showPersonError = false;
  showDateFromError = false;
  showDateToError = false;

  // Expansion tracking
  expandedSuppliers = new Set<number>();
  expandedGrns = new Set<string>();

  constructor(private supplierService: SupplierService, private grnService: grnService) {}

  ngOnInit() {
    this.getResponsiblePersons();
  }

  getResponsiblePersons() {
    this.supplierService.getloadResponsiblePerson().subscribe((data) => {
      this.ResponsiblePersons = data;
    });
  }

  ngAfterViewInit() {
    // Modern component doesn't need bootstrap accordion
  }

  loadsuppliers() {
    this.supplierService.getSuppliers().subscribe(data => this.suppliers = data);
  }

  onSupplierChange() {
    this.selectedSupplierName = this.suppliers.find(s => s.supplierID === +this.selectedsupplier)?.name || '';
  }

  // Toggle supplier expansion
  toggleSupplierExpansion(index: number) {
    if (this.expandedSuppliers.has(index)) {
      this.expandedSuppliers.delete(index);
    } else {
      this.expandedSuppliers.add(index);
    }
  }

  // Toggle GRN expansion
  toggleGrnExpansion(supplierIndex: number, grnIndex: number) {
    const key = supplierIndex + '-' + grnIndex;
    if (this.expandedGrns.has(key)) {
      this.expandedGrns.delete(key);
    } else {
      this.expandedGrns.add(key);
    }
  }

  // Get total number of GRNs
  getTotalGrns(): number {
    return this.groupedGrnList.reduce((total, group) => total + group.grns.length, 0);
  }

  // Get selected person name
  getSelectedPersonName(): string {
    if (this.selectedResponsiblePerson === '-2') {
      return 'All Responsible Persons';
    }
    const person = this.ResponsiblePersons.find(rp => rp.id === this.selectedResponsiblePerson);
    return person ? person.name : 'Unknown Person';
  }

  // Get supplier date range
  getSupplierDateRange(group: any): string {
    if (!group.grns || group.grns.length === 0) return '';
    
    const dates = group.grns.map((grn: any) => new Date(grn.createdAt));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    if (minDate.toDateString() === maxDate.toDateString()) {
      return minDate.toLocaleDateString();
    }
    
    return `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
  }

  // Clear validation errors
  clearValidationErrors() {
    this.showPersonError = false;
    this.showDateFromError = false;
    this.showDateToError = false;
  }

  // Validate form
  validateForm(): boolean {
    this.clearValidationErrors();
    let isValid = true;

    if (!this.selectedResponsiblePerson) {
      this.showPersonError = true;
      isValid = false;
    }

    if (!this.dateFrom) {
      this.showDateFromError = true;
      isValid = false;
    }

    if (!this.dateTo) {
      this.showDateToError = true;
      isValid = false;
    }

    if (this.dateFrom && this.dateTo) {
      const fromDate = new Date(this.dateFrom).getTime();
      const toDate = new Date(this.dateTo).getTime();

      if (fromDate > toDate) {
        alert('Date From cannot be later than Date To.');
        isValid = false;
      }
    }

    return isValid;
  }

  getReport() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.isReportGenerated = false;

    const reportParams = {
      PersonId: this.selectedResponsiblePerson,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo
    };

    this.grnService.getGrnReportByResponsiblePerson(reportParams).subscribe({
      next: (response) => {
        this.grnList = response;
        console.log('Report Data:', response);

        const groupedData = this.grnList.reduce((acc, grn) => {
          const key = grn.supplierName;
          if (!acc[key]) {
            acc[key] = { supplierName: key, grns: [] };
          }
          acc[key].grns.push(grn);
          return acc;
        }, {} as { [key: string]: { supplierName: string, grns: any[] } });

        this.groupedGrnList = Object.values(groupedData);
        this.isReportGenerated = true;
        this.isLoading = false;

        // Auto-expand first supplier
        if (this.groupedGrnList.length > 0) {
          this.expandedSuppliers.add(0);
        }
      },
      error: (error) => {
        console.error('Error fetching report:', error);
        this.isLoading = false;
        alert('Error generating report. Please try again.');
      }
    });
  }

  getStatusClass(status: string): string {
    return `badge-${status}`;
  }

  getPrint(): void {
    const printContent = document.getElementById('accordionExample');
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
        <title>GRN Report Person Wise</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .table { width: 100%; border-collapse: collapse; }
          .table, .table th, .table td { border: 1px solid black; }
          .table th, .table td { padding: 8px; text-align: left; }
          .report-header { text-align: center; margin-bottom: 20px; }
          .report-title { color: #333; font-size: 24px; }
          .report-subtitle { color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1 class="report-title">GRN Report Person Wise</h1>
          <p class="report-subtitle">Generated on ${new Date().toLocaleDateString()}</p>
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
