import { Injectable, OnInit } from '@angular/core';
import { Observable } from "rxjs/Observable";

import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RelayctlService } from "./relayctl.service"

@Injectable()
export class LoginGuardService implements CanActivate, OnInit {

  // canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
  //   return Observable.create((o: Observer<boolean>) => { o.next(true); });
  // }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    let view="";
    switch(route.url[0].path){
      case "basic-relay": view="basic"; break;
      case "advrelay": view="advanced"; break;
      default: view=route.url[0].path; break;
    }
    return this.relayctl.getViews().map(v => null!=v.find(vn => vn==view));
  }

  ngOnInit(){
  }
  constructor(private relayctl: RelayctlService) { }

}
