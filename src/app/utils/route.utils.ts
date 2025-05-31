import { Route } from '@angular/router';

export interface NavLink {
    path: string;
    label: string;
}

export function formatPathToLabel(path: string): string {
    return path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function processRoutes(routes: Route[]): NavLink[] {
    return routes
        .filter(route => {
            // Filter out empty paths, wildcards, and redirects
            return route.path &&
                route.path !== '**' &&
                !route.redirectTo &&
                route.component; // Ensure route has a component
        })
        .map(route => {
            const path = route.path!;

            // Handle dynamic route parameters
            const basePath = path.split('/')[0];
            const basePathWithoutParams = basePath.split(':')[0];
            const cleanPath = basePathWithoutParams.replace(/[\/\-]$/, '');

            return {
                path: `/${path}`,
                label: formatPathToLabel(cleanPath)
            };
        });
}
