import { TimestamptToDatePipe } from './timestampt-to-date.pipe';

describe('TimestamptToDatePipe', () => {
  it('create an instance', () => {
    const pipe = new TimestamptToDatePipe();
    expect(pipe).toBeTruthy();
  });
});
