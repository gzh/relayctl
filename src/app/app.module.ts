import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing/app-routing.module'
import { AppComponent } from './app.component';
import { OrdersComponent } from './orders/orders.component';
import { RelayctlService } from './relayctl.service';
import { StatusComponent } from './status/status.component';
import { AdvrelayComponent } from './advrelay/advrelay.component';
import { LoginGuardService } from './login-guard.service';
import { BasicRelayComponent } from './basic-relay/basic-relay.component';
import { TimeIntervalPipe } from './time-interval.pipe';


@NgModule({
  declarations: [
    AppComponent,
    OrdersComponent,
    StatusComponent,
    AdvrelayComponent,
    BasicRelayComponent,
    TimeIntervalPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule
  ],
  providers: [RelayctlService, LoginGuardService],
  bootstrap: [AppComponent]
})
export class AppModule { }
