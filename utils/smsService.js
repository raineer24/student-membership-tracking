// Line 1-15: Semaphore API Fix - Query Parameter Authentication
import { normalizePhoneNumber, isValidPhilippinePhone, getNetworkProvider } from './phoneUtils.js';

// Line 5-15: SMS service configuration
const SMS_CONFIG = {
  API_BASE_URL: 'https://api.semaphore.co/api/v4',
  MAX_MESSAGE_LENGTH: 160,
  COST_PER_SMS: 0.60,
  COST_PER_CREDIT: 1.00,
  TIMEOUT_MS: 15000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY_MS: 1000
};

// Line 16-25: Valid sender names to try (in order of preference)
const VALID_SENDER_NAMES = [
  'OgmokBJJGym',    // Your registered name (exact case)
  'OGMOKBJJGYM',    // All caps version
  'Ogmok BJJ Gym',  // With spaces
  'SEMAPHORE',      // Default fallback
  null              // No sender name (uses default)
];

// Line 26-90: Enhanced SMS sending function with sender name fallback
export async function sendSMSViaSemaphore(phone, message, options = {}) {
  try {
    // Input validation
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

    // Try different sender names until one works
    let lastError = null;
    
    for (const senderName of VALID_SENDER_NAMES) {
      try {
        const result = await attemptSMSSend(apiKey, normalizedPhone, message, senderName);
        
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
        lastError = error;
        
        // If it's not a sender name issue, don't try other names
        if (!error.message.includes('sendername') && !error.message.includes('sender')) {
          throw error;
        }
        
        // Continue to next sender name
        continue;
      }
    }
    
    // If all sender names failed, throw the last error
    throw lastError || new Error('All sender name attempts failed');

  } catch (error) {
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

// Line 91-150: SMS send attempt function
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

  // Make API request
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();

    // Enhanced error checking for Semaphore's response format
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

// Line 151-250: FIXED SMS credits check using Semaphore's documented endpoints
export async function checkSMSCredits() {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  
  if (!apiKey) {
    console.log("❌ No SEMAPHORE_API_KEY found in environment variables");
    return {
      success: true,
      data: {
        balance: 0,
        remaining: 0,
        credits: 0,
        costPerSMS: SMS_CONFIG.COST_PER_SMS,
        currency: "PHP",
        provider: "Semaphore",
        lowBalance: true,
        lastUpdated: new Date().toISOString(),
        messagesRemaining: 0,
        note: "SMS service not configured. Add SEMAPHORE_API_KEY to environment variables."
      }
    };
  }

  console.log(`🔑 Using API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)} (length: ${apiKey.length})`);

  // FIXED: Use query parameter authentication as shown in Semaphore documentation
  const endpoints = [
    // Method 1: Account endpoint with query parameter (as per documentation)
    {
      url: `${SMS_CONFIG.API_BASE_URL}/account?apikey=${apiKey}`,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      name: 'Account Info (Query Param)'
    },
    
    // Method 2: Account transactions endpoint (as per documentation you referenced)
    {
      url: `${SMS_CONFIG.API_BASE_URL}/account/transactions?apikey=${apiKey}&limit=1`,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      name: 'Account Transactions (Query Param)'
    },
    
    // Method 3: Balance endpoint with query parameter
    {
      url: `${SMS_CONFIG.API_BASE_URL}/balance?apikey=${apiKey}`,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      name: 'Balance (Query Param)'
    },
    
    // Method 4: Fallback - Bearer token method
    {
      url: `${SMS_CONFIG.API_BASE_URL}/account`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      name: 'Account (Bearer Token)'
    }
  ];

  // Try each endpoint until one works
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    
    try {
      console.log(`🔍 Trying method ${i + 1}/${endpoints.length}: ${endpoint.name}`);
      console.log(`📡 URL: ${endpoint.url.replace(apiKey, '***API_KEY***')}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout
      
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: endpoint.headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const responseText = await response.text();
        console.log(`📄 Raw Response (first 500 chars):`, responseText.substring(0, 500));
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.log(`❌ JSON Parse Error:`, parseError.message);
          continue;
        }
        
        console.log(`📊 Response Structure:`, Object.keys(data));
        
        // Extract credits - try multiple possible fields and response formats
        let credits = 0;
        let accountInfo = {};
        
        // For account endpoint response
        if (data.credit_balance !== undefined) {
          credits = parseInt(data.credit_balance) || 0;
          accountInfo = {
            account_id: data.account_id,
            account_name: data.account_name,
            status: data.status
          };
          console.log(`✅ Found credit_balance: ${credits}`);
        }
        // For balance endpoint response
        else if (data.balance !== undefined) {
          credits = parseInt(data.balance) || 0;
          console.log(`✅ Found balance: ${credits}`);
        }
        // For transactions endpoint - get account info from first transaction or metadata
        else if (data.transactions && Array.isArray(data.transactions)) {
          // Look for account info in transactions response
          if (data.account_info) {
            credits = parseInt(data.account_info.credit_balance) || 0;
            accountInfo = data.account_info;
          } else if (data.transactions.length > 0 && data.transactions[0].remaining_balance !== undefined) {
            credits = parseInt(data.transactions[0].remaining_balance) || 0;
          }
          console.log(`✅ Found credits from transactions: ${credits}`);
        }
        // Handle other possible response formats
        else {
          console.log(`⚠️ Unknown response format. Full response:`, JSON.stringify(data, null, 2));
        }
        
        const balanceInPHP = credits * SMS_CONFIG.COST_PER_CREDIT;
        
        console.log(`✅ Method ${i + 1} (${endpoint.name}) successful`);
        console.log(`📊 Final result - Credits: ${credits}, PHP value: ₱${balanceInPHP}`);
        
        return {
          success: true,
          data: {
            balance: balanceInPHP,
            remaining: balanceInPHP,
            credits: credits,
            costPerSMS: SMS_CONFIG.COST_PER_SMS,
            currency: "PHP",
            lowBalance: credits < 10,
            provider: "Semaphore",
            lastUpdated: new Date().toISOString(),
            messagesRemaining: credits,
            endpoint: `Method ${i + 1} (${endpoint.name})`,
            accountInfo: accountInfo
          }
        };
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Method ${i + 1} (${endpoint.name}) failed: HTTP ${response.status}`);
        console.warn(`📄 Error Response:`, errorText.substring(0, 200));
      }
      
    } catch (error) {
      console.warn(`⚠️ Method ${i + 1} (${endpoint.name}) error:`, error.message);
      continue;
    }
  }

  // If all endpoints failed, return zero balance
  console.log("❌ All credits endpoints failed");
  
  return {
    success: true,
    data: {
      balance: 0,
      remaining: 0,
      credits: 0,
      costPerSMS: SMS_CONFIG.COST_PER_SMS,
      currency: "PHP",
      provider: "Semaphore",
      lowBalance: true,
      lastUpdated: new Date().toISOString(),
      messagesRemaining: 0,
      note: "Unable to fetch balance from Semaphore API using query parameter authentication."
    }
  };
}

// Line 251-260: Export constants and aliases
export const SMS_CONSTANTS = {
  COST_PER_SMS: SMS_CONFIG.COST_PER_SMS,
  COST_PER_CREDIT: SMS_CONFIG.COST_PER_CREDIT,
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