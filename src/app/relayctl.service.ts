import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from "rxjs/Observable";
import { Observer } from 'rxjs/Observer';
import { timer } from 'rxjs/observable/timer';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/shareReplay';
import { switchMap } from 'rxjs/operator/switchMap';

export class Led{
  index: number;
  name: string;
  value: boolean;
}

export class Status {
  error: string;
  leds: Led[];
}

export enum Command {
  Off, On, Toggle
}

export class Order{
  id: number;
  led: number;
  deadline: Date;
  command: Command;
}

@Injectable()
export class RelayctlService {

  private statusObservable: Observable<Status>;
  private statusObserver: Observer<Status>;
  private ordersObservable: Observable<Order[]>;
  private ordersObserver: Observer<Order[]>;

  private ledNames: string[];

  constructor(private http: Http) { 
    this.ledNames=[];
    for(var k=0; k<8; ++k){
      this.ledNames.push("Led "+k);
    }

    this.statusObservable=Observable.create((o: Observer<Status>) => {
      this.statusObserver=o;
    }).shareReplay(1);
    this.ordersObservable=Observable.create((o: Observer<Order[]>) => {
      this.ordersObserver=o;
    }).shareReplay(1);

    this.updateStatus();
    this.updateOrders();
  }

  getOrders(): Observable<Order[]>{
    return this.ordersObservable;
  }
  getStatus(): Observable<Status>{
    return this.statusObservable;
  }

  private updateOrders = () => {
    timer(0, 5000).switchMap(_ => {
      return this.http.get("orders").map(this.extractOrders);
    }).subscribe(o => { 
      this.ordersObserver.next(o);
    });
  }
  private updateStatus = () => {
    timer(0, 500).switchMap(_ => {
      return this.http.get("status").map(this.extractStatus);
    }).subscribe(o => { 
      this.statusObserver.next(o);
    });
  }

  private extractOrders(res: Response){
    var result=[];
    let body=<any>res.json();
    body.forEach(e => {
      let o=new Order();
      o.id=e.id;
      o.led=e.led;
      o.deadline=e.deadline;
      switch(e.command){
        case 0: o.command=Command.Off; break;
        case 1: o.command=Command.On; break;
        default: o.command=Command.Toggle;
      }
      result.push(o);
    });
    return result;
  }
  private extractStatus = (res: Response) => {
    var result=new Status();
    let body=<any>res.json();
    if(body){
      result.error=body.error;
      result.leds=[];
      for(var k=0; k<body.leds.length; ++k){
        let led = new Led();
        led.index=k;
        led.name=this.ledNames[k];
        led.value=body.leds[k];
        result.leds.push(led);
      }
    }
    else{
      result.error=res.statusText;
      result.leds=[];
    }
    return result;
  }

  public addOrder = (led: number, timeout: number, command: Command) => {
    var ncommand:any;
    switch(command){
      case Command.Off: ncommand=0; break;
      case Command.On: ncommand=1; break;
      case Command.Toggle: ncommand=null;
    }
    let sled="?led="+led;
    let stimeout=(timeout?"&timeout="+timeout:"");
    let scommand=(command?"&command="+ncommand:"");
    this.http.post("orders"+sled+stimeout+scommand, "")
      .map(this.extractOrders).subscribe(o => { 
        this.ordersObserver.next(o);
      });
  }
  public removeOrder = (id: number) => {
    this.http.delete("orders/"+id)
      .map(this.extractOrders).subscribe(o => { 
        this.ordersObserver.next(o);
      });
  }
  public removeOrdersForLed = (led: number) => {
    this.http.delete("orders/led/"+led)
      .map(this.extractOrders).subscribe(o => { 
        this.ordersObserver.next(o);
      });
  }
  public removeAllOrders = () => {
    this.http.delete("orders")
      .map(this.extractOrders).subscribe(o => { 
        this.ordersObserver.next(o);
      });
  }
  
}

