const { calculateDistanceAndDuration } = require('./server/services/distanceService');

async function test() {
  console.log('Testing distance calculation...\n');
  
  const result = await calculateDistanceAndDuration(
    'Bukesweg 29',
    '12557',
    'Berlin',
    'Adolf-Menzel-Straße 71',
    '12621',
    'Berlin'
  );
  
  console.log('\nResult:', result);
}

test();
