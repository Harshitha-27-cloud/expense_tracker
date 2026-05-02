import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('starsSvg') starsSvgRef!: ElementRef<SVGElement>;

  isRegisterMode = false;
  showPassword = false;
  rememberMe = false;
  loading = false;
  errorMsg = '';
  successMsg = '';

  form = {
    username: '',
    password: '',
    email: '',
    date_of_birth: '',
    contact_number: ''
  };

  constructor(
    private api: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.generateStars();
  }

  generateStars(): void {
    const svg = this.starsSvgRef.nativeElement;
    const ns = 'http://www.w3.org/2000/svg';

    for (let i = 0; i < 90; i++) {
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', `${(Math.random() * 800).toFixed(1)}`);
      circle.setAttribute('cy', `${(Math.random() * 220).toFixed(1)}`);
      circle.setAttribute('r', `${(Math.random() * 1.5 + 0.3).toFixed(2)}`);
      circle.setAttribute('fill', 'white');
      circle.setAttribute('opacity', `${(Math.random() * 0.6 + 0.3).toFixed(2)}`);
      svg.appendChild(circle);
    }
  }

  switchMode(toRegister: boolean): void {
    this.isRegisterMode = toRegister;
    this.errorMsg = '';
    this.successMsg = '';
    this.showPassword = false;
    this.form = {
      username: '',
      password: '',
      email: '',
      date_of_birth: '',
      contact_number: ''
    };
  }

  login(): void {
    this.errorMsg = '';
    this.successMsg = '';
    this.clearTokens();

    if (!this.form.username || !this.form.password) {
      this.errorMsg = 'Please enter username and password.';
      return;
    }

    this.loading = true;

    this.api.login({
      username: this.form.username,
      password: this.form.password
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.saveTokensAndRedirect(res);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail ?? 'Invalid username or password.';
      }
    });
  }

  register(): void {
    this.errorMsg = '';
    this.successMsg = '';
    this.clearTokens();
    const { username, email, date_of_birth, contact_number, password } = this.form;

    if (!username || !email || !date_of_birth || !contact_number || !password) {
      this.errorMsg = 'Please fill in all fields.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMsg = 'Please enter a valid email.';
      return;
    }

    if (password.length < 6) {
      this.errorMsg = 'Password must be at least 6 characters.';
      return;
    }

    this.loading = true;

    this.api.register(this.form).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.saveTokensAndRedirect(res);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMsg = err?.error?.error ?? 'Registration failed. Please try again.';
      }
    });
  }

  private saveTokensAndRedirect(res: any): void {
    this.clearTokens();
    localStorage.setItem('token', res.access);
    if (res.refresh) {
      localStorage.setItem('refresh', res.refresh);
    }
    this.successMsg = 'Success! Redirecting...';
    void this.router.navigate(['/dashboard']);
  }

  private clearTokens(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
  }
}
