// Test der addMinutesToTime Funktion
const addMinutesToTime = (timeString, minutes) => {
  if (!timeString) return '';
  const [hours, mins] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);
  return date.toTimeString().slice(0, 5);
};

// Test
console.log('Input: 12:30, +30min');
console.log('Output:', addMinutesToTime('12:30', 30));
console.log('Expected: 13:00');

console.log('\nInput: 12:03, +30min');
console.log('Output:', addMinutesToTime('12:03', 30));
console.log('Expected: 12:33');
