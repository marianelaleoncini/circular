import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, Subscription } from 'rxjs';
import { AdminService } from './admin.service';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  MAT_DATE_LOCALE,
  DateAdapter,
} from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';

// Chart.js Import
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    BaseChartDirective,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-AR' }],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // --- Filtro de Fechas ---
  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  // --- Métricas Calculadas ---
  metrics = {
    users: { total: 0, banned: 0, bannedPct: 0 },
    posts: { total: 0, active: 0, activePct: 0, inactive: 0, inactivePct: 0 },
    transactions: { total: 0 },
    ratings: { total: 0, pct: 0 },
    chats: { total: 0 },
  };

  fullUsersList: any[] = [];
  filteredUsersTable: any[] = [];
  searchTerm: string = '';

  usersList: any[] = [];
  displayedColumns: string[] = ['id', 'name', 'email', 'location', 'status'];

  displayMetrics = {
    usersTotal: 0,
    postsTotal: 0,
    transTotal: 0,
    chatsTotal: 0,
  };
  private dataSub!: Subscription;

  // --- Gráficos (Chart.js) ---
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  public pieChartData: ChartData<'pie', number[], string> = {
    labels: [],
    datasets: [{ data: [] }],
  };
  public pieChartType: ChartType = 'pie';

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
  };

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Publicaciones por Provincia',
        backgroundColor: '#3f51b5',
      },
    ],
  };
  public barChartType: ChartType = 'bar';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private dateAdapter: DateAdapter<Date>
  ) {
    Chart.register(...registerables);
    Chart.defaults.font.family = "'Nunito', 'Helvetica Neue', sans-serif";
    this.dateAdapter.setLocale('es-AR');
  }

  ngOnInit(): void {
    // Escuchamos Firebase y el Filtro de Fechas al mismo tiempo
    this.dataSub = combineLatest([
      this.adminService.getAllUsers(),
      this.adminService.getAllPosts(),
      this.adminService.getAllTransactions(),
      this.adminService.getAllRatings(),
      this.adminService.getAllChats(),
      this.dateRange.valueChanges, // Se dispara cuando el admin cambia las fechas
    ]).subscribe(([users, posts, trans, ratings, chats, dates]) => {
      this.processData(
        users,
        posts,
        trans,
        ratings,
        chats,
        dates.start,
        dates.end,
      );
    });

    // Forzamos un disparo inicial del filtro
    this.dateRange.updateValueAndValidity();
  }

  ngOnDestroy() {
    if (this.dataSub) this.dataSub.unsubscribe();
  }

  // Función auxiliar para filtrar por fecha (maneja timestamps de Firebase)
  private isWithinDate(
    item: any,
    start: Date | null | undefined,
    end: Date | null | undefined,
  ): boolean {
    if (!start && !end) return true;
    const dateField = item.createdAt || item.timestamp;
    if (!dateField) return true; // Si no tiene fecha, lo incluimos por defecto
    const itemDate = dateField.toDate(); // Firebase Timestamp a JS Date

    if (start && itemDate < start) return false;
    if (end) {
      // Ajustamos el fin al final del día
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      if (itemDate > endOfDay) return false;
    }
    return true;
  }

  processData(
    users: any[],
    posts: any[],
    trans: any[],
    ratings: any[],
    chats: any[],
    start?: Date | null,
    end?: Date | null,
  ) {
    this.fullUsersList = users;
    this.applyUserSearch(); // Aplicamos el buscador inicial
    // 1. Filtrar los datos
    const fUsers = users.filter((u) => this.isWithinDate(u, start, end));
    const fPosts = posts.filter((p) => this.isWithinDate(p, start, end));
    const fTrans = trans.filter((t) => this.isWithinDate(t, start, end));
    const fRatings = ratings.filter((r) => this.isWithinDate(r, start, end));
    const fChats = chats.filter((c) => this.isWithinDate(c, start, end));

    this.usersList = fUsers;

    this.metrics.users.total = fUsers.length;
    this.metrics.posts.total = fPosts.length;
    this.metrics.transactions.total = fTrans.length;
    this.metrics.chats.total = fChats.length;

    // 2. Calcular Métricas
    const tUsers = fUsers.length || 1; // Evitar división por 0
    const tPosts = fPosts.length || 1;

    this.metrics.users.total = fUsers.length;
    this.metrics.users.banned = fUsers.filter(
      (u) => u.isEnabled === false,
    ).length;
    this.metrics.users.bannedPct = (this.metrics.users.banned / tUsers) * 100;

    this.metrics.posts.total = fPosts.length;
    this.metrics.posts.active = fPosts.filter((p) => p.isActive).length;
    this.metrics.posts.inactive = fPosts.filter((p) => !p.isActive).length;
    this.metrics.posts.activePct = (this.metrics.posts.active / tPosts) * 100;
    this.metrics.posts.inactivePct =
      (this.metrics.posts.inactive / tPosts) * 100;

    this.metrics.transactions.total = fTrans.length;
    this.metrics.chats.total = fChats.length;

    // Lógica de Valoraciones (Comprador y Vendedor = 2x transacciones maximo)
    this.metrics.ratings.total = fRatings.length;
    const maxPossibleRatings = fTrans.length * 2;
    this.metrics.ratings.pct =
      maxPossibleRatings > 0
        ? Math.min((this.metrics.ratings.total / maxPossibleRatings) * 100, 100)
        : 0;

    // 3. Procesar Gráficos
    this.generateCharts(fPosts);
    this.animateNumber('usersTotal', this.metrics.users.total);
    this.animateNumber('postsTotal', this.metrics.posts.total);
    this.animateNumber('transTotal', this.metrics.transactions.total);
    this.animateNumber('chatsTotal', this.metrics.chats.total);
  }

  animateNumber(key: keyof typeof this.displayMetrics, target: number) {
    let current = 0;
    // Si el objetivo es 0, no animamos
    if (target === 0) {
      this.displayMetrics[key] = 0;
      return;
    }

    const duration = 800; // Duración de la animación en milisegundos
    const frames = duration / 16; // Aprox 60 cuadros por segundo (1000ms / 60 = ~16ms)
    const increment = Math.ceil(target / frames);

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        this.displayMetrics[key] = target; // Aseguramos el número final exacto
        clearInterval(interval);
      } else {
        this.displayMetrics[key] = current;
      }
    }, 16);
  }

  applyUserSearch() {
    const search = this.searchTerm.toLowerCase().trim();
    if (!search) {
      this.filteredUsersTable = [...this.fullUsersList];
      return;
    }

    this.filteredUsersTable = this.fullUsersList.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(search) ||
        u.id?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search),
    );
  }

  onSearchChange(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyUserSearch();
  }

  generateCharts(posts: any[]) {
    // Gráfico de Categorías
    const catCounts = posts.reduce((acc, p) => {
      const cat = p.category || 'Otros';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    this.pieChartData = {
      labels: Object.keys(catCounts),
      datasets: [{ data: Object.values(catCounts) as number[] }],
    };

    // Gráfico de Provincias
    const provCounts = posts.reduce((acc, p) => {
      const prov = p.authorProvince || 'Sin especificar';
      acc[prov] = (acc[prov] || 0) + 1;
      return acc;
    }, {});
    this.barChartData = {
      labels: Object.keys(provCounts),
      datasets: [
        {
          data: Object.values(provCounts) as number[],
          label: 'Publicaciones por Provincia',
          backgroundColor: '#3f51b5',
        },
      ],
    };
  }

  toggleStatus(user: any) {
    const newStatus = user.isEnabled === false ? true : false;
    this.adminService.toggleUserStatus(user.id, newStatus);
  }

  clearDates(event: Event) {
    event.stopPropagation(); 
    this.dateRange.reset(); 
  }

  onLogout() {
    this.authService.logout().then(() => this.router.navigate(['/auth']));
  }
}
