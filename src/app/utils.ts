export class Utils {
    public static stringifyDeadline(d: Date, now: Date){
        let i = Math.round((d.valueOf()-now.valueOf())/1000);
        if(i<2){
          return "NOW";
        }
        if(i<90){
          return i+" second(s)";
        }
        if(i<3600){
          return Math.round(i/60)+" minute(s)";
        }
        return Math.round(i/3600)+" hour(s)";
      }
}
