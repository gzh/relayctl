import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginGuardService } from '../login-guard.service'
import { StatusComponent } from '../status/status.component';
import { OrdersComponent } from '../orders/orders.component';
import { AdvrelayComponent } from '../advrelay/advrelay.component';
import { BasicRelayComponent } from '../basic-relay/basic-relay.component';

const appRoutes: Routes = [
  //{ path: 'login', component: LoginComponent },
  { path: 'basic-relay', component: BasicRelayComponent, canActivate: [LoginGuardService] },
  { path: 'advrelay', component: AdvrelayComponent, canActivate: [LoginGuardService] },
  { path: 'status', component: StatusComponent, canActivate: [LoginGuardService] },
  { path: 'orders', component: OrdersComponent, canActivate: [LoginGuardService] },
  { path: '', redirectTo: '/advrelay', pathMatch: 'full' },
  { path: '**', redirectTo: '/advrelay' } //, component: PageNotFoundComponent }
];


@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, { useHash: true })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
