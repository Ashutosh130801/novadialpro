import axios from 'axios';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export interface PortStatus {
  portId: string;
  portNumber: number;
  status: 'online' | 'offline' | 'warning';
  carrier: string;
  signalStrength: number;
  simBalance?: number;
  callsToday: number;
  temperature?: number;
}

export interface GatewayInfo {
  id: string;
  model: string;
  firmware: string;
  ipAddress: string;
  uptime: number;
  totalPorts: number;
  activeCalls: number;
}

class DinstarService {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor() {
    this.baseUrl = process.env.DINSTAR_BASE_URL || 'http://192.168.1.100';
    this.username = process.env.DINSTAR_USERNAME || 'admin';
    this.password = process.env.DINSTAR_PASSWORD || 'admin';
  }

  private async request<T>(endpoint: string, params?: any): Promise<T> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        auth: { username: this.username, password: this.password },
        params,
        timeout: 5000,
      });
      return response.data as T;
    } catch (error) {
      logger.error(`Dinstar API error: ${endpoint}`, { error });
      throw error;
    }
  }

  private async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await axios.post(`${this.baseUrl}${endpoint}`, data, {
        auth: { username: this.username, password: this.password },
        timeout: 5000,
      });
      return response.data as T;
    } catch (error) {
      logger.error(`Dinstar POST error: ${endpoint}`, { error });
      throw error;
    }
  }

  // Gateway Management
  async getGatewayInfo(): Promise<GatewayInfo[]> {
    // In production: call actual Dinstar API
    return [
      {
        id: 'gw-001',
        model: 'DWG2000-8G',
        firmware: '3.0.5.12',
        ipAddress: '192.168.1.100',
        uptime: 864000,
        totalPorts: 8,
        activeCalls: 5,
      },
    ];
  }

  async getPortStatus(gatewayId: string): Promise<PortStatus[]> {
    // Mock response - in production call Dinstar HTTP API
    return [
      { portId: '1', portNumber: 1, status: 'online', carrier: 'AT&T', signalStrength: 5, simBalance: 45.20, callsToday: 23 },
      { portId: '2', portNumber: 2, status: 'online', carrier: 'Verizon', signalStrength: 4, simBalance: 32.50, callsToday: 18 },
      { portId: '3', portNumber: 3, status: 'warning', carrier: 'T-Mobile', signalStrength: 2, simBalance: 8.75, callsToday: 31 },
      { portId: '4', portNumber: 4, status: 'online', carrier: 'AT&T', signalStrength: 5, simBalance: 67.00, callsToday: 15 },
    ];
  }

  async rebootPort(gatewayId: string, portNumber: number): Promise<boolean> {
    try {
      await this.post(`/api/port/reboot`, { gatewayId, portNumber });
      logger.info(`Port ${portNumber} rebooted on gateway ${gatewayId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to reboot port ${portNumber}`, { error });
      return false;
    }
  }

  // SIM Management
  async sendUSSD(gatewayId: string, portNumber: number, ussdCode: string): Promise<string> {
    try {
      const result = await this.post(`/api/ussd/send`, { gatewayId, portNumber, ussdCode });
      logger.info(`USSD sent: ${ussdCode} to port ${portNumber}`);
      return (result as any).response || '';
    } catch (error) {
      logger.error(`USSD failed`, { error });
      throw error;
    }
  }

  async getSIMBalance(gatewayId: string, portNumber: number): Promise<number> {
    // In production: send USSD *123# or carrier-specific code
    const response = await this.sendUSSD(gatewayId, portNumber, '*123#');
    // Parse balance from USSD response
    return parseFloat(response.match(/\d+\.\d+/)?.[0] || '0');
  }

  // SMS Management
  async sendSMS(portNumber: number, phoneNumber: string, message: string): Promise<boolean> {
    try {
      await this.post('/api/sms/send', { portNumber, phoneNumber, message });
      logger.info(`SMS sent to ${phoneNumber} via port ${portNumber}`);
      return true;
    } catch (error) {
      logger.error(`SMS send failed`, { error });
      return false;
    }
  }

  async sendBulkSMS(portNumbers: number[], recipients: Array<{ phone: string; message: string }>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const recipient of recipients) {
      const portNumber = portNumbers[Math.floor(Math.random() * portNumbers.length)];
      const result = await this.sendSMS(portNumber, recipient.phone, recipient.message);
      if (result) success++;
      else failed++;
    }
    
    return { success, failed };
  }

  // Call Control via AMI
  async originateCall(extension: string, phoneNumber: string, gatewayId: string, portNumber?: number): Promise<boolean> {
    try {
      await this.post('/ami/action', {
        action: 'Originate',
        channel: `SIP/${extension}`,
        context: 'from-internal',
        exten: phoneNumber,
        priority: 1,
        callerId: `NovaDial <${process.env.DEFAULT_CALLER_ID || '1234567890'}>`,
        ...(portNumber && { variable: `GATEWAY_PORT=${portNumber}` }),
      });
      logger.info(`Call originated: ${extension} -> ${phoneNumber}`);
      return true;
    } catch (error) {
      logger.error(`Originate failed`, { error });
      return false;
    }
  }

  async hangupCall(channel: string): Promise<boolean> {
    try {
      await this.post('/ami/action', { action: 'Hangup', channel });
      return true;
    } catch (error) {
      logger.error(`Hangup failed`, { error });
      return false;
    }
  }

  // Monitoring & Alerts
  async getSystemHealth(): Promise<{ cpu: number; memory: number; temperature: number; status: string }> {
    // Mock health check
    return {
      cpu: 23,
      memory: 45,
      temperature: 42,
      status: 'healthy',
    };
  }

  async checkAlerts(): Promise<Array<{ type: string; severity: 'low' | 'medium' | 'high'; message: string; timestamp: number }>> {
    const alerts = [];
    const ports = await this.getPortStatus('gw-001');
    
    for (const port of ports) {
      if (port.status === 'offline') {
        alerts.push({ type: 'port_offline', severity: 'high' as const, message: `Port ${port.portNumber} is offline`, timestamp: Date.now() });
      }
      if (port.signalStrength < 2) {
        alerts.push({ type: 'low_signal', severity: 'medium' as const, message: `Port ${port.portNumber} has low signal`, timestamp: Date.now() });
      }
      if (port.simBalance !== undefined && port.simBalance < 10) {
        alerts.push({ type: 'low_balance', severity: 'low' as const, message: `Port ${port.portNumber} balance below $10`, timestamp: Date.now() });
      }
    }
    
    return alerts;
  }
}

export const dinstarService = new DinstarService();
export default dinstarService;
