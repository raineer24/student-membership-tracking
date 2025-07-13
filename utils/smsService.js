// Line 1: Complete SMS service for PhilSMS API integration
// Philippine SMS provider with Globe, Smart, DITO network support at ₱0.35 per SMS
import { normalizePhoneNumber, isValidPhilippinePhone, getNetworkProvider } from './phoneUtils.js';

// Line 5: SMS service configuration and constants
const SMS_CONFIG = {
  API_BASE_URL: 'https://app.philsms.com/api/v3',
  MAX_MESSAGE_LENGTH: 160,
  COST_PER_SMS: 0.35, // 42% cheaper than Semaphore!
  TIMEOUT_MS: 30000, // 30 seconds timeout
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000 // 2 seconds between retries
};

// Line 14: Main function to send SMS via PhilSMS API (called by reminder API)
export async function sendSMSViaPhilSMS(phone, message, options = {}) {
  try {
    // Line 17: Input validation
    if (!phone || !message) {
      throw new Error('Phone number and message are required');
    }

    // Line 22: Validate API key
    const apiKey = process.env.PHILSMS_API_KEY;
    if (!apiKey) {
      throw new Error('SMS service not configured. Missing PHILSMS_API_KEY environment variable.');
    }

    // Line 28: Validate and normalize phone number
    if (!isValidPhilippinePhone(phone)) {
      throw new Error(`Invalid Philippine phone number: ${phone}`);
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const network = getNetworkProvider(normalizedPhone);

    // Line 35: Message length validation with warning
    if (message.length > SMS_CONFIG.MAX_MESSAGE_LENGTH) {
      console.warn(`⚠️ Message length (${message.length}) exceeds ${SMS_CONFIG.MAX_MESSAGE_LENGTH} characters. May be sent as multiple SMS.`);
    }

    // Line 40: Logging for debugging and monitoring
    console.log("📱 === SENDING SMS VIA PHILSMS ===");
    console.log("📞 Phone:", normalizedPhone);
    console.log("🌐 Network:", network);
    console.log("📝 Message length:", message.length, "characters");
    console.log("💰 Cost: ₱" + SMS_CONFIG.COST_PER_SMS + " (42% cheaper than Semaphore!)");
    console.log("⏰ Timestamp:", new Date().toISOString());

    // Line 48: Prepare request payload for PhilSMS
    const payload = {
      recipient: normalizedPhone.replace('+63', '63'), // PhilSMS expects 63XXXXXXXXX format
      message: message.trim(),
      sender_id: options.senderId || 'GymReminder' // Use your registered sender ID
    };

    // Line 55: Send SMS with retry logic
    const result = await sendWithRetry(apiKey, payload, options);

    console.log("✅ SMS sent successfully via PhilSMS!");
    console.log("📋 Message ID:", result.messageId);
    console.log("💰 Account balance:", result.balance);
    console.log("==============================");

    return {
      success: true,
      messageId: result.messageId,
      phone: normalizedPhone,
      network: network,
      cost: SMS_CONFIG.COST_PER_SMS,
      balance: result.balance,
      response: `SMS sent successfully to ${normalizedPhone}`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("❌ SMS sending failed:", error.message);
    return {
      success: false,
      error: error.message,
      phone: phone,
      network: getNetworkProvider(phone),
      cost: 0,
      response: `Failed to send SMS: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

// Line 78: Function to send SMS with automatic retry logic
async function sendWithRetry(apiKey, payload, options = {}) {
  const maxRetries = options.retryAttempts || SMS_CONFIG.RETRY_ATTEMPTS;
  const retryDelay = options.retryDelay || SMS_CONFIG.RETRY_DELAY_MS;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Line 84: Make the actual API call
      const result = await makeAPICall(apiKey, payload, options);
      
      // Line 87: Success - return immediately
      return result;

    } catch (error) {
      console.warn(`⚠️ SMS attempt ${attempt}/${maxRetries} failed:`, error.message);

      // Line 92: If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Line 96: Wait before retrying (exponential backoff)
      const waitTime = retryDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying in ${waitTime}ms...`);
      await sleep(waitTime);
    }
  }
}

// Line 103: Core function to make HTTP request to PhilSMS API
async function makeAPICall(apiKey, payload, options = {}) {
  const timeout = options.timeout || SMS_CONFIG.TIMEOUT_MS;

  // Line 107: Create abort controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Line 112: Make HTTP request to PhilSMS API
    const response = await fetch(`${SMS_CONFIG.API_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'StudentMembershipGym/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Line 125: Handle different HTTP status codes
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ PhilSMS API Error:", response.status, errorText);
      
      // Line 130: Specific error handling for different status codes
      switch (response.status) {
        case 401:
          throw new Error('SMS API authentication failed. Check PHILSMS_API_KEY.');
        case 402:
          throw new Error('Insufficient SMS credits. Top-up at philsms.com.');
        case 422:
          throw new Error('Invalid request data. Check phone number and message format.');
        case 429:
          throw new Error('SMS API rate limit exceeded. Try again later.');
        case 500:
          throw new Error('SMS service temporarily unavailable. Please try again.');
        default:
          throw new Error(`SMS API error: ${response.status} ${response.statusText}`);
      }
    }

    // Line 143: Parse successful response
    const result = await response.json();
    
    // Line 146: Validate PhilSMS response structure
    if (!result || result.status !== 'success') {
      throw new Error('Invalid response from PhilSMS service');
    }

    // Line 151: Extract relevant data from PhilSMS response
    return {
      messageId: result.data?.message_id || result.data?.id || 'unknown',
      balance: result.data?.balance || null,
      status: 'sent',
      raw: result // Keep full response for debugging
    };

  } catch (error) {
    clearTimeout(timeoutId);
    
    // Line 160: Handle network and timeout errors
    if (error.name === 'AbortError') {
      throw new Error(`SMS request timeout after ${timeout}ms`);
    }
    
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to SMS service');
    }
    
    // Line 168: Re-throw other errors as-is
    throw error;
  }
}

// Line 172: Function to check SMS account balance and usage
export async function checkSMSCredits() {
  try {
    const apiKey = process.env.PHILSMS_API_KEY;
    
    if (!apiKey) {
      throw new Error('SMS service not configured');
    }

    console.log("💳 Checking PhilSMS credits...");

    // Line 182: Fetch account information from PhilSMS
    const response = await fetch(`${SMS_CONFIG.API_BASE_URL}/user/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'StudentMembershipGym/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Credits check failed: ${response.status} ${response.statusText}`);
    }

    const accountData = await response.json();

    // Line 195: Calculate credit information
    const credits = {
      balance: accountData.data?.credits || 0,
      used: accountData.data?.used_credits || 0,
      remaining: accountData.data?.credits || 0,
      costPerSMS: SMS_CONFIG.COST_PER_SMS,
      currency: 'PHP',
      lowBalance: (accountData.data?.credits || 0) < 50, // Lower threshold since it's cheaper
      lastUpdated: new Date().toISOString(),
      messagesRemaining: Math.floor((accountData.data?.credits || 0) / SMS_CONFIG.COST_PER_SMS),
      provider: 'PhilSMS'
    };

    console.log("💰 Credits:", credits.balance);
    console.log("📨 Messages remaining:", credits.messagesRemaining);
    console.log("⚠️ Low balance:", credits.lowBalance);

    return {
      success: true,
      data: credits
    };

  } catch (error) {
    console.error("❌ Credits check failed:", error.message);
    
    // Line 214: Return fallback data if API fails
    return {
      success: false,
      error: error.message,
      data: {
        balance: 0,
        used: 0,
        remaining: 0,
        costPerSMS: SMS_CONFIG.COST_PER_SMS,
        currency: 'PHP',
        lowBalance: true,
        lastUpdated: new Date().toISOString(),
        messagesRemaining: 0,
        provider: 'PhilSMS',
        note: 'Unable to fetch current balance - SMS service may be temporarily unavailable'
      }
    };
  }
}

