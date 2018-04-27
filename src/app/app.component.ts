import { Component } from '@angular/core';
import { Observable } from "rxjs/Observable";
import { RelayctlService } from "./relayctl.service"

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  viewEnabled(vn: string) : Observable<boolean>{
    return this.relayctl.getViews().map(v => null!=v.find(x => x===vn));
  }
  constructor(private relayctl: RelayctlService){}
}
