import { Observable, tap } from "rxjs";

export enum RxJsLoggingLevel{
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
}
let rxjsLoggingLevel = RxJsLoggingLevel.INFO; // Default log level

export const debug =  (level:number, message:string) =>  (source: Observable<any>) => 
    source.pipe(
        tap((value)=>{
            if (level >= rxjsLoggingLevel) console.trace(message + ' : ', value);            
        })
    );
    
export const setRxjsLoggingLevel = (level: RxJsLoggingLevel) => {
    if (level < RxJsLoggingLevel.TRACE || level > RxJsLoggingLevel.ERROR) {
        throw new Error(`Invalid logging level: ${level}`);
        rxjsLoggingLevel = RxJsLoggingLevel.INFO; 
    }else{
        rxjsLoggingLevel = level;
    }    
}