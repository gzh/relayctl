import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from "rxjs/Observable";
import { Observer } from 'rxjs/Observer';
import { timer } from 'rxjs/observable/timer';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/shareReplay';
import 'rxjs/observable/forkJoin';
import { switchMap } from 'rxjs/operator/switchMap';

import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject';

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

export class GroupInfo{
  id: string;
  name: string;
  logic: string;
}

export class LedInfo {
  index: number;
  name: string;
  group: GroupInfo;
}

export class MetaInfo{
  views: Array<string>;
  groups: Array<GroupInfo>;
  leds: Array<LedInfo>;
}

export class UpdateMessage{
  status: object;
  orders: object;
}

@Injectable()
export class RelayctlService {

  private statusObservable: Observable<Status>;
  private statusObserver: Observer<Status>;
  private ordersObservable: Observable<Order[]>;
  private ordersObserver: Observer<Order[]>;

  private metaInfoObservable: Observable<MetaInfo>;
  private metaInfo: MetaInfo;

  private socket: WebSocketSubject<UpdateMessage>;

  constructor(private http: Http) { 

    this.metaInfoObservable=this.http.get("meta").map(this.extractMetaInfo).shareReplay(1);
    this.metaInfoObservable.subscribe(x => {
      this.metaInfo=x;
      this.subscribeWebsocket();
    });

    this.statusObservable=Observable.create((o: Observer<Status>) => {
      this.statusObserver=o;
    }).shareReplay(1);
    this.ordersObservable=Observable.create((o: Observer<Order[]>) => {
      this.ordersObserver=o;
    }).shareReplay(1);

    //this.updateStatus();
    //this.updateOrders();
  }

  private subscribeWebsocket = () => {
    this.socket=WebSocketSubject.create(this.buildWebsockUri());
    this.socket.subscribe(message => {
      if(message.status){
        this.statusObserver.next(this.extractStatusData(message.status, null));
      }
      if(message.orders){
        this.ordersObserver.next(this.extractOrdersData(message.orders));
      }
    });
  }
  private buildWebsockUri(): string{
    let loc = window.location
    let new_uri : string;
    if (loc.protocol === "https:") {
        new_uri = "wss:";
    } else {
        new_uri = "ws:";
    }
    new_uri += "//" + loc.host;
    new_uri += "/ws"; // <-- according to what the server exposes
    return new_uri;    
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
      if(this.metaInfo && this.ordersObserver){
        this.ordersObserver.next(o);
      }
    });
  }
  private updateStatus = () => {
    timer(0, 500).switchMap(_ => {
      return this.http.get("status").map(this.extractStatus);
    }).subscribe(o => { 
      if(this.metaInfo && this.statusObserver){
        this.statusObserver.next(o);
      }
    });
  }

  private extractOrders = (res: Response) => {
    let body=<any>res.json();
    return this.extractOrdersData(body);
  }

  private extractOrdersData = (body: any) => {
    var result=[];
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
    result.sort((a:Order,b:Order) => {return a.deadline.valueOf() - b.deadline.valueOf();});
    return result;
  }
  private extractStatus = (res: Response) => {
    let body=<any>res.json();
    return this.extractStatusData(body, res);
  }
  private extractStatusData = (body: any, res: Response) => {
    var result=new Status();
    if(body){
      result.error=body.error;
      result.leds=[];
      for(var k=0; k<body.leds.length; ++k){
        if(this.metaInfo && this.metaInfo.leds){
          let ledInfo=this.metaInfo.leds.find(x => x.index==k);
          if(ledInfo){
            let led = new Led();
            led.index=ledInfo.index;
            led.name=ledInfo.name;
            led.value=body.leds[k];
            result.leds.push(led);
          }
        }
      }
    }
    else{
      result.error=res.statusText;
      result.leds=[];
    }
    return result;
  }
  private extractMetaInfo(res: Response){
    let meta = new MetaInfo();
    meta.leds=[];
    meta.groups=[];

    let v=<object>res.json();
    meta.views=v["views"];
    let groups = v["groups"];
    Object.keys(groups).forEach(g =>{
      let ng=new GroupInfo();
      ng.id=g;
      ng.name=groups[g].name;
      ng.logic=groups[g].logic;
      meta.groups[g]=ng;
    });
    let leds = v["leds"];
    leds.forEach(e => {
      let led=new LedInfo();
      led.index=e["index"];
      led.name=e["name"];
      led.group=meta.groups[e["group"]];
      meta.leds.push(led);
    });
    return meta;
  }

  public addOrder = (led: number, timeout: number, command: Command) => {
    var ncommand:number;
    switch(command){
      case Command.Off: ncommand=0; break;
      case Command.On: ncommand=1; break;
      case Command.Toggle: ncommand=-1; break;
    }
    let sled="?led="+led;
    let stimeout="&timeout="+timeout;
    let scommand="&command="+ncommand;
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

  public getViews() : Observable<string[]>{
    return this.metaInfoObservable.map(x => x.views);
  }

  public getLedName = (n:number) : string => {
    return this.metaInfo.leds.find(x => x.index==n).name;
  }
  public getLedsInfo() {
    if(this.metaInfo){
      return this.metaInfo.leds;
    }
    else {
      return [];
    }
  }
  
}

