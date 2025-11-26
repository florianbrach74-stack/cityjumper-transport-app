// Debug der addMinutesToTime Funktion
const addMinutesToTime = (timeString, minutes) => {
  console.log('Input timeString:', timeString);
  console.log('Input minutes:', minutes);
  
  if (!timeString) return '';
  
  const parts = timeString.split(':');
  console.log('Split parts:', parts);
  
  const [hours, mins] = parts.map(Number);
  console.log('Parsed hours:', hours, typeof hours);
  console.log('Parsed mins:', mins, typeof mins);
  console.log('Minutes to add:', minutes, typeof minutes);
  console.log('Calculation: mins + minutes =', mins, '+', minutes, '=', mins + minutes);
  
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);
  
  const result = date.toTimeString().slice(0, 5);
  console.log('Result:', result);
  console.log('---');
  
  return result;
};

// Test mit verschiedenen Eingaben
addMinutesToTime('12:30', 30);
addMinutesToTime('12:30', '30');  // Was wenn minutes ein String ist?
