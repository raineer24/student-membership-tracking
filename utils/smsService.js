// Line 1: Complete SMS service for PhilSMS API integration - Production Ready
// Philippine SMS provider with Globe, Smart, DITO network support at ₱0.35 per SMS
import { normalizePhoneNumber, isValidPhilippinePhone, getNetworkProvider } from './phoneUtils.js';

// Line 5: SMS service configuration and constants
const SMS_CONFIG = {
  API_BASE_URL: 'https://app.philsms.com/api/v3',
  MAX_MESSAGE_LENGTH: 160,
  COST_PER_SMS: 0.35, // 42% cheaper than Semaphore!
  TIMEOUT_MS: 30000, // 30 seconds timeout
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000, // 2 seconds between retries
  SENDER_NAME: 'StudentGym' // Default sender name
};

// Line 15: Main function to send SMS via PhilSMS API
export async function sendSMSReminder(phoneNumber, message, student = null) {
  const controller = new AbortController();
  const timeout = SMS_CONFIG.TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Line 21: Validate API key
    const apiKey = process.env.PHILSMS_API_KEY;
    if (!apiKey) {
      throw new Error('SMS service not configured. Check PHILSMS_API_KEY.');
    }

    // Line 27: Validate phone number format
    const cleanPhone = isValidPhilippinePhone(phoneNumber);
    if (!cleanPhone.isValid) {
      throw new Error(`Invalid phone number: ${cleanPhone.error}`);
    }

    // Line 33: Validate message content
    if (!message || message.trim().length === 0) {
      throw new Error('Message content is required');
    }

    if (message.length > SMS_CONFIG.MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long. Maximum ${SMS_CONFIG.MAX_MESSAGE_LENGTH} characters allowed.`);
    }

    // Line 42: Prepare SMS request payload
    const smsData = {
      recipient: cleanPhone.formatted,
      message: message.trim(),
      sender_name: SMS_CONFIG.SENDER_NAME
    };

    // Line 49: Send SMS via PhilSMS API with retry logic
    let lastError;
    for (let attempt = 1; attempt <= SMS_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(`${SMS_CONFIG.API_BASE_URL}/sms/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'StudentMembershipGym/1.0',
            'Accept': 'application/json'
          },
          body: JSON.stringify(smsData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Line 64: Handle API response errors with specific error messages
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
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

        // Line 79: Parse successful response
        const result = await response.json();
        
        // Line 81: Validate PhilSMS response structure
        if (!result || result.status !== 'success') {
          throw new Error('Invalid response from PhilSMS service');
        }

        // Line 85: Return standardized successful response
        return {
          messageId: result.data?.message_id || result.data?.id || 'unknown',
          balance: result.data?.balance || null,
          status: 'sent',
          cost: SMS_CONFIG.COST_PER_SMS,
          provider: 'PhilSMS',
          raw: result // Keep full response for debugging
        };

      } catch (error) {
        lastError = error;
        
        // Line 96: Don't retry on authentication or rate limit errors
        if (error.message.includes('authentication') || 
            error.message.includes('rate limit') ||
            error.message.includes('credits')) {
          throw error;
        }

        // Line 102: Wait before retry (except on last attempt)
        if (attempt < SMS_CONFIG.RETRY_ATTEMPTS) {
          await sleep(SMS_CONFIG.RETRY_DELAY_MS * attempt);
        }
      }
    }

    // Line 108: All retry attempts failed
    throw lastError || new Error('SMS sending failed after all retry attempts');

  } catch (error) {
    clearTimeout(timeoutId);
    
    // Line 113: Handle specific error types
    if (error.name === 'AbortError') {
      throw new Error(`SMS request timeout after ${timeout}ms`);
    }
    
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to SMS service');
    }
    
    // Line 121: Re-throw other errors as-is
    throw error;
  }
}

