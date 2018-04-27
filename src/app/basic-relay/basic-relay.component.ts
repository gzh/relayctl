import { Component, OnInit } from '@angular/core';
import { RelayctlService, Order, Status, Command } from '../relayctl.service';
import { timer } from 'rxjs/observable/timer';
import { Utils } from '../utils'

@Component({
  selector: 'app-basic-relay',
  templateUrl: './basic-relay.component.html',
  styleUrls: ['./basic-relay.component.css']
})
export class BasicRelayComponent implements OnInit {

  status : Status;
  orders : Order[];
  now : Date;

  constructor(private relayctl: RelayctlService) { 
    this.status=new Status();
    this.status.error="Not initialized";
    this.status.leds=[];
    this.orders=[];
    this.now=new Date(Date.now());
  }

  ngOnInit() {
    this.relayctl.getStatus().subscribe(
      status => this.status=status
    );
    this.relayctl.getOrders().subscribe(
      orders => this.orders=orders
    );
    timer(0, 2000).subscribe(_ => {
      this.now=new Date(Date.now());
    });
  }

  public toggleLed(ledIndex: number){
    let e=this.status.leds.find(x => x.index==ledIndex);
    if(e && e.value){
      this.relayctl.removeOrdersForLed(ledIndex);
      this.relayctl.addOrder(ledIndex, 0, Command.Off);
    }
    else{
      this.relayctl.addOrder(ledIndex, 0, Command.Toggle);
    }
  }

  public toggleOffOrder(ledIndex: number){
    if(!this.isSetOffOrder(ledIndex)){
      this.relayctl.addOrder(ledIndex, 1200, Command.Off);
    }
    else{
      this.relayctl.removeOrdersForLed(ledIndex);
    }
  }
  public isSetOffOrder(ledIndex: number) {
    return this.orders.findIndex(o => { return o.led==ledIndex && o.command==Command.Off })>=0;
  }
  public whenOff(ledIndex: number) : string {
    let default20mins="Turn OFF in 20 minutes";
    let o = this.orders.find(o => { return o.led==ledIndex && o.command==Command.Off });
    if(o){
      return "Goes off in "+Utils.stringifyDeadline(o.deadline, this.now);
    }
    else{
      return default20mins;
    }
  }

}
