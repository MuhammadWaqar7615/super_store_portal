import React, { useState } from 'react';
import { Database, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import backupService from '../services/backupService';

const BackupRestore = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      setStats(null);
      const response = await backupService.exportData();
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `super_store_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setMessage('Backup exported successfully.');
    } catch (err) {
      setError('Failed to export backup.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        setError('');
        setMessage('');
        setStats(null);
        
        const jsonData = JSON.parse(event.target.result);
        const response = await backupService.importData(jsonData);
        
        setMessage(response.message || 'Data imported successfully.');
        setStats(response.stats);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to import backup.');
        console.error(err);
      } finally {
        setLoading(false);
        e.target.value = ''; // Reset file input
      }
    };
    reader.onerror = () => {
      setError('Error reading file.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="p-3 rounded-2xl bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
            <Database size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Data Management</h1>
            <p className="text-gray-400 mt-1">Backup your complete site data or restore from an existing backup.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={20} />
            <div className="text-emerald-400 text-sm">
              {message}
              {stats && (
                <div className="mt-2 text-xs opacity-80">
                  {Object.entries(stats).map(([collection, result]) => (
                    (result.upserted > 0 || result.modified > 0) && (
                      <div key={collection}>
                        {collection}: {result.upserted} inserted/updated, {result.modified} modified
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 relative z-10">
          {/* Export Section */}
          <div className="bg-black/50 p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
              <Download size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Export Data</h3>
            <p className="text-gray-400 text-sm mb-6 flex-1">
              Download a complete backup of your site data, including products, customers, suppliers, and transaction history.
            </p>
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Download size={18} />
                  Download Backup
                </>
              )}
            </button>
          </div>

          {/* Import Section */}
          <div className="bg-black/50 p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Import Data</h3>
            <p className="text-gray-400 text-sm mb-6 flex-1">
              Restore your site data from a previous backup file. Existing data is preserved, and backup data is added or updated alongside it.
            </p>
            <label className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden group">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Upload size={18} />
                  Select File & Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    disabled={loading}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
