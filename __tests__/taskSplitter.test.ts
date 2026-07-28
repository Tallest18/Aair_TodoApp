import { splitDictationIntoTasks } from '../src/utils/taskSplitter';

describe('splitDictationIntoTasks', () => {
  it('returns an empty array for empty or whitespace-only input', () => {
    expect(splitDictationIntoTasks('')).toEqual([]);
    expect(splitDictationIntoTasks('   ')).toEqual([]);
  });

  it('returns a single task when there is no connector word', () => {
    expect(splitDictationIntoTasks('buy milk')).toEqual(['Buy milk']);
  });

  it('splits on "and" into separate tasks', () => {
    expect(splitDictationIntoTasks('buy provisions and call mom')).toEqual([
      'Buy provisions',
      'Call mom',
    ]);
  });

  it('splits on commas and "then"', () => {
    expect(splitDictationIntoTasks('walk the dog, then wash the car')).toEqual([
      'Walk the dog',
      'Wash the car',
    ]);
  });

  it('splits on multiple connectors in one long dictation', () => {
    const result = splitDictationIntoTasks(
      'buy provisions and call mom, then water the plants and also reply to emails'
    );
    expect(result).toEqual(['Buy provisions', 'Call mom', 'Water the plants', 'Reply to emails']);
  });

  it('de-duplicates near-identical fragments (case-insensitive)', () => {
    const result = splitDictationIntoTasks('call mom and Call Mom');
    expect(result).toEqual(['Call mom']);
  });

  it('trims trailing punctuation from fragments', () => {
    expect(splitDictationIntoTasks('buy milk.')).toEqual(['Buy milk']);
  });

  it('ignores empty fragments caused by repeated connectors', () => {
    expect(splitDictationIntoTasks('buy milk and and call mom')).toEqual(['Buy milk', 'Call mom']);
  });
});
