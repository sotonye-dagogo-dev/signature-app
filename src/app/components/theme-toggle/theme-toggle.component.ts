import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss']
})
export class ThemeToggleComponent implements OnInit {
  isDarkMode = false;
  faIcon = faMoon;
  faMoon = faMoon;
  faSun = faSun;

  private prefersDarkScheme: MediaQueryList | null = null;
  private localStorageKey = 'theme';
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object // Represents the platform ID to determine whether the platform is the browser.
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser && this.isLocalStorageAvailable()) {
      this.initializeTheme();
      this.listenToSystemThemeChanges();
    }
  }
  
  // Returns a boolean value indicating whether the local storage is available.
  isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorageTest__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
  
  // Initializes the theme based on the user's preference or the system's preference.
  initializeTheme() {
    if (this.isBrowser) {
      this.prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
      const storedTheme = localStorage.getItem(this.localStorageKey);
      if (storedTheme) {
        this.applyTheme(storedTheme === 'dark');
      } else {
        this.applyTheme(this.prefersDarkScheme.matches);
      }
    }
  }

  // Applies the specified theme.
  applyTheme(isDarkMode: boolean) {
    this.isDarkMode = isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      this.faIcon = this.faSun;
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      this.faIcon = this.faMoon;
    }  
  }
  
  // Listens to system theme changes.
  listenToSystemThemeChanges() {
    if (this.isBrowser && this.prefersDarkScheme) {
      this.prefersDarkScheme.addEventListener('change', (event) => {
        const storedTheme = localStorage.getItem(this.localStorageKey);
        if (!storedTheme) {
          this.applyTheme(event.matches);
        } else {
          const currentTheme = storedTheme === 'dark';
          const systemPreferenceChanged = this.prefersDarkScheme?.matches !== currentTheme;
          if (systemPreferenceChanged && this.prefersDarkScheme) {
            this.applyTheme(this.prefersDarkScheme.matches);
            localStorage.removeItem(this.localStorageKey);
          }
        }
      });
    }
  }
  
  // Toggles the theme.
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme(this.isDarkMode);
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(this.localStorageKey, this.isDarkMode ? 'dark' : 'light');
    }
  }
}
