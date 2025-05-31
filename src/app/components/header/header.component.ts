import { Component, ElementRef, HostListener, ViewChild, NgZone, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { routes } from '../../app.routes';
import { NavLink, processRoutes } from '../../utils/route.utils';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ThemeToggleComponent, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements AfterViewInit {
  navLinks: NavLink[] = processRoutes(routes);
  isMobileMenuOpen = false;
  visibleLinks: NavLink[] = [];
  overflowLinks: NavLink[] = [];
  isOverflowChecked = false;
  isOverflowMenuOpen = false;

  @ViewChild('overflowButton') overflowButton?: ElementRef;
  @ViewChild('navMenu') navMenu?: ElementRef;

  private resizeTimeout: any;

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize with all links visible
    this.visibleLinks = this.navLinks;
    this.overflowLinks = [];
  }

  @HostListener('window:resize')
  onResize() {
    // Debounce resize events
    this.ngZone.runOutsideAngular(() => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout(() => {
        this.ngZone.run(() => {
          this.checkOverflow();
        });
      }, 100);
    });
  }

  ngAfterViewInit() {
    // Delay initial overflow check
    setTimeout(() => {
      this.checkOverflow();
      this.isOverflowChecked = true;
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleOverflowMenu(event: Event) {
    event.stopPropagation();
    this.isOverflowMenuOpen = !this.isOverflowMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close overflow menu when clicking outside
    if (this.isOverflowMenuOpen &&
      !this.overflowButton?.nativeElement?.contains(event.target)) {
      this.isOverflowMenuOpen = false;
    }
  }

  private checkOverflow() {
    // Only run on browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.navMenu?.nativeElement) return;

    const navWidth = this.navMenu.nativeElement.offsetWidth;
    const itemsContainer = this.navMenu.nativeElement.querySelector('.nav-items');
    if (!itemsContainer) return;

    // Reset to show all links first to get true widths
    this.visibleLinks = this.navLinks;
    this.overflowLinks = [];

    // Wait for DOM update
    setTimeout(() => {
      const availableWidth = navWidth - 100; // Reserve space for overflow button
      let totalWidth = 0;
      const items = Array.from(itemsContainer.children) as HTMLElement[];

      // Calculate actual width including margins/padding
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) continue;

        const styles = getComputedStyle(item);
        const width = item.offsetWidth +
          parseFloat(styles.marginLeft || '0') +
          parseFloat(styles.marginRight || '0');

        totalWidth += width;

        // Only overflow if more than 2 items and width exceeded
        if (totalWidth > availableWidth && this.navLinks.length > 2) {
          this.ngZone.run(() => {
            this.visibleLinks = this.navLinks.slice(0, Math.max(2, i));
            this.overflowLinks = this.navLinks.slice(Math.max(2, i));
          });
          break;
        }
      }

      // If everything fits or we have 2 or fewer items
      if (totalWidth <= availableWidth || this.navLinks.length <= 2) {
        this.ngZone.run(() => {
          this.visibleLinks = this.navLinks;
          this.overflowLinks = [];
        });
      }
    });
  }
}
