import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TuiButton, TuiTextfield, TuiLabel } from '@taiga-ui/core';
import { LocalProduct } from '../../../core/db.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TuiButton,
    TuiTextfield,
    TuiLabel
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(DialogRef<any>);
  private readonly data = inject<{ product: LocalProduct | null, categories: string[] }>(DIALOG_DATA);

  readonly product = signal<LocalProduct | null>(null);
  readonly categories = signal<string[]>([]);
  readonly loading = signal<boolean>(false);
  readonly isCustomCategory = signal<boolean>(false);

  productForm!: FormGroup;

  ngOnInit(): void {
    this.product.set(this.data.product);
    this.categories.set(this.data.categories);
    this.initForm();
    this.populateForm();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: [''],
      category: ['Coffee', Validators.required],
      customCategory: [''],
      quantityInStock: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [5, [Validators.required, Validators.min(0)]],
      costPrice: [0.0, [Validators.required, Validators.min(0)]],
      sellingPrice: [0.0, [Validators.required, Validators.min(0)]],
      supplier: [''],
    });

    // Toggle custom category validators on change
    this.productForm.get('category')?.valueChanges.subscribe((val) => {
      if (val === 'CUSTOM') {
        this.isCustomCategory.set(true);
        this.productForm.get('customCategory')?.setValidators([Validators.required]);
      } else {
        this.isCustomCategory.set(false);
        this.productForm.get('customCategory')?.clearValidators();
      }
      this.productForm.get('customCategory')?.updateValueAndValidity();
    });
  }

  populateForm(): void {
    const prod = this.product();
    if (prod) {
      const hasPresetCategory = this.categories().includes(prod.category);
      this.productForm.patchValue({
        sku: prod.sku,
        name: prod.name,
        description: prod.description || '',
        category: hasPresetCategory ? prod.category : 'CUSTOM',
        customCategory: hasPresetCategory ? '' : prod.category,
        quantityInStock: prod.quantityInStock,
        reorderLevel: prod.reorderLevel,
        costPrice: prod.costPrice,
        sellingPrice: prod.sellingPrice,
        supplier: prod.supplier || '',
      });
      this.isCustomCategory.set(!hasPresetCategory);
    }
  }

  submitProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.productForm.value);
  }

  closeAddDialog(): void {
    this.dialogRef.close(null);
  }
}
