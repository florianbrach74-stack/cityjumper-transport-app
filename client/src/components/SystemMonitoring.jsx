import React, { useState, useEffect } from 'react';
import {
  Activity, Database, HardDrive, Cpu, Users, Package,
  FileText, DollarSign, TrendingUp, RefreshCw, Server,
  Clock, Zap, AlertCircle
} from 'lucide-react';
import api from '../services/api';

const SystemMonitoring = () => {
  const [health, setHealth] = useState(null);
  const [database, setDatabase] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [healthRes, dbRes, statsRes] = await Promise.all([
        api.get('/system/health'),
        api.get('/system/database'),
        api.get('/system/stats')
      ]);

      setHealth(healthRes.data.health);
      setDatabase(dbRes.data.database);
      setStats(statsRes.data.stats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading && !health) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System-Monitoring</h2>
            <p className="mt-1 text-sm text-gray-600">
              Letzte Aktualisierung: {lastUpdate.toLocaleTimeString('de-DE')}
            </p>
          </div>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* System Health */}
      {health && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Server className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">System-Status</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Uptime */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Clock className="h-8 w-8 text-green-600" />
                <span className="text-xs font-medium text-green-600">ONLINE</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatUptime(health.uptime)}
              </p>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>

            {/* Memory */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <HardDrive className="h-8 w-8 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">{health.memory.usage_percent}%</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatBytes(health.memory.used)}
              </p>
              <p className="text-sm text-gray-600">von {formatBytes(health.memory.total)}</p>
            </div>

            {/* CPU */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Cpu className="h-8 w-8 text-purple-600" />
                <span className="text-xs font-medium text-purple-600">{health.cpu.cores} Cores</span>
              </div>
              <p className="mt-2 text-sm font-bold text-gray-900">
                {health.cpu.load_average[0].toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Load Average (1m)</p>
            </div>

            {/* Platform */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Activity className="h-8 w-8 text-gray-600" />
                <span className="text-xs font-medium text-gray-600">{health.platform.arch}</span>
              </div>
              <p className="mt-2 text-sm font-bold text-gray-900">
                {health.platform.platform}
              </p>
              <p className="text-sm text-gray-600">{health.platform.type}</p>
            </div>
          </div>
        </div>
      )}

      {/* Database Stats */}
      {database && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Database className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Datenbank</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Datenbankgröße</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{database.size}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Aktive Verbindungen</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{database.connections.active_connections}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Gesamt Verbindungen</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{database.connections.total_connections}</p>
            </div>
          </div>

          {/* Top Tables */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Größte Tabellen</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tabelle</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Größe</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {database.tables.slice(0, 5).map((table, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{table.tablename}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{table.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Application Stats */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Benutzer</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gesamt</span>
                <span className="text-lg font-bold text-gray-900">{stats.users.total_users}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Kunden</span>
                <span className="text-lg font-semibold text-blue-600">{stats.users.customers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Auftragnehmer</span>
                <span className="text-lg font-semibold text-green-600">{stats.users.contractors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Verifiziert</span>
                <span className="text-lg font-semibold text-purple-600">{stats.users.verified_contractors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Neue (30 Tage)</span>
                <span className="text-lg font-semibold text-orange-600">{stats.users.new_users_30d}</span>
              </div>
            </div>
          </div>

          {/* Orders Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Package className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Aufträge</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gesamt</span>
                <span className="text-lg font-bold text-gray-900">{stats.orders.total_orders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ausstehend</span>
                <span className="text-lg font-semibold text-yellow-600">{stats.orders.pending_orders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Transit</span>
                <span className="text-lg font-semibold text-blue-600">{stats.orders.in_transit_orders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Abgeschlossen</span>
                <span className="text-lg font-semibold text-green-600">{stats.orders.completed_orders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Letzte 7 Tage</span>
                <span className="text-lg font-semibold text-purple-600">{stats.orders.orders_7d}</span>
              </div>
            </div>
          </div>

          {/* Invoices Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Rechnungen</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gesamt</span>
                <span className="text-lg font-bold text-gray-900">{stats.invoices.total_invoices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bezahlt</span>
                <span className="text-lg font-semibold text-green-600">
                  {stats.invoices.paid_invoices} (€{parseFloat(stats.invoices.paid_amount || 0).toFixed(2)})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Unbezahlt</span>
                <span className="text-lg font-semibold text-yellow-600">
                  {stats.invoices.unpaid_invoices} (€{parseFloat(stats.invoices.unpaid_amount || 0).toFixed(2)})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Überfällig</span>
                <span className="text-lg font-semibold text-red-600">
                  {stats.invoices.overdue_invoices} (€{parseFloat(stats.invoices.overdue_amount || 0).toFixed(2)})
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Umsatz</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gesamt-Umsatz</span>
                <span className="text-2xl font-bold text-green-600">
                  €{parseFloat(stats.orders.total_revenue || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ø Auftragswert</span>
                <span className="text-lg font-semibold text-blue-600">
                  €{parseFloat(stats.orders.avg_order_value || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Aufträge (30 Tage)</span>
                <span className="text-lg font-semibold text-purple-600">{stats.orders.orders_30d}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMonitoring;
