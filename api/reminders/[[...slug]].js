import { PrismaClient } from '@prisma/client';
import { authenticate, authorizeRole } from '../../utils/auth.js';
import { 
  isValidPhilippinePhone, 
  normalizePhoneNumber, 
  formatPhoneForDisplay,
  getNetworkProvider 
} from '../../utils/phoneUtils.js';