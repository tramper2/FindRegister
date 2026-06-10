// Resistor Color Codes Data
export const COLOR_CODES = {
  black:  { value: 0, multiplier: 1,          tolerance: null,  hex: '#000000', label: '검정 (Black)' },
  brown:  { value: 1, multiplier: 10,         tolerance: 1,     hex: '#8B4513', label: '갈색 (Brown)' },
  red:    { value: 2, multiplier: 100,        tolerance: 2,     hex: '#FF0000', label: '빨강 (Red)' },
  orange: { value: 3, multiplier: 1000,       tolerance: 0.05,  hex: '#FF8C00', label: '주황 (Orange)' },
  yellow: { value: 4, multiplier: 10000,      tolerance: 0.02,  hex: '#FFD700', label: '노랑 (Yellow)' },
  green:  { value: 5, multiplier: 100000,     tolerance: 0.5,   hex: '#008000', label: '초록 (Green)' },
  blue:   { value: 6, multiplier: 1000000,    tolerance: 0.25,  hex: '#0000FF', label: '파랑 (Blue)' },
  violet: { value: 7, multiplier: 10000000,   tolerance: 0.1,   hex: '#EE82EE', label: '보라 (Violet)' },
  grey:   { value: 8, multiplier: 100000000,  tolerance: 0.01,  hex: '#808080', label: '회색 (Grey)' },
  white:  { value: 9, multiplier: 1000000000, tolerance: null,  hex: '#FFFFFF', label: '흰색 (White)' },
  gold:   { value: -1, multiplier: 0.1,       tolerance: 5,     hex: '#D4AF37', label: '금색 (Gold)' },
  silver: { value: -2, multiplier: 0.01,      tolerance: 10,    hex: '#C0C0C0', label: '은색 (Silver)' }
};

// Standard E24 base values (2 digits)
export const E24_BASE = [
  10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91
];

// Standard E96 base values (3 digits)
export const E96_BASE = [
  100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140, 143, 147, 150, 154, 158, 
  162, 165, 169, 174, 178, 182, 187, 191, 196, 200, 205, 210, 215, 221, 226, 232, 237, 243, 249, 255, 
  261, 267, 274, 280, 287, 294, 301, 309, 316, 324, 332, 340, 348, 357, 365, 374, 383, 392, 402, 412, 
  422, 432, 442, 453, 464, 475, 487, 499, 511, 523, 536, 549, 562, 576, 590, 604, 619, 634, 649, 665, 
  681, 698, 715, 732, 750, 768, 787, 806, 825, 845, 866, 887, 909, 931, 953, 976
];

export class ResistorCalculator {
  /**
   * Parse a string representing a resistance value (e.g. "100", "4.7k", "2k2", "1M5", "0.22")
   * into a number in Ohms. Returns null if invalid.
   */
  static parseValue(text) {
    if (!text) return null;
    let clean = text.trim().toLowerCase().replace(/ohms|ohm|Ω/gi, '').trim();
    if (clean === '') return null;

    // Check for formats like "2k2", "4m7", "0r22", "r15"
    const inlineUnitRegex = /^(\d*)([rkmg])(\d*)$/;
    const inlineMatch = clean.match(inlineUnitRegex);
    if (inlineMatch) {
      const integerPart = inlineMatch[1] || '0';
      const unit = inlineMatch[2];
      const decimalPart = inlineMatch[3] || '0';
      
      const numValue = parseFloat(`${integerPart}.${decimalPart}`);
      const multiplier = this.getUnitMultiplier(unit);
      return numValue * multiplier;
    }

    // Check for standard decimal with optional suffix (e.g. "1.5k", "100", "0.5")
    const standardRegex = /^([0-9.]+)\s*([rkmg]?)$/;
    const standardMatch = clean.match(standardRegex);
    if (standardMatch) {
      const numValue = parseFloat(standardMatch[1]);
      const unit = standardMatch[2];
      const multiplier = this.getUnitMultiplier(unit);
      return numValue * multiplier;
    }

    return null;
  }

  static getUnitMultiplier(unit) {
    switch (unit) {
      case 'k': return 1000;
      case 'm': return 1000000;
      case 'g': return 1000000000;
      case 'r':
      default: return 1;
    }
  }

  /**
   * Formats a resistance value nicely in Ohms, Kohms, Mohms, etc.
   */
  static formatValue(value) {
    if (value === null || value === undefined) return '';
    if (value >= 1000000000) {
      return `${parseFloat((value / 1000000000).toFixed(3))} GΩ`;
    }
    if (value >= 1000000) {
      return `${parseFloat((value / 1000000).toFixed(3))} MΩ`;
    }
    if (value >= 1000) {
      return `${parseFloat((value / 1000).toFixed(3))} kΩ`;
    }
    return `${parseFloat(value.toFixed(3))} Ω`;
  }