// Line 231: Function to check SMS delivery status (if supported by PhilSMS)
export async function checkSMSStatus(messageId) {
  try {
    const apiKey = process.env.PHILSMS_API_KEY;
    
    if (!apiKey) {
      throw new Error('SMS service not configured');
    }

    // Line 240: Check message status via PhilSMS API
    const response = await fetch(`${SMS_CONFIG.API_BASE_URL}/sms/status/${messageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const statusData = await response.json();

    return {
      success: true,
      messageId: messageId,
      status: statusData.data?.status || 'unknown',
      deliveredAt: statusData.data?.delivered_at || null,
      error: statusData.data?.error || null
    };

  } catch (error) {
    console.error("❌ Status check failed:", error.message);
    return {
      success: false,
      messageId: messageId,
      error: error.message
    };
  }
}

// Line 267: Function to send bulk SMS (for future use)
export async function sendBulkSMS(recipients, message, options = {}) {
  const results = [];
  const batchSize = options.batchSize || 10;
  const delayBetweenBatches = options.delay || 1000;

  console.log(`📱 Starting bulk SMS to ${recipients.length} recipients in batches of ${batchSize}`);

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    console.log(`📨 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recipients.length / batchSize)}`);

    // Line 277: Process batch in parallel
    const batchPromises = batch.map(async (recipient) => {
      try {
        const result = await sendSMSViaPhilSMS(recipient.phone, message, options);
        return {
          recipient: recipient,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        };
      } catch (error) {
        return {
          recipient: recipient,
          success: false,
          error: error.message
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Line 295: Delay between batches to avoid rate limiting
    if (i + batchSize < recipients.length) {
      console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
      await sleep(delayBetweenBatches);
    }
  }

  // Line 301: Calculate summary statistics
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Bulk SMS completed: ${successful} sent, ${failed} failed`);

  return {
    success: true,
    results: results,
    summary: {
      total: recipients.length,
      successful: successful,
      failed: failed,
      successRate: Math.round((successful / recipients.length) * 100)
    }
  };
}

