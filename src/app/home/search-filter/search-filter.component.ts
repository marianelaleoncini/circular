import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { LocationService } from '../../common/services/location.service'; // Ajusta la ruta si es necesario
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatExpansionModule,
  ],
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss'],
})
export class SearchFilterComponent implements OnInit {
  @Input() provinces: any[] = [];
  @Output() filterChange = new EventEmitter<any>();

  filterForm: FormGroup;
  cities: any[] = [];
  isLoadingCities = false;

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      province: [null],
      city: [null],
      minPrice: [null],
      maxPrice: [null],
    });
  }

  ngOnInit() {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((values) => {
        this.filterChange.emit(values);
      });

    this.filterForm.get('province')?.valueChanges.subscribe((provinceId) => {
      this.cities = [];
      this.filterForm.get('city')?.setValue(null);

      if (provinceId) {
        this.isLoadingCities = true;
        this.locationService.getCities(String(provinceId)).subscribe({
          next: (cities) => {
            this.cities = cities;
            this.isLoadingCities = false;
          },
          error: () => (this.isLoadingCities = false),
        });
      }
    });
  }

  clearFilters() {
    this.filterForm.reset();
  }
}
