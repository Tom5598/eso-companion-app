import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
  name: 'toDate', 
  standalone: true 
})
export class ToDatePipe implements PipeTransform {
  transform(value: any): Date | null {
    if (value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    return value instanceof Date ? value : null;
  }
}