import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { RelayctlService, Status, Command } from '../relayctl.service';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent implements OnInit, OnDestroy {

  
  subscriptions: Array<Subscription> = [];
  status : Status;

  constructor(private relayctl: RelayctlService) { 
    this.status=new Status();
    this.status.error="Not initialized";
    this.status.leds=[];
  }

  ngOnInit() {
    this.subscriptions.push(this.relayctl.getStatus().subscribe(
      status => this.status=status
    ));
  }
  ngOnDestroy(){
    this.subscriptions.forEach(s => { s.unsubscribe() });
  }

  public toggleLed(ledIndex: number){
    this.relayctl.addOrder(ledIndex, 0, Command.Toggle);
  }
}
