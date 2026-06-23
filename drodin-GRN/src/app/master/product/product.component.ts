import { Component, OnInit, HostListener } from '@angular/core';
import { productService, product } from '../product/product.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})

export class productComponent implements OnInit {
  products: product[] = [];
  Brands: any[] = [];
  newproduct: product = { productId: 0, name: '',ProductCode:'',description:'',BrandId:0 };
  editingproduct: product | null = null;
  filters = { name: '' };
  activeFilter: string = '';
  tempproductName: string = '';  
  tempproductcode: string = '';
  selectedbrand: string = '';
  currentproductId: string | null = null;
    constructor(private productService: productService) { }
  ngOnInit() { 
    this.loadproducts(); 
    this.loadbrands();}
  loadproducts() {
    this.productService.getproducts().subscribe((data) => {
      this.products = data;
    });
  }
  loadbrands() {
    this.productService.getbrands().subscribe((data) => {
      this.Brands = data;
    });
  }

  openAddproductModal() {
    this.newproduct = { productId: 0, name: '',ProductCode:'',description:'',BrandId:0 };
    this.editingproduct = null;
    this.tempproductName = '';this.tempproductcode = '';
    const modalElement = document.getElementById('addproductModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  filteredproduct() {
    return this.products.filter(product =>
      (!this.filters.name || product.name.toLowerCase().includes(this.filters.name.toLowerCase()))
    );
  }

  addproduct() {
    
    this.newproduct.name = this.tempproductName;
    // this.newproduct.ProductCode = this.tempproductcode;
    // this.newproduct.BrandId = Number(this.selectedbrand);
    
    this.productService.createproduct(this.newproduct).subscribe(() => {
      this.loadproducts();
      this.newproduct = { productId: 0, name: '',ProductCode:'',description:'',BrandId:0 };
      const modalElement = document.getElementById('addproductModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        modal?.hide();
      }
    });
  }

 
  editproduct(product: product) {
   
    this.editingproduct = { ...product };
    this.tempproductName = product.name;

    const modalElement = document.getElementById('addproductModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  
  
  updateproduct() {
    if (this.editingproduct) {
      this.editingproduct.name = this.tempproductName;
      // this.editingproduct.ProductCode = this.tempproductcode;
      // this.editingproduct.BrandId = Number(this.selectedbrand);
      
      this.productService
        .updateproduct(this.editingproduct.productId, this.editingproduct)
        .subscribe(() => {
          this.loadproducts();
          this.editingproduct = null; // Reset after update
          const modalElement = document.getElementById('addproductModal');
          if (modalElement) {
            const modal = Modal.getInstance(modalElement);
            modal?.hide(); // Hide the modal after saving
          }
        });
    }
  }
  
  deleteproduct(productId: number) {
    this.productService.deleteproduct(productId).subscribe(() => this.loadproducts());
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
  getUniqueBrands(): any[] {
    const brandIds = this.products
      .map(product => product.BrandId)
      .filter(brandId => brandId && brandId > 0);
    return [...new Set(brandIds)];
  }

  getProductsWithCode(): product[] {
    return this.products.filter(product => 
      product.ProductCode && product.ProductCode.trim() !== ''
    );
  }

  getProductsWithDescription(): product[] {
    return this.products.filter(product => 
      product.description && product.description.trim() !== ''
    );
  }

  getBrandName(brandId: number): string {
    const brand = this.Brands.find(b => b.brand_id === brandId);
    return brand ? brand.brand_name : '';
  }

  linkMenufacturer(productId: number) { 
    this. currentproductId= productId.toString();
    this.selectedbrand="";
    const modalElement = document.getElementById('linkManufacturerModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }
 
}
