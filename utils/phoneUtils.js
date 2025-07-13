// Line 1: Philippine Mobile Network Prefixes for validation
const PHILIPPINE_MOBILE_PREFIXES = {
  // Globe Telecom prefixes
  globe: ['905', '906', '915', '916', '917', '926', '927', '935', '936', '937', '945', '953', '954', '955', '956', '965', '966', '967', '975', '976', '977', '978', '979', '995', '996', '997'],
  
  // Smart Communications prefixes  
  smart: ['908', '909', '910', '911', '912', '913', '914', '918', '919', '920', '921', '922', '923', '924', '925', '928', '929', '930', '931', '932', '933', '934', '938', '939', '940', '941', '942', '943', '944', '946', '947', '948', '949', '950', '951', '970', '971', '972', '973', '974', '980', '981', '982', '983', '984', '985', '986', '987', '988', '989', '992', '993', '994', '998', '999'],
  
  // Sun Cellular prefixes
  sun: ['922', '923', '924', '925', '926', '927', '928', '929', '930', '931', '932', '933', '934'],
  
  // DITO Telecommunity prefixes
  dito: ['895', '896', '897', '898', '991']
};

const ALL_VALID_PREFIXES = [
  ...PHILIPPINE_MOBILE_PREFIXES.globe,
  ...PHILIPPINE_MOBILE_PREFIXES.smart,
  ...PHILIPPINE_MOBILE_PREFIXES.sun,
  ...PHILIPPINE_MOBILE_PREFIXES.dito
];

export function isValidPhilippinePhone(phone) {
  // Line 33: Input validation
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Line 38: Clean the phone number - remove all non-digit characters except +
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '').trim();
  
  // Line 41: Extract only digits for validation
  const digitsOnly = cleaned.replace(/\D/g, '');

  // Line 44: Check different valid formats
  let phoneToCheck = '';
  
  // Line 47: Handle +639XXXXXXXXX format
  if (cleaned.startsWith('+639') && digitsOnly.length === 12) {
    phoneToCheck = digitsOnly.substring(2); // Remove '63' to get 9XXXXXXXXX
  }
  // Line 51: Handle 639XXXXXXXXX format (without +)
  else if (cleaned.startsWith('639') && digitsOnly.length === 12) {
    phoneToCheck = digitsOnly.substring(2); // Remove '63' to get 9XXXXXXXXX
  }
  // Line 55: Handle 09XXXXXXXXX format (local)
  else if (cleaned.startsWith('09') && digitsOnly.length === 11) {
    phoneToCheck = digitsOnly.substring(1); // Remove '0' to get 9XXXXXXXXX
  }
  // Line 59: Handle 9XXXXXXXXX format (without leading 0)
  else if (cleaned.startsWith('9') && digitsOnly.length === 10) {
    phoneToCheck = digitsOnly; // Use as-is
  }
  // Line 63: Invalid format
  else {
    return false;
  }

  // Line 67: Validate that we have exactly 10 digits starting with 9
  if (phoneToCheck.length !== 10 || !phoneToCheck.startsWith('9')) {
    return false;
  }

  // Line 72: Extract the 3-digit prefix (9XX)
  const prefix = phoneToCheck.substring(0, 3);
  
  // Line 75: Check if prefix is in our valid prefixes list
  return ALL_VALID_PREFIXES.includes(prefix);
}

export function normalizePhoneNumber(phone) {
  // Line 87: Validate input first
  if (!isValidPhilippinePhone(phone)) {
    return null;
  }

  // Line 92: Clean the input
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '').trim();
  const digitsOnly = cleaned.replace(/\D/g, '');

  // Line 96: Convert to 9XXXXXXXXX format first
  let nineFormat = '';
  
  if (cleaned.startsWith('+639') && digitsOnly.length === 12) {
    nineFormat = digitsOnly.substring(2);
  } else if (cleaned.startsWith('639') && digitsOnly.length === 12) {
    nineFormat = digitsOnly.substring(2);
  } else if (cleaned.startsWith('09') && digitsOnly.length === 11) {
    nineFormat = digitsOnly.substring(1);
  } else if (cleaned.startsWith('9') && digitsOnly.length === 10) {
    nineFormat = digitsOnly;
  }

  // Line 108: Return international format
  return '+63' + nineFormat;
}

