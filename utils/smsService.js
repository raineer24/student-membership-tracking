// Line 1: Final SMS service fix for Semaphore - Resolves sender name validation issue
// Based on actual error response: "The selected sendername is invalid."

import { normalizePhoneNumber, isValidPhilippinePhone, getNetworkProvider } from './phoneUtils.js';

// Line 5: SMS service configuration
const SMS_CONFIG = {
  API_BASE_URL: 'https://api.semaphore.co/api/v4',
  MAX_MESSAGE_LENGTH: 160,
  COST_PER_SMS: 0.60,
  TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 2, // Reduced for sender name retry
  RETRY_DELAY_MS: 1000
};

// Line 14: Valid sender names to try (in order of preference)
const VALID_SENDER_NAMES = [
  'OgmokBJJGym',    // Your registered name (exact case)
  'OGMOKBJJGYM',    // All caps version
  'Ogmok BJJ Gym',  // With spaces
  'SEMAPHORE',      // Default fallback
  null              // No sender name (uses default)
];

// Line 23: Enhanced function to send SMS with sender name fallback
export async function sendSMSViaSemaphore(phone, message, options = {}) {
  try {
    // Line 26: Input validation
    if (!phone || !message) {
      throw new Error('Phone number and message are required');
    }

    const apiKey = process.env.SEMAPHORE_API_KEY;
    if (!apiKey) {
      throw new Error('SMS service not configured. Missing SEMAPHORE_API_KEY environment variable.');
    }

    if (!isValidPhilippinePhone(phone)) {
      throw new Error(`Invalid Philippine phone number format: ${phone}`);
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const network = getNetworkProvider(normalizedPhone);

    console.log("📱 === SENDING SMS VIA SEMAPHORE (ENHANCED) ===");
    console.log("📞 Phone:", normalizedPhone);
    console.log("🌐 Network:", network);
    console.log("📝 Message:", message);
    console.log("📏 Length:", message.length, "characters");

    // Line 44: Try different sender names until one works
    let lastError = null;
    
    for (const senderName of VALID_SENDER_NAMES) {
      try {
        console.log(`👤 Attempting with sender name: ${senderName || 'default'}`);
        
        const result = await attemptSMSSend(apiKey, normalizedPhone, message, senderName);
        
        console.log("✅ SMS sent successfully!");
        console.log("👤 Working sender name:", senderName || 'default');
        
        return {
          success: true,
          messageId: result.message_id || result.id || 'unknown',
          phone: normalizedPhone,
          network: network,
          cost: SMS_CONFIG.COST_PER_SMS,
          response: `SMS sent successfully to ${normalizedPhone}`,
          timestamp: new Date().toISOString(),
          provider: 'Semaphore',
          senderName: senderName || 'default',
          status: 'sent'
        };
        
      } catch (error) {
        console.warn(`❌ Failed with sender name '${senderName || 'default'}':`, error.message);
        lastError = error;
        
        // If it's not a sender name issue, don't try other names
        if (!error.message.includes('sendername') && !error.message.includes('sender')) {
          throw error;
        }
        
        // Continue to next sender name
        continue;
      }
    }
    
    // Line 73: If all sender names failed, throw the last error
    throw lastError || new Error('All sender name attempts failed');

  } catch (error) {
    console.error("❌ SMS sending failed:", error.message);
    return {
      success: false,
      error: error.message,
      phone: phone,
      network: getNetworkProvider(phone),
      cost: 0,
      response: `Failed to send SMS: ${error.message}`,
      timestamp: new Date().toISOString(),
      provider: 'Semaphore'
    };
  }
}

// Line 89: Function to attempt SMS send with specific sender name
async function attemptSMSSend(apiKey, phone, message, senderName) {
  const payload = {
    apikey: apiKey,
    number: phone,
    message: message.trim()
  };
  
  // Only add sendername if provided
  if (senderName) {
    payload.sendername = senderName;
  }

  console.log("📤 Payload:", {
    ...payload,
    apikey: `${payload.apikey.substring(0, 8)}...`
  });

  // Line 104: Make API request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SMS_CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(`${SMS_CONFIG.API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log("📨 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log("📋 Response data:", responseData);

    // Line 127: Enhanced error checking for Semaphore's response format
    if (responseData.error || responseData.status === 'error') {
      throw new Error(responseData.message || responseData.error || 'SMS sending failed');
    }

    // Check for field-specific validation errors
    const errorFields = ['sendername', 'number', 'message', 'apikey'];
    for (const field of errorFields) {
      if (responseData[field] && Array.isArray(responseData[field])) {
        throw new Error(`${field}: ${responseData[field].join(', ')}`);
      }
    }

    // Check for success indicators
    if (responseData.message_id || responseData.id || responseData.success) {
      return responseData;
    }

    // If response doesn't contain error but also no success indicator
    if (Object.keys(responseData).length === 1 && responseData.sendername) {
      throw new Error(`sendername: ${responseData.sendername.join(', ')}`);
    }

    return responseData;

  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Line 150: Function to check SMS credits (unchanged)
export async function checkSMSCredits() {
  try {
    const apiKey = process.env.SEMAPHORE_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'SEMAPHORE_API_KEY not configured',
        data: {
          balance: 0,
          remaining: 0,
          costPerSMS: SMS_CONFIG.COST_PER_SMS,
          currency: "PHP",
          provider: "Semaphore"
        }
      };
    }

    const response = await fetch(`${SMS_CONFIG.API_BASE_URL}/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Credits API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        balance: data.credit_balance || 0,
        remaining: data.credit_balance || 0,
        costPerSMS: SMS_CONFIG.COST_PER_SMS,
        currency: "PHP",
        lowBalance: (data.credit_balance || 0) < 10,
        provider: "Semaphore"
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {
        balance: 0,
        remaining: 0,
        costPerSMS: SMS_CONFIG.COST_PER_SMS,
        currency: "PHP",
        provider: "Semaphore"
      }
    };
  }
}

// Line 198: Export constants and aliases
export const SMS_CONSTANTS = {
  COST_PER_SMS: SMS_CONFIG.COST_PER_SMS,
  MAX_MESSAGE_LENGTH: SMS_CONFIG.MAX_MESSAGE_LENGTH,
  SUPPORTED_NETWORKS: ['Globe', 'Smart', 'Sun', 'DITO'],
  PROVIDER: 'Semaphore',
  VALID_SENDER_NAMES: VALID_SENDER_NAMES.filter(name => name !== null)
};

export const sendSMSViaPhilSMS = sendSMSViaSemaphore;
export const sendSMS = sendSMSViaSemaphore;

export default {
  send: sendSMSViaSemaphore,
  sendSMSViaSemaphore: sendSMSViaSemaphore,
  sendSMSViaPhilSMS: sendSMSViaSemaphore,
  checkCredits: checkSMSCredits,
  constants: SMS_CONSTANTS
};