// Line 125: Function to check SMS account balance and usage
export async function checkSMSCredits() {
  try {
    const apiKey = process.env.PHILSMS_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'SMS service not configured',
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
          note: 'SMS service not configured. Add PHILSMS_API_KEY to environment variables.'
        }
      };
    }

    // Line 143: Fetch account information from PhilSMS
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

    // Line 157: Calculate credit information
    const balance = accountData.data?.credits || 0;
    const used = accountData.data?.used_credits || 0;
    
    const credits = {
      balance: balance,
      used: used,
      remaining: balance,
      costPerSMS: SMS_CONFIG.COST_PER_SMS,
      currency: 'PHP',
      lowBalance: balance < 50, // Warning threshold
      lastUpdated: new Date().toISOString(),
      messagesRemaining: Math.floor(balance / SMS_CONFIG.COST_PER_SMS),
      provider: 'PhilSMS',
      estimatedCost: {
        conservative: Math.round(72 * SMS_CONFIG.COST_PER_SMS * 100) / 100, // 4 SMS per student
        moderate: Math.round(108 * SMS_CONFIG.COST_PER_SMS * 100) / 100,    // 6 SMS per student
        high: Math.round(144 * SMS_CONFIG.COST_PER_SMS * 100) / 100         // 8 SMS per student
      }
    };

    return {
      success: true,
      data: credits
    };

  } catch (error) {
    // Line 179: Return fallback data if API fails
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

// Line 196: Function to send test SMS (for API testing)
export async function sendTestSMS(phoneNumber) {
  const testMessage = "Test SMS from Student Membership System. If you receive this, SMS integration is working correctly!";
  
  try {
    const result = await sendSMSReminder(phoneNumber, testMessage);
    return {
      success: true,
      message: "Test SMS sent successfully",
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Line 213: Function to generate personalized reminder messages
export function generateReminderMessage(student, daysOverdue) {
  if (!student || !student.name) {
    return "Your gym membership payment is overdue. Please renew to continue accessing our facilities.";
  }

  // Line 219: Customize message based on how overdue the payment is
  if (daysOverdue <= 3) {
    return `Hi ${student.name}! Your gym membership expired ${daysOverdue} day(s) ago. Please renew soon to avoid service interruption. Thank you!`;
  } else if (daysOverdue <= 7) {
    return `Hi ${student.name}! Your membership has been overdue for ${daysOverdue} days. Please renew to continue accessing our facilities.`;
  } else if (daysOverdue <= 14) {
    return `Hi ${student.name}! Your membership expired ${daysOverdue} days ago. Please visit us to renew and restore your access immediately.`;
  } else {
    return `Hi ${student.name}! Your membership has been expired for ${daysOverdue} days. Please contact us to discuss renewal options.`;
  }
}

// Line 231: Function to validate SMS message content
export function validateSMSMessage(message) {
  if (!message || typeof message !== 'string') {
    return {
      isValid: false,
      error: 'Message is required and must be a string'
    };
  }

  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Message cannot be empty'
    };
  }

  if (trimmed.length > SMS_CONFIG.MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: `Message too long. Maximum ${SMS_CONFIG.MAX_MESSAGE_LENGTH} characters allowed. Current: ${trimmed.length}`
    };
  }

  return {
    isValid: true,
    message: trimmed,
    length: trimmed.length,
    remaining: SMS_CONFIG.MAX_MESSAGE_LENGTH - trimmed.length
  };
}

// Line 257: Function to calculate SMS costs for budgeting
export function calculateSMSCosts(studentCount, messagesPerStudent = 6) {
  const totalMessages = studentCount * messagesPerStudent;
  const totalCost = totalMessages * SMS_CONFIG.COST_PER_SMS;
  
  return {
    studentsCount: studentCount,
    messagesPerStudent: messagesPerStudent,
    totalMessages: totalMessages,
    costPerSMS: SMS_CONFIG.COST_PER_SMS,
    totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
    currency: 'PHP',
    estimatedMonthly: Math.round(totalCost * 100) / 100,
    savingsVsSemaphore: Math.round((totalMessages * 0.60 - totalCost) * 100) / 100,
    provider: 'PhilSMS'
  };
}

// Line 274: Function to get SMS service status and health
export async function getSMSServiceStatus() {
  try {
    const creditsResult = await checkSMSCredits();
    
    return {
      status: creditsResult.success ? 'operational' : 'degraded',
      provider: 'PhilSMS',
      lastChecked: new Date().toISOString(),
      credits: creditsResult.data,
      apiConfigured: !!process.env.PHILSMS_API_KEY,
      networkSupport: ['Globe', 'Smart', 'DITO', 'Sun'],
      costPerSMS: SMS_CONFIG.COST_PER_SMS,
      maxMessageLength: SMS_CONFIG.MAX_MESSAGE_LENGTH
    };
  } catch (error) {
    return {
      status: 'error',
      provider: 'PhilSMS',
      lastChecked: new Date().toISOString(),
      error: error.message,
      apiConfigured: !!process.env.PHILSMS_API_KEY
    };
  }
}

// Line 296: Helper function for delays in retry logic
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Line 301: Export SMS configuration constants for external use
export const SMS_CONSTANTS = {
  COST_PER_SMS: SMS_CONFIG.COST_PER_SMS,
  MAX_MESSAGE_LENGTH: SMS_CONFIG.MAX_MESSAGE_LENGTH,
  SUPPORTED_NETWORKS: ['Globe', 'Smart', 'DITO', 'Sun'],
  PROVIDER: 'PhilSMS',
  SAVINGS_VS_SEMAPHORE: '42%',
  TIMEOUT_MS: SMS_CONFIG.TIMEOUT_MS,
  RETRY_ATTEMPTS: SMS_CONFIG.RETRY_ATTEMPTS,
  SENDER_NAME: SMS_CONFIG.SENDER_NAME,
  API_ENDPOINTS: {
    SEND: `${SMS_CONFIG.API_BASE_URL}/sms/send`,
    CREDITS: `${SMS_CONFIG.API_BASE_URL}/user/credits`
  }
};

// Line 316: Export default object with all main functions for convenience
export default {
  send: sendSMSReminder,
  checkCredits: checkSMSCredits,
  sendTest: sendTestSMS,
  generateMessage: generateReminderMessage,
  validateMessage: validateSMSMessage,
  calculateCosts: calculateSMSCosts,
  getStatus: getSMSServiceStatus,
  constants: SMS_CONSTANTS
};