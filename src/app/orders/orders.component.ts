import { Component, OnInit } from '@angular/core';
import { RelayctlService, Order, Command } from '../relayctl.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {

  orders: Order[];

  constructor(private relayctl: RelayctlService) { 
    this.orders=[];
  }

  ngOnInit() {
    this.relayctl.getOrders().subscribe(
      orders => this.orders=orders
    );
  }

  public stringifyCommand(c: Command) : string {
    switch(c){
      case Command.Off: return "SWITCH OFF";
      case Command.On: return "SWITCH ON";
      case Command.Toggle: return "TOGGLE";
    }
  }
  public stringifyDeadline(d: Date){
    let n=Date.now();
    let i = (n.valueOf()-d.valueOf())/1000;
    if(i<90){
      return i+" second(s)";
    }
    if(i<3600){
      return Math.round(i/60)+" minute(s)";
    }
    return Math.round(i/3600)+" hour(s)";
  }
}
