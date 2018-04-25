import { Injectable, OnInit } from '@angular/core';
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer"

import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable()
export class LoginGuardService implements CanActivate, OnInit {

  // canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
  //   return Observable.create((o: Observer<boolean>) => { o.next(true); });
  // }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return true;
  }

  ngOnInit(){
  }
  constructor() { }

}
