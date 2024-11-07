// src/app/components/product-list/product-list.component.ts

import { Component, OnInit } from '@angular/core';
import { Product } from '../../../models/product.model';
import { ProductService } from '../../../services/services/product.service';
import { finalize, map } from 'rxjs';
@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  newProduct: Product = { id: '', name: '', data: {}, isLocallyAdded: true  };
  selectedProduct: Product | null = null;

  isLoading = false;
  loadingProductId: string | null = null;
  isAddingProduct = false;
  originalProduct: Product | null = null;

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  getDisplayValue(value: any): string {
    return value === '' || value === null || value === undefined ? 'N/A' : value;
  }


  loadProducts(): void {
    this.productService.getProducts()
    .pipe(  
      map(products => products.map(product => ({
      ...product,
      isLocallyAdded: false
    }))),
    finalize(() => this.isLoading = false))
    .subscribe(
      (products) => this.products = products,
      (error) => console.error('Error loading products:', error)
    );
  }

  addProduct(): void {
    if (this.isAddingProduct) return; // Evita múltiples envíos
    if (!this.validateProduct(this.newProduct)) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }
    // Aseguramos que el nuevo producto tenga isLocallyAdded = true
    const productToAdd = { ...this.newProduct, isLocallyAdded: true };
    

    this.isAddingProduct = true;
    this.productService.addProduct(productToAdd)
      .pipe( map(response => ({
        ...response,
        isLocallyAdded: true // Mantenemos isLocallyAdded después de la respuesta del servidor
      })),
      finalize(() => this.isAddingProduct = false))
      .subscribe(
        (product) => {
          this.products.push(product);
          this.newProduct = { id: '', name: '', data: {}, isLocallyAdded: true};
        },
        (error) => console.error('Error adding product:', error)
      );
  }

  deleteProduct(id: string): void {
    if (this.loadingProductId) return; // Evita múltiples eliminaciones
    this.loadingProductId = id;

    this.productService.deleteProduct(id)
      .pipe(finalize(() => this.loadingProductId = null))
      .subscribe(
        () => {
          this.products = this.products.filter(p => p.id !== id);
        },
        (error) => console.error('Error deleting product:', error)
      );
  }
  private validateProduct(product: Product): boolean {
    return !!(product.name && product.data.color && 
              product.data.capacity && product.data.price);
  }

  viewProduct(product: Product): void {
    // Creamos una copia profunda del producto original
    this.originalProduct = JSON.parse(JSON.stringify(product));
    // Creamos una copia separada
    this.selectedProduct = JSON.parse(JSON.stringify(product));
  }

  clearInputs(): void {
     // Limpia el producto seleccionado
     if (this.selectedProduct) {
      const originalProduct = this.products.find(p => p.id === this.selectedProduct?.id);
      if (originalProduct) {
        // Restaurar los valores originales en el array de productos
        const index = this.products.findIndex(p => p.id === originalProduct.id);
        if (index !== -1) {
          this.products[index] = { ...originalProduct };
        }
      }
      // Limpia el producto seleccionado
      this.selectedProduct = null;
    }
  }
  cancelEdit(): void {
      // Si hay un producto original, restauramos sus valores en el array
      if (this.originalProduct) {
        const index = this.products.findIndex(p => p.id === this.originalProduct!.id);
        if (index !== -1) {
          this.products[index] = { ...this.originalProduct };
        }
      }
     
      this.selectedProduct = null;
      this.originalProduct = null;
  }

  updateProduct(): void {
    if (this.selectedProduct) {
      const productToUpdate = { 
        ...this.selectedProduct, 
        isLocallyAdded: true,
        name: this.getDisplayValue(this.selectedProduct.name),
        data: {
          ...this.selectedProduct.data,
          color: this.getDisplayValue(this.selectedProduct.data.color),
          capacity: this.getDisplayValue(this.selectedProduct.data.capacity),
          price: this.getDisplayValue(this.selectedProduct.data.price)
        }

       };

      this.productService.updateProduct(productToUpdate.id, productToUpdate)
      .pipe(
        map(response => ({
          ...response,
          isLocallyAdded: true
        }))
      )
      .subscribe(
        (updatedProduct) => {
          const index = this.products.findIndex(p => p.id === updatedProduct.id);
          if (index !== -1) {
            this.products[index] = {
              ...updatedProduct,
              name: this.getDisplayValue(updatedProduct.name),
              data: {
                ...updatedProduct.data,
                color: this.getDisplayValue(updatedProduct.data.color),
                capacity: this.getDisplayValue(updatedProduct.data.capacity),
                price: this.getDisplayValue(updatedProduct.data.price)
              }
            };
            
          }
        
          this.originalProduct = null; 
          this.selectedProduct = null;
        },
        (error) => console.error('Error updating product:', error)
      );
    }
  }
 
}