  /**
   * Convert resistance value into band colors.
   * returns array of color names.
   */
  static valueToBands(value, is5Band = false, tolerance = 5) {
    if (value <= 0) return null;

    const tolColor = Object.keys(COLOR_CODES).find(c => COLOR_CODES[c].tolerance === tolerance) || 'gold';
    
    // Find significant digits and exponent
    // For 4-band: sigDigits is 2-digit integer [10, 99], value = sigDigits * 10^exponent
    // For 5-band: sigDigits is 3-digit integer [100, 999], value = sigDigits * 10^exponent
    const digitsCount = is5Band ? 3 : 2;
    let exponent = Math.floor(Math.log10(value)) - (digitsCount - 1);
    
    // Multipliers can only go down to 10^-2 (silver)
    if (exponent < -2) {
      exponent = -2;
    }

    let sigDigits = Math.round(value / Math.pow(10, exponent));
    
    // Handle edge case where rounding increases the digits count (e.g. 99.9 -> 100)
    const maxDigits = Math.pow(10, digitsCount);
    if (sigDigits >= maxDigits) {
      sigDigits = Math.round(sigDigits / 10);
      exponent += 1;
    }

    const digitsStr = sigDigits.toString().padStart(digitsCount, '0');
    const bands = [];

    // Digits bands
    for (let i = 0; i < digitsCount; i++) {
      const digit = parseInt(digitsStr[i]);
      const color = Object.keys(COLOR_CODES).find(c => COLOR_CODES[c].value === digit);
      bands.push(color || 'black');
    }

    // Multiplier band
    const multColor = Object.keys(COLOR_CODES).find(c => COLOR_CODES[c].multiplier === Math.pow(10, exponent) || 
      (exponent === -1 && c === 'gold') || 
      (exponent === -2 && c === 'silver'));
    bands.push(multColor || 'black');

    // Tolerance band
    bands.push(tolColor);

    return bands;
  }

  /**
   * Decodes a list of colors into a resistance value and tolerance.
   * bands: array of color names (4 or 5 colors)
   */
  static bandsToValue(bands) {
    if (!bands || (bands.length !== 4 && bands.length !== 5)) {
      return null;
    }

    // Map band colors to codes
    const codes = bands.map(b => COLOR_CODES[b.toLowerCase()]).filter(c => c !== undefined);
    if (codes.length !== bands.length) return null; // Invalid color in list

    const is5Band = bands.length === 5;
    
    if (is5Band) {
      const d1 = codes[0].value;
      const d2 = codes[1].value;
      const d3 = codes[2].value;
      const mult = codes[3].multiplier;
      const tol = codes[4].tolerance;
      
      if (d1 === null || d2 === null || d3 === null || mult === null) return null;
      
      const val = (d1 * 100 + d2 * 10 + d3) * mult;
      return { value: val, tolerance: tol };
    } else {
      const d1 = codes[0].value;
      const d2 = codes[1].value;
      const mult = codes[2].multiplier;
      const tol = codes[3].tolerance;
      
      if (d1 === null || d2 === null || mult === null) return null;
      
      const val = (d1 * 10 + d2) * mult;
      return { value: val, tolerance: tol };
    }
  }

  /**
   * Check if a base value is standard E24/E96
   */
  static isStandardValue(value, is5Band = false) {
    if (value <= 0) return false;
    
    const digitsCount = is5Band ? 3 : 2;
    let exponent = Math.floor(Math.log10(value)) - (digitsCount - 1);
    
    // Check if the value can be represented exactly (within float precision)
    const step = Math.pow(10, exponent);
    if (Math.abs(Math.round(value / step) * step - value) > 1e-9 * value) {
      return false;
    }
    
    let sigDigits = Math.round(value / step);
    const maxDigits = Math.pow(10, digitsCount);
    if (sigDigits >= maxDigits) {
      sigDigits = Math.round(sigDigits / 10);
    }
    
    if (is5Band) {
      return E96_BASE.includes(sigDigits) || E24_BASE.includes(Math.round(sigDigits / 10));
    } else {
      return E24_BASE.includes(sigDigits);
    }
  }

  /**
   * Suggests nearest standard E24/E96 values.
   */
  static getNearestStandardValues(value, is5Band = false) {
    if (value <= 0) return [];
    
    const digitsCount = is5Band ? 3 : 2;
    const baseList = is5Band ? E96_BASE : E24_BASE;
    
    let exponent = Math.floor(Math.log10(value)) - (digitsCount - 1);
    let sigDigits = value / Math.pow(10, exponent);
    
    // Find nearest base in list
    let minDiff = Infinity;
    let nearestBaseIndex = 0;
    
    for (let i = 0; i < baseList.length; i++) {
      const diff = Math.abs(baseList[i] - sigDigits);
      if (diff < minDiff) {
        minDiff = diff;
        nearestBaseIndex = i;
      }
    }
    
    const results = [];
    
    // Return up to 3 values: index-1, index, index+1
    for (let offset = -1; offset <= 1; offset++) {
      let idx = nearestBaseIndex + offset;
      let exp = exponent;
      if (idx < 0) {
        idx = baseList.length - 1;
        exp -= 1;
      } else if (idx >= baseList.length) {
        idx = 0;
        exp += 1;
      }
      
      results.push(baseList[idx] * Math.pow(10, exp));
    }
    
    return results;
  }
}