export function formatPhoneForDisplay(phone) {
  const normalized = normalizePhoneNumber(phone);
  
  // Line 120: Return original if normalization failed
  if (!normalized) {
    return phone || '';
  }

  // Line 125: Format as +63 9XX XXX XXXX for better readability
  return normalized.replace(/(\+63)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
}

export function getNetworkProvider(phone) {
  const normalized = normalizePhoneNumber(phone);
  
  if (!normalized) {
    return 'unknown';
  }

  // Line 141: Extract the 3-digit prefix from normalized number
  const prefix = normalized.substring(3, 6); // Get XXX from +63XXXXXXXXX

  // Line 144: Check each network's prefixes
  if (PHILIPPINE_MOBILE_PREFIXES.globe.includes(prefix)) {
    return 'globe';
  }
  if (PHILIPPINE_MOBILE_PREFIXES.smart.includes(prefix)) {
    return 'smart';
  }
  if (PHILIPPINE_MOBILE_PREFIXES.sun.includes(prefix)) {
    return 'sun';
  }
  if (PHILIPPINE_MOBILE_PREFIXES.dito.includes(prefix)) {
    return 'dito';
  }

  return 'unknown';
}

export function validatePhoneNumbers(phones) {
  const results = {
    valid: [],
    invalid: [],
    summary: {
      total: 0,
      validCount: 0,
      invalidCount: 0,
      providers: {}
    }
  };

  if (!Array.isArray(phones)) {
    return results;
  }

  // Line 176: Process each phone number
  phones.forEach((phone, index) => {
    results.summary.total++;
    
    if (isValidPhilippinePhone(phone)) {
      const normalized = normalizePhoneNumber(phone);
      const provider = getNetworkProvider(phone);
      
      results.valid.push({
        index,
        original: phone,
        normalized,
        provider,
        formatted: formatPhoneForDisplay(phone)
      });
      
      results.summary.validCount++;
      
      // Line 192: Count providers
      if (!results.summary.providers[provider]) {
        results.summary.providers[provider] = 0;
      }
      results.summary.providers[provider]++;
    } else {
      results.invalid.push({
        index,
        original: phone,
        reason: 'Invalid Philippine mobile number format'
      });
      
      results.summary.invalidCount++;
    }
  });

  return results;
}

export function generateTestPhoneNumbers(count = 5) {
  const testNumbers = [];
  const testPrefixes = ['917', '918', '919', '920', '921']; // Globe test prefixes
  
  for (let i = 0; i < count; i++) {
    const prefix = testPrefixes[i % testPrefixes.length];
    // Line 217: Generate 7 random digits
    const suffix = Math.floor(1000000 + Math.random() * 9000000).toString();
    testNumbers.push(`+639${prefix}${suffix}`);
  }
  
  return testNumbers;
}

export function sanitizePhoneForStorage(phone) {
  return normalizePhoneNumber(phone);
}

export function hasPhoneChanged(oldPhone, newPhone) {
  const oldNormalized = normalizePhoneNumber(oldPhone);
  const newNormalized = normalizePhoneNumber(newPhone);
  
  return oldNormalized !== newNormalized;
}

export function maskPhoneNumber(phone) {
  const formatted = formatPhoneForDisplay(phone);
  
  if (!formatted || formatted.length < 10) {
    return '***-***-****';
  }

  // Line 255: Mask middle digits, show first 6 and last 3
  return formatted.replace(/(\+63 \d{3}) \d{3} (\d{4})/, '$1 XXX $2');
}

export const PHONE_CONSTANTS = {
  MAX_LENGTH: 13, // +639XXXXXXXXX
  MIN_LENGTH: 10, // 9XXXXXXXXX
  COUNTRY_CODE: '+63',
  NETWORKS: Object.keys(PHILIPPINE_MOBILE_PREFIXES),
  ALL_PREFIXES: ALL_VALID_PREFIXES
};

export default {
  isValid: isValidPhilippinePhone,
  normalize: normalizePhoneNumber,
  format: formatPhoneForDisplay,
  getProvider: getNetworkProvider,
  validateBatch: validatePhoneNumbers,
  sanitize: sanitizePhoneForStorage,
  mask: maskPhoneNumber,
  generateTest: generateTestPhoneNumbers,
  hasChanged: hasPhoneChanged,
  constants: PHONE_CONSTANTS
};