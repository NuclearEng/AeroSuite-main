import api from './api';

/**
 * Interface for backup verification statistics
 */
export interface BackupVerificationStats {
  period: {
    start: Date;
    end: Date;
  };
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  successRate: string;
  averageDuration: string;
  mostRecentVerification: BackupLog | null;
  status: 'healthy' | 'warning' | 'critical';
}

/**
 * Interface for backup verification log
 */
export interface BackupLog {
  _id: string;
  backupLocation: string;
  verificationDate: Date;
  success: boolean;
  duration: number;
  details?: string;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for verification results
 */
export interface VerificationResults {
  startTime: Date;
  endTime: Date;
  duration: number;
  localVerifications: BackupLog[];
  s3Verifications: BackupLog[];
  summary: {
    totalVerified: number;
    successful: number;
    failed: number;
  };
  error?: string;
}

/**
 * Service for interacting with the backup verification API
 */
class BackupVerificationService {
  /**
   * Get backup verification status
   * @param days Number of days to look back
   */
  async getVerificationStatus(days = 30): Promise<BackupVerificationStats> {
    const response = await api.get(`/api/v2/backups/verification/status?days=${days}`);
    return response.data.data;
  }

  /**
   * Get recent verification logs
   * @param limit Number of logs to retrieve
   */
  async getVerificationLogs(limit = 10): Promise<BackupLog[]> {
    const response = await api.get(`/api/v2/backups/verification/logs?limit=${limit}`);
    return response.data.data;
  }

  /**
   * Get recent verification failures
   * @param limit Number of failures to retrieve
   */
  async getVerificationFailures(limit = 10): Promise<BackupLog[]> {
    const response = await api.get(`/api/v2/backups/verification/failures?limit=${limit}`);
    return response.data.data;
  }

  /**
   * Trigger a verification of the most recent backup
   */
  async triggerVerification(): Promise<{ startTime: Date }> {
    const response = await api.post('/api/v2/backups/verification/verify');
    return response.data.data;
  }

  /**
   * Get verification statistics for a specific date range
   * @param startDate Start date
   * @param endDate End date
   */
  async getVerificationStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    let url = '/api/v2/backups/verification/statistics';
    const params = [];
    
    if (startDate) {
      params.push(`startDate=${startDate.toISOString()}`);
    }
    
    if (endDate) {
      params.push(`endDate=${endDate.toISOString()}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    const response = await api.get(url);
    return response.data.data;
  }

  /**
   * Get verification details for a specific backup
   * @param id Backup log ID
   */
  async getVerificationDetails(id: string): Promise<BackupLog> {
    const response = await api.get(`/api/v2/backups/verification/${id}`);
    return response.data.data;
  }
}

export default new BackupVerificationService(); 