// Line 317: Helper function for delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Line 322: Function to validate SMS message content
export function validateSMSMessage(message) {
  const errors = [];

  if (!message || typeof message !== 'string') {
    errors.push('Message must be a non-empty string');
  }

  if (message && message.length === 0) {
    errors.push('Message cannot be empty');
  }

  if (message && message.length > SMS_CONFIG.MAX_MESSAGE_LENGTH) {
    errors.push(`Message too long: ${message.length}/${SMS_CONFIG.MAX_MESSAGE_LENGTH} characters`);
  }

  // Line 336: Check for potentially problematic content
  const prohibitedWords = ['scam', 'free money', 'click here', 'urgent transfer'];
  const foundProhibited = prohibitedWords.filter(word => 
    message.toLowerCase().includes(word.toLowerCase())
  );

  if (foundProhibited.length > 0) {
    errors.push(`Message contains potentially flagged words: ${foundProhibited.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: message && message.length > 140 ? ['Message is close to character limit'] : []
  };
}

// Line 350: Function to generate SMS usage report
export async function generateSMSReport(startDate, endDate) {
  try {
    const apiKey = process.env.PHILSMS_API_KEY;
    
    if (!apiKey) {
      throw new Error('SMS service not configured');
    }

    // Line 358: Format dates for API
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];

    const response = await fetch(`${SMS_CONFIG.API_BASE_URL}/reports/usage?start=${start}&end=${end}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Report generation failed: ${response.status}`);
    }

    const reportData = await response.json();

    return {
      success: true,
      period: { start: startDate, end: endDate },
      data: {
        totalSent: reportData.data?.total_sent || 0,
        totalCost: reportData.data?.total_cost || 0,
        successRate: reportData.data?.success_rate || 0,
        dailyBreakdown: reportData.data?.daily_breakdown || []
      }
    };

  } catch (error) {
    console.error("❌ Report generation failed:", error.message);
    return {
      success: false,
      error: error.message,
      period: { start: startDate, end: endDate }
    };
  }
}

// Line 389: Export SMS configuration for use by other modules
export const SMS_CONSTANTS = {
  COST_PER_SMS: SMS_CONFIG.COST_PER_SMS,
  MAX_MESSAGE_LENGTH: SMS_CONFIG.MAX_MESSAGE_LENGTH,
  SUPPORTED_NETWORKS: ['Globe', 'Smart', 'DITO'],
  PROVIDER: 'PhilSMS',
  SAVINGS_VS_SEMAPHORE: '42%',
  API_ENDPOINTS: {
    SEND: `${SMS_CONFIG.API_BASE_URL}/sms/send`,
    CREDITS: `${SMS_CONFIG.API_BASE_URL}/user/credits`,
    STATUS: `${SMS_CONFIG.API_BASE_URL}/sms/status`,
    REPORTS: `${SMS_CONFIG.API_BASE_URL}/reports/usage`
  }
};

// Line 403: Export default object with all main functions
export default {
  send: sendSMSViaPhilSMS,
  checkCredits: checkSMSCredits,
  checkStatus: checkSMSStatus,
  sendBulk: sendBulkSMS,
  validate: validateSMSMessage,
  generateReport: generateSMSReport,
  constants: SMS_CONSTANTS
};