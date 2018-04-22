import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';


import { AppComponent } from './app.component';
import { OrdersComponent } from './orders/orders.component';
import { RelayctlService } from './relayctl.service';
import { StatusComponent } from './status/status.component';


@NgModule({
  declarations: [
    AppComponent,
    OrdersComponent,
    StatusComponent
  ],
  imports: [
    BrowserModule,
    HttpModule
  ],
  providers: [RelayctlService],
  bootstrap: [AppComponent]
})
export class AppModule { }
