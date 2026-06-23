// Angular Import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { BajajChartComponent } from './bajaj-chart/bajaj-chart.component';
import { GoogleChartsModule } from 'angular-google-charts';
import { ChartType } from 'angular-google-charts';
import { grnService,Grn  } from '../../master/grn/grn.service';
import { SupplierService, Supplier } from '../../master/supplier/supplier.service';

@Component({
  selector: 'app-default',
  standalone: true,
  imports: [CommonModule, SharedModule, GoogleChartsModule, BajajChartComponent, ReactiveFormsModule],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent {
  constructor( 
    private grnService: grnService,
    private supplierService: SupplierService,
    private fb: FormBuilder,
    private router: Router
  ) {}
  
  // Dashboard properties
  currentDate = new Date();
  top10rejectedproducts: any[] = [];
  rejectedstate: any[] = [];
  
  // Filter properties
  suppliers: Supplier[] = [];
  selectedSupplier: number | null = null;
  selectedDateFrom: string = '';
  selectedDateTo: string = '';
  filterForm: FormGroup;
  isLoadingSuppliers: boolean = false;
  
  // Report properties
  grnList: any[] = [];
  groupedGrnList: any[] = [];
  isReportGenerated: boolean = false;
  
  // title = 'State wise Report';
  type: ChartType = ChartType.BarChart;

  // Modern chart options
  modernOptions = {
    hAxis: { 
      title: 'Rejected Quantity',
      textStyle: {
        color: '#666',
        fontSize: 12
      },
      titleTextStyle: {
        color: '#333',
        fontSize: 14,
        bold: true
      }
    },
    vAxis: { 
      title: 'State',
      textStyle: {
        color: '#666',
        fontSize: 12
      },
      titleTextStyle: {
        color: '#333',
        fontSize: 14,
        bold: true
      }
    },
    colors: ['#667eea'],
    bars: 'horizontal',
    backgroundColor: 'transparent',
    chartArea: {
      backgroundColor: 'transparent'
    },
    legend: {
      position: 'none'
    },
    animation: {
      startup: true,
      duration: 1000,
      easing: 'out'
    }
  };

  modernOptionsReturn = {
    hAxis: { 
      title: 'No of times returned',
      textStyle: {
        color: '#666',
        fontSize: 12
      },
      titleTextStyle: {
        color: '#333',
        fontSize: 14,
        bold: true
      }
    },
    vAxis: { 
      title: 'Product Name',
      textStyle: {
        color: '#666',
        fontSize: 12
      },
      titleTextStyle: {
        color: '#333',
        fontSize: 14,
        bold: true
      }
    },
    colors: ['#764ba2'],
    bars: 'horizontal',
    backgroundColor: 'transparent',
    chartArea: {
      backgroundColor: 'transparent'
    },
    legend: {
      position: 'none'
    },
    animation: {
      startup: true,
      duration: 1000,
      easing: 'out'
    }
  };

  // Original options (keeping for backward compatibility)
  options = {
    hAxis: { title: 'Rejected Quantity'},
    vAxis: { title: 'State' },
    colors: ['#ae93df'],
    bars: 'horizontal'
  };

  optionsretrun = {
    hAxis: { title: 'No of times retrun' },
    vAxis: { title: 'Product Name' },
            colors: ['#2196f3'],
    bars: 'horizontal'
  };

  width = 600;
  height = 400;

  // public method
  ListGroup = [
    {
      name: 'Bajaj Finery',
      profit: '10% Profit',
      invest: '$1839.00',
      bgColor: 'bg-light-success',
      icon: 'ti ti-chevron-up',
      color: 'text-success'
    },
    {
      name: 'TTML',
      profit: '10% Loss',
      invest: '$100.00',
      bgColor: 'bg-light-danger',
      icon: 'ti ti-chevron-down',
      color: 'text-danger'
    },
    {
      name: 'Reliance',
      profit: '10% Profit',
      invest: '$200.00',
      bgColor: 'bg-light-success',
      icon: 'ti ti-chevron-up',
      color: 'text-success'
    },
    {
      name: 'ATGL',
      profit: '10% Loss',
      invest: '$189.00',
      bgColor: 'bg-light-danger',
      icon: 'ti ti-chevron-down',
      color: 'text-danger'
    },
    {
      name: 'Stolon',
      profit: '10% Profit',
      invest: '$210.00',
      bgColor: 'bg-light-success',
      icon: 'ti ti-chevron-up',
      color: 'text-success',
      space: 'pb-0'
    }
  ];

  profileCard = [
    {
      style: 'bg-primary-dark text-white',
      background: 'bg-primary',
      value: '$203k',
      text: 'Net Profit',
      color: 'text-white',
      value_color: 'text-white'
    },
    {
      background: 'bg-warning',
      avatar_background: 'bg-light-warning',
      value: '$550K',
      text: 'Total Revenue',
      color: 'text-warning'
    }
  ];

  ngOnInit() {
    this.initializeFilterForm();
    this.loadSuppliers();
    this.toprejectedproducts(); 
  }

  initializeFilterForm() {
    this.filterForm = this.fb.group({
      supplier: [null],
      dateFrom: [''],
      dateTo: ['']
    });

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.selectedDateFrom = thirtyDaysAgo.toISOString().split('T')[0];
    this.selectedDateTo = today.toISOString().split('T')[0];
    
    this.filterForm.patchValue({
      dateFrom: this.selectedDateFrom,
      dateTo: this.selectedDateTo
    });
  }

  loadSuppliers() {
    this.isLoadingSuppliers = true;
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.isLoadingSuppliers = false;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.isLoadingSuppliers = false;
      }
    });
  }

  onFilterChange() {
    // Apply filters and refresh data
    this.selectedSupplier = this.filterForm.get('supplier')?.value;
    this.selectedDateFrom = this.filterForm.get('dateFrom')?.value;
    this.selectedDateTo = this.filterForm.get('dateTo')?.value;
    
    // Refresh dashboard data with filters
    this.toprejectedproducts();
  }

  getReport() {
    // Get values from the form
    const supplierId = this.filterForm.get('supplier')?.value;
    const dateFrom = this.filterForm.get('dateFrom')?.value;
    const dateTo = this.filterForm.get('dateTo')?.value;

    // Allow empty string for "All Suppliers" but check if supplierId is undefined or null
    if (supplierId === undefined || supplierId === null) {
      alert('Please select a supplier.');
      return;
    }

    if (!dateFrom || !dateTo) {
      alert('Please select both Date From and Date To.');
      return;
    }

    const fromDate = new Date(dateFrom).getTime();
    const toDate = new Date(dateTo).getTime();
  
    if (fromDate > toDate) {
      alert('Date From cannot be later than Date To.');
      return;
    }

    // Update the component properties
    this.selectedSupplier = supplierId;
    this.selectedDateFrom = dateFrom;
    this.selectedDateTo = dateTo;

    const reportParams = {
      supplierId: supplierId,
      dateFrom: dateFrom,
      dateTo: dateTo
    };

    this.grnService.getGrnReport(reportParams).subscribe({
      next: (response) => {
        this.grnList = response;
        console.log('Report Data:', response);

        const groupedData = this.grnList.reduce((acc, grn) => {
          const key = grn.supplierName;
          if (!acc[key]) {
            acc[key] = { 
              supplierName: key, 
              grns: [], 
              isExpanded: false,
              pendingCount: 0,
              completedCount: 0,
              totalCount: 0
            };
          }
          // Add isExpanded property to each GRN
          const grnWithExpanded = { ...grn, isExpanded: false };
          acc[key].grns.push(grnWithExpanded);
          
          // Count status - handle both with and without trailing spaces
          acc[key].totalCount++;
          const status = grn.grnStatus?.trim(); // Remove any trailing spaces
          console.log(`GRN ${grn.grnNumber} status: "${grn.grnStatus}" -> trimmed: "${status}"`);
          
          if (status === 'Pending') {
            acc[key].pendingCount++;
          } else if (status === 'Complete') {
            acc[key].completedCount++;
          }
          
          return acc;
        }, {} as { [key: string]: { 
          supplierName: string, 
          grns: any[], 
          isExpanded?: boolean,
          pendingCount: number,
          completedCount: number,
          totalCount: number
        } });
    
        this.groupedGrnList = Object.values(groupedData);
        this.isReportGenerated = true; 

      },
      error: (error) => {
        console.error('Error fetching report:', error);
      }
    });
  }

  clearFilters() {
    this.filterForm.patchValue({
      supplier: null,
      dateFrom: this.selectedDateFrom,
      dateTo: this.selectedDateTo
    });
    this.selectedSupplier = null;
    this.toprejectedproducts();
  }

  toprejectedproducts() {
    // Add filter parameters to API calls if needed
    this.grnService.gettoprejectedproducts().subscribe((response) => {
      this.top10rejectedproducts = response.map((item: any) => [item.productName, item.totalRejectedQuantity]);
    });

    this.grnService.rejectedquantitybystate().subscribe((response) => {
      this.rejectedstate = response.map((item: any) => [item.state, item.totalRejectedQuantity]);
    });
  }

  // Helper methods for modern dashboard
  getTotalRejectedQuantity(): number {
    if (!this.rejectedstate || this.rejectedstate.length === 0) return 0;
    return this.rejectedstate.reduce((total: number, item: any) => {
      return total + (typeof item[1] === 'number' ? item[1] : 0);
    }, 0);
  }

  getAverageRejectedQuantity(): number {
    if (!this.rejectedstate || this.rejectedstate.length === 0) return 0;
    const total = this.getTotalRejectedQuantity();
    return Math.round(total / this.rejectedstate.length);
  }

  getTopRejectedState(): string {
    if (!this.rejectedstate || this.rejectedstate.length === 0) return 'N/A';
    const maxItem = this.rejectedstate.reduce((max: any, current: any) => {
      return (current[1] > max[1]) ? current : max;
    });
    return maxItem[0];
  }

  getSelectedSupplierName(): string {
    if (!this.selectedSupplier) return 'All Suppliers';
    const supplier = this.suppliers.find(s => s.supplierID === this.selectedSupplier);
    return supplier ? supplier.name : 'All Suppliers';
  }

  getFilterSummary(): string {
    const supplierName = this.getSelectedSupplierName();
    const dateRange = `${this.selectedDateFrom} to ${this.selectedDateTo}`;
    return `${supplierName} • ${dateRange}`;
  }

  getTotalQuantity(grn: any): number {
    if (!grn.grndetails || grn.grndetails.length === 0) return 0;
    return grn.grndetails.reduce((total: number, detail: any) => {
      return total + (detail.receivedQuantity || 0);
    }, 0);
  }

  getRejectedQuantity(grn: any): number {
    if (!grn.grndetails || grn.grndetails.length === 0) return 0;
    return grn.grndetails.reduce((total: number, detail: any) => {
      return total + (detail.rejectedQuantity || 0);
    }, 0);
  }

  getTotalPendingCount(): number {
    return this.groupedGrnList.reduce((total, group) => {
      return total + group.pendingCount;
    }, 0);
  }

  getTotalCompletedCount(): number {
    return this.groupedGrnList.reduce((total, group) => {
      return total + group.completedCount;
    }, 0);
  }

  // Navigation methods
  navigateToGrn() {
    this.router.navigate(['/grn']);
  }

  navigateToSupplierWiseReport() {
    this.router.navigate(['/grnreportsupplierwise']);
  }
}
