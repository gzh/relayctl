import { Component, OnInit, OnDestroy } from '@angular/core';
import { RelayctlService, Order, Status, Command } from '../relayctl.service';
import { timer } from 'rxjs/observable/timer';
import { Subscription } from 'rxjs/Subscription';
import { Utils } from '../utils'

@Component({
  selector: 'app-basic-relay',
  templateUrl: './basic-relay.component.html',
  styleUrls: ['./basic-relay.component.css']
})
export class BasicRelayComponent implements OnInit, OnDestroy {

  subscriptions: Array<Subscription> = [];
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
    this.subscriptions.push(this.relayctl.getStatus().subscribe(
      status => this.status=status
    ));
    this.subscriptions.push(this.relayctl.getOrders().subscribe(
      orders => this.orders=orders
    ));
    this.subscriptions.push(timer(0, 2000).subscribe(_ => {
      this.now=new Date(Date.now());
    }));
  }
  ngOnDestroy(){
    this.subscriptions.forEach(s => { s.unsubscribe() });
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

  public removeOrders(ledIndex: number){
    this.relayctl.removeOrdersForLed(ledIndex);
  }
  public setOffOrder(ledIndex: number, interval: number){
    this.relayctl.addOrder(ledIndex, interval, Command.Off);
  }
  public turnOnFor(ledIndex: number, interval: number){
    this.relayctl.removeOrdersForLed(ledIndex);
    this.relayctl.addOrder(ledIndex, 0, Command.On);
    this.relayctl.addOrder(ledIndex, interval, Command.Off);
  }
  
  public isSetOffOrder(ledIndex: number) {
    return this.orders.findIndex(o => { return o.led==ledIndex && o.command==Command.Off })>=0;
  }
  public whenOff(ledIndex: number) : number {
    let o = this.orders.find(o => { return o.led==ledIndex && o.command==Command.Off });
    if(o){
      return Math.max(0, o.deadline.valueOf() - this.now.valueOf());
    }
    else{
      return -1;
    }
  }

}
