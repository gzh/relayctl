import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeInterval'
})
export class TimeIntervalPipe implements PipeTransform {

  transform(value: number, prefix, nameNow): any {
    let i = Math.round(value/1000);
    let namePrefix = prefix?prefix+' ':'';
    if(i<2){
      return nameNow;
    }
    if(i<90){
      return namePrefix+i+" sec.";
    }
    if(i<3600){
      return namePrefix+Math.round(i/60)+" min.";
    }
    return namePrefix+Math.round(i/3600)+" hr";
}

}
