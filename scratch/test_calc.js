import { ResistorCalculator } from '../calculator.js';

function runTests() {
  console.log('=== START RESISTOR CALCULATOR TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function assertEqual(actual, expected, message) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      console.error(`       Actual:`, actual);
      console.error(`       Expected:`, expected);
      failed++;
    }
  }

  // 1. Test parseValue
  console.log('--- Test: ResistorCalculator.parseValue ---');
  assertEqual(ResistorCalculator.parseValue('100'), 100, 'Parse standard 100');
  assertEqual(ResistorCalculator.parseValue('1.5k'), 1500, 'Parse 1.5k decimal');
  assertEqual(ResistorCalculator.parseValue('2k2'), 2200, 'Parse 2k2 inline unit');
  assertEqual(ResistorCalculator.parseValue('0r22'), 0.22, 'Parse 0r22 inline unit');
  assertEqual(ResistorCalculator.parseValue('r15'), 0.15, 'Parse r15 leading inline unit');
  assertEqual(ResistorCalculator.parseValue('4.7M Ohms'), 4700000, 'Parse 4.7M with Ohms text');
  assertEqual(ResistorCalculator.parseValue('10G Ω'), 10000000000, 'Parse 10G with symbol');
  assertEqual(ResistorCalculator.parseValue('invalid'), null, 'Parse invalid text');
  assertEqual(ResistorCalculator.parseValue(''), null, 'Parse empty string');

  // 2. Test formatValue
  console.log('\n--- Test: ResistorCalculator.formatValue ---');
  assertEqual(ResistorCalculator.formatValue(100), '100 Ω', 'Format 100 Ω');
  assertEqual(ResistorCalculator.formatValue(2200), '2.2 kΩ', 'Format 2.2 kΩ');
  assertEqual(ResistorCalculator.formatValue(4700000), '4.7 MΩ', 'Format 4.7 MΩ');
  assertEqual(ResistorCalculator.formatValue(0.22), '0.22 Ω', 'Format 0.22 Ω');

  // 3. Test valueToBands
  console.log('\n--- Test: ResistorCalculator.valueToBands ---');
  // 4-band tests (default)
  assertEqual(
    ResistorCalculator.valueToBands(100, false, 5),
    ['brown', 'black', 'brown', 'gold'],
    '100 Ohm 4-band'
  );
  assertEqual(
    ResistorCalculator.valueToBands(2200, false, 5),
    ['red', 'red', 'red', 'gold'],
    '2.2k Ohm 4-band'
  );
  assertEqual(
    ResistorCalculator.valueToBands(4700000, false, 10),
    ['yellow', 'violet', 'green', 'silver'],
    '4.7M Ohm 4-band with 10% tolerance'
  );
  assertEqual(
    ResistorCalculator.valueToBands(0.22, false, 5),
    ['red', 'red', 'silver', 'gold'],
    '0.22 Ohm 4-band'
  );

  // 5-band tests
  assertEqual(
    ResistorCalculator.valueToBands(100, true, 1),
    ['brown', 'black', 'black', 'black', 'brown'],
    '100 Ohm 5-band'
  );
  assertEqual(
    ResistorCalculator.valueToBands(2200, true, 1),
    ['red', 'red', 'black', 'brown', 'brown'],
    '2.2k Ohm 5-band'
  );
  assertEqual(
    ResistorCalculator.valueToBands(4700000, true, 2),
    ['yellow', 'violet', 'black', 'yellow', 'red'],
    '4.7M Ohm 5-band'
  );

  // 4. Test bandsToValue
  console.log('\n--- Test: ResistorCalculator.bandsToValue ---');
  assertEqual(
    ResistorCalculator.bandsToValue(['brown', 'black', 'brown', 'gold']),
    { value: 100, tolerance: 5 },
    'Decode 100 Ohm 4-band'
  );
  assertEqual(
    ResistorCalculator.bandsToValue(['red', 'red', 'black', 'brown', 'brown']),
    { value: 2200, tolerance: 1 },
    'Decode 2.2k Ohm 5-band'
  );
  assertEqual(
    ResistorCalculator.bandsToValue(['red', 'red', 'silver', 'gold']),
    { value: 0.22, tolerance: 5 },
    'Decode 0.22 Ohm 4-band'
  );

  // 5. Test isStandardValue & Suggestions
  console.log('\n--- Test: Standard Values Check ---');
  assertEqual(ResistorCalculator.isStandardValue(100, false), true, '100 is standard (E24)');
  assertEqual(ResistorCalculator.isStandardValue(105, false), false, '105 is not standard in E24');
  assertEqual(ResistorCalculator.isStandardValue(105, true), true, '105 is standard in E96 (5-band)');
  
  const suggestions = ResistorCalculator.getNearestStandardValues(103, false);
  console.log('Suggestions for 103 (4-band):', suggestions.map(v => ResistorCalculator.formatValue(v)));
  assertEqual(suggestions.includes(100), true, 'Suggestions include 100');

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
