import { Component, OnInit } from '@angular/core';
import { RelayctlService, Status, Command } from '../relayctl.service';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent implements OnInit {

  status : Status;

  constructor(private relayctl: RelayctlService) { 
    this.status=new Status();
    this.status.error="Not initialized";
    this.status.leds=[];
  }

  ngOnInit() {
    this.relayctl.getStatus().subscribe(
      status => this.status=status
    );
  }

  public toggleLed(ledIndex: number){
    this.relayctl.addOrder(ledIndex, 0, Command.Toggle);
  }
}
