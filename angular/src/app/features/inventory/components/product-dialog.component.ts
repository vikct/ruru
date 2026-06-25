import { Component, input, model, output, effect, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CoreModule } from '../../../core/core.module';
import { LocalProduct } from '../../../core/db.service';

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CoreModule],
  templateUrl: './product-dialog.component.html',
})
export class ProductDialogComponent implements OnInit {
  // Inputs
  readonly product = input<LocalProduct | null>(null);
  readonly loading = input<boolean>(false);
  readonly categories = input.required<string[]>();

  // Model Inputs (Two-Way Signals)
  readonly visible = model<boolean>(false);

  // Outputs
  readonly save = output<any>();

  // Form Group & Status
  productForm!: FormGroup;
  readonly isCustomCategory = model<boolean>(false);

  // Computed Options
  readonly dropdownCategories = computed(() => {
    const list = this.categories().map((cat) => ({ label: cat, value: cat }));
    list.push({ label: '+ Add Custom Category...', value: 'CUSTOM' });
    return list;
  });

  constructor(private fb: FormBuilder) {
    // Populate or reset form whenever the visible state or the product to edit changes
    effect(() => {
      const prod = this.product();
      const isVisible = this.visible();

      if (isVisible && this.productForm) {
        if (prod) {
          const hasPresetCategory = this.categories().includes(prod.category);
          this.productForm.reset({
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
        } else {
          this.productForm.reset({
            sku: '',
            name: '',
            description: '',
            category: 'Coffee',
            customCategory: '',
            quantityInStock: 0,
            reorderLevel: 5,
            costPrice: 0.0,
            sellingPrice: 0.0,
            supplier: '',
          });
          this.isCustomCategory.set(false);
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
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

  submitProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.save.emit(this.productForm.value);
  }

  closeAddDialog(): void {
    this.visible.set(false);
  }
}
