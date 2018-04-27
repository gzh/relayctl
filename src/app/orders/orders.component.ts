import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RelayctlService, Order, Command, LedInfo } from '../relayctl.service';
import { NgClass } from '@angular/common';
import { timer } from 'rxjs/observable/timer';
import { Utils } from '../utils'

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {

  orders: Order[];
  private now: Date;

  addOrderLed: number;
  addOrderTimeout: number;
  addOrderCommand: Command;

  leds: Array<LedInfo>;

  constructor(private relayctl: RelayctlService) { 
    this.orders=[];

    this.addOrderLed=null;
    this.addOrderTimeout=null;
    this.addOrderCommand=null;

    this.now=new Date(Date.now());
  }

  ngOnInit() {
    this.relayctl.getOrders().subscribe(
      orders => this.orders=orders
    );
    this.leds=this.relayctl.getLedsInfo();
    timer(0, 500).subscribe(_ => {
      this.now=new Date(Date.now());
    });
  }

  public stringifyCommand(c: Command) : string {
    switch(c){
      case Command.Off: return "SWITCH OFF";
      case Command.On: return "SWITCH ON";
      case Command.Toggle: return "TOGGLE";
    }
  }
  public stringifyDeadline(d: Date){
    return Utils.stringifyDeadline(d, this.now);
  }
  public stringifyLedName(n : number){
    return this.relayctl.getLedName(n);
  }

  public cancelOrder(n: number){
    this.relayctl.removeOrder(n);
  }
  public cancelAllOrders(){
    this.relayctl.removeAllOrders();
  }

  public canAddOrder(){
    return !(this.addOrderCommand===null || this.addOrderLed===null || this.addOrderTimeout===null);
  }
  public addOrder(){
    if (this.canAddOrder()) {
      this.relayctl.addOrder(this.addOrderLed, this.addOrderTimeout, this.addOrderCommand ? Command.On : Command.Off);
    }
  }
}
