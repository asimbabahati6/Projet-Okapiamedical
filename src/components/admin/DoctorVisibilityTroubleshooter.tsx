import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Users,
  Zap,
  Info,
  Calendar,
  Building
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DoctorVisibilityStatus {
  id: string;
  full_name: string;
  email: string;
  specialization: string;
  staff_type: string;
  is_accepting_patients: boolean;
  current_status: string;
  department_id: string;
  department_name: string;
  dept_is_public: boolean;
  dept_is_active: boolean;
  user_is_active: boolean;
  role_name: string;
  confirmed_at: string | null;
  banned_until: string | null;
  visibility_status: string;
  visibility_priority: number;
  available_days_count: number;
  created_at: string;
  updated_at: string;
}

interface ActivationResult {
  doctor_id: string;
  activation_steps: Array<{
    step: string;
    action: string;
    success: boolean;
  }>;
  total_steps: number;
  timestamp: string;
}

export function DoctorVisibilityTroubleshooter() {
  const [doctors, setDoctors] = useState<DoctorVisibilityStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [bulkActivating, setBulkActivating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'invisible'>('invisible');
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);

  useEffect(() => {
    loadDoctors();
  }, [filter]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const viewName = filter === 'invisible'
        ? 'invisible_doctors_report'
        : 'doctors_visibility_status';

      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .order('visibility_priority', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateDoctor = async (doctorId: string) => {
    setActivating(doctorId);
    try {
      const { data, error } = await supabase.rpc('activate_doctor', {
        doctor_id: doctorId
      });

      if (error) throw error;

      const result = data as ActivationResult;

      alert(`Doctor activated successfully!\n\nSteps completed: ${result.total_steps}\n${result.activation_steps.map(s => `✓ ${s.action}`).join('\n')}`);

      await loadDoctors();
    } catch (error: any) {
      alert(`Error activating doctor: ${error.message}`);
    } finally {
      setActivating(null);
    }
  };

  const bulkActivateInvisible = async () => {
    if (!confirm('This will activate all invisible doctors (except banned/unconfirmed). Continue?')) {
      return;
    }

    setBulkActivating(true);
    try {
      const { data, error } = await supabase.rpc('bulk_activate_invisible_doctors');

      if (error) throw error;

      const result = data as {
        total_processed: number;
        total_activated: number;
        results: Array<any>;
        timestamp: string;
      };

      const successCount = result.results.filter(r => r.success).length;
      const failCount = result.results.filter(r => !r.success).length;

      alert(`Bulk activation complete!\n\nTotal processed: ${result.total_processed}\nSuccessful: ${successCount}\nFailed: ${failCount}`);

      await loadDoctors();
    } catch (error: any) {
      alert(`Error during bulk activation: ${error.message}`);
    } finally {
      setBulkActivating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Visible') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'Visible') return 'bg-green-100 text-green-800 border-green-200';
    if (status.includes('Banned')) return 'bg-red-100 text-red-800 border-red-200';
    if (status.includes('Email not confirmed')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 0) return <span className="text-xs text-green-600">Normal</span>;
    if (priority <= 2) return <span className="text-xs text-red-600 font-semibold">Critical</span>;
    if (priority <= 4) return <span className="text-xs text-orange-600 font-semibold">High</span>;
    return <span className="text-xs text-yellow-600">Medium</span>;
  };

  const toggleDetails = (doctorId: string) => {
    setExpandedDoctor(expandedDoctor === doctorId ? null : doctorId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading visibility status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Eye className="w-6 h-6 mr-2 text-blue-600" />
              Doctor Visibility Troubleshooter
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Diagnose and fix visibility issues for medical staff
            </p>
          </div>
          <button
            onClick={loadDoctors}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('invisible')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'invisible'
                  ? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <EyeOff className="w-4 h-4 inline mr-2" />
              Invisible Only ({doctors.filter(d => d.visibility_status !== 'Visible').length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              All Doctors
            </button>
          </div>

          {filter === 'invisible' && doctors.length > 0 && (
            <button
              onClick={bulkActivateInvisible}
              disabled={bulkActivating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center font-medium"
            >
              <Zap className={`w-4 h-4 mr-2 ${bulkActivating ? 'animate-pulse' : ''}`} />
              {bulkActivating ? 'Activating All...' : 'Bulk Activate All'}
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Doctors</p>
              <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Visible</p>
              <p className="text-2xl font-bold text-green-600">
                {doctors.filter(d => d.visibility_status === 'Visible').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Invisible</p>
              <p className="text-2xl font-bold text-orange-600">
                {doctors.filter(d => d.visibility_status !== 'Visible').length}
              </p>
            </div>
            <EyeOff className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Issues</p>
              <p className="text-2xl font-bold text-red-600">
                {doctors.filter(d => d.visibility_priority >= 1 && d.visibility_priority <= 2).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Doctors List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            {filter === 'invisible' ? 'Invisible Doctors' : 'All Doctors'} ({doctors.length})
          </h3>
        </div>

        {doctors.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'invisible' ? 'All doctors are visible!' : 'No doctors found'}
            </h3>
            <p className="text-gray-600">
              {filter === 'invisible'
                ? 'There are no visibility issues to report.'
                : 'No medical staff records exist in the system.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(doctor.visibility_status)}
                      <h4 className="text-lg font-semibold text-gray-900">
                        {doctor.full_name}
                      </h4>
                      {getPriorityBadge(doctor.visibility_priority)}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p><strong>Email:</strong> {doctor.email}</p>
                      <p><strong>Specialization:</strong> {doctor.specialization || 'Not set'}</p>
                      <p><strong>Staff Type:</strong> {doctor.staff_type}</p>
                      <p><strong>Department:</strong> {doctor.department_name || 'Not assigned'}</p>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(doctor.visibility_status)}`}>
                        {doctor.visibility_status}
                      </span>

                      {doctor.available_days_count > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {doctor.available_days_count} days available
                        </span>
                      )}
                    </div>

                    {expandedDoctor === doctor.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Info className="w-4 h-4 mr-2" />
                          Detailed Diagnostics
                        </h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Accepting Patients:</p>
                            <p className={doctor.is_accepting_patients ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {doctor.is_accepting_patients ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Current Status:</p>
                            <p className="font-semibold">{doctor.current_status}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">User Active:</p>
                            <p className={doctor.user_is_active ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {doctor.user_is_active ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Department Public:</p>
                            <p className={doctor.dept_is_public ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                              {doctor.dept_is_public ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Department Active:</p>
                            <p className={doctor.dept_is_active ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {doctor.dept_is_active ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Email Confirmed:</p>
                            <p className={doctor.confirmed_at ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {doctor.confirmed_at ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Role:</p>
                            <p className="font-semibold">{doctor.role_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Available Days:</p>
                            <p className="font-semibold">{doctor.available_days_count}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => toggleDetails(doctor.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      {expandedDoctor === doctor.id ? 'Hide Details' : 'Show Details'}
                    </button>

                    {doctor.visibility_status !== 'Visible' &&
                     !doctor.visibility_status.includes('Banned') &&
                     !doctor.visibility_status.includes('Email not confirmed') && (
                      <button
                        onClick={() => activateDoctor(doctor.id)}
                        disabled={activating === doctor.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center"
                      >
                        {activating === doctor.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
