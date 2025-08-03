import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { DeviceSetupComponent } from './pages/device-setup/device-setup.component';
import { QueryComponent } from './pages/query/query.component';
import { EvaluationComponent } from './pages/evaluation/evaluation.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: 'device-setup',
        component: DeviceSetupComponent
    },
    {
        path: 'query',
        component: QueryComponent
    },
    {
        path: 'evaluation',
        component: EvaluationComponent
    },
    {
        path: 'not-found',
        component: NotFoundComponent
    },
    {
        path: '**',
        component: NotFoundComponent
    }
];
