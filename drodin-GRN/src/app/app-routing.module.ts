import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: '/admin/login',
        pathMatch: 'full'
      },
      {
        path: 'default',
        loadComponent: () => import('./demo/default/default.component').then((c) => c.DefaultComponent)
      },
      {
        path: 'manufacturersalt',
        loadComponent: () => import('./demo/elements/linkmanufacturesalt/linkmanufacturesalt.component').then((c) => c.linkmanufacturesaltComponent)
      },
      {
        path: 'stockbylocation',
        loadComponent: () => import('./demo/elements/stockbylocation/stockbylocation.component').then((c) => c.stockbylocationComponent)
      },
      {
        path: 'manufacturer',
        loadComponent: () => import('./demo/elements/manufacturer/manufacturer.component').then((c) => c.manufacturerComponent)
      },
      {
        path: 'supplier',
        loadComponent: () => import('./master/supplier/supplier.component').then((c) => c.SupplierComponent)
      },
      {
        path: 'product',
        loadComponent: () => import('./master/product/product.component').then((c) => c.productComponent)
      },
      
      {
        path: 'user',
        loadComponent: () => import('./demo/elements/user/user.component').then((c) => c.userComponent)
      },
      
      {
        path: 'grn',
        loadComponent: () => import('./master/grn/grn.component').then((c) => c.grnComponent)
      },
      {
        path: 'grnreportsupplierwise',
        loadComponent: () => import('./reports/grnreportsupplierwise/grnreportsupplierwise.component').then((c) => c.GrnreportsupplierwiseComponent)
      },
      
      {
        path: 'grnreportstatewise',
        loadComponent: () => import('./reports/grnreportstatewise/grnreportstatewise.component').then((c) => c.GrnreportstatewiseComponent)
      },
      
      
      {
        path: 'grnreportPersonwise',
        loadComponent: () => import('./reports/grnreportPersonwise/grnreportPersonwise.component').then((c) => c.GrnreportPersonwiseComponent)
      },
      {
        path: 'responsibleperson',
        loadComponent: () => import('./master/responsibleperson/responsibleperson.component').then((c) => c.responsiblepersonComponent)
      },
      {
        path: 'sample-page',
        loadComponent: () => import('./demo/sample-page/sample-page.component')
      }
    ]
  },
  {
    path: '',
    component: GuestComponent,
    children: [
      {
        path: 'admin',
        loadChildren: () => import('./demo/pages/authentication/authentication.module').then((m) => m.AuthenticationModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],//[RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
