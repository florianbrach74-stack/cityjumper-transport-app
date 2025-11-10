import { useState, useEffect } from 'react';
import { UserCheck, UserX, Users, Loader } from 'lucide-react';

const AssignEmployeeDropdown = ({ orderId, currentEmployeeId, currentEmployeeName, onAssigned }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employee-assignment/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignEmployee = async (employeeId) => {
    setAssigning(true);
    
    try {
      const response = await fetch(`/api/employee-assignment/orders/${orderId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ employeeId: employeeId || null })
      });

      if (response.ok) {
        const data = await response.json();
        if (onAssigned) {
          onAssigned(data.order);
        }
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error assigning employee:', error);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Loader className="h-4 w-4 animate-spin" />
        <span className="text-sm">Lädt...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current Assignment Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={assigning}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
          currentEmployeeId
            ? 'border-green-300 bg-green-50 hover:bg-green-100 text-green-700'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700'
        } ${assigning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {assigning ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : currentEmployeeId ? (
          <UserCheck className="h-4 w-4" />
        ) : (
          <Users className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {currentEmployeeName || 'Nicht zugewiesen'}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Menu */}
          <div className="absolute z-20 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
            {/* Unassign Option */}
            {currentEmployeeId && (
              <>
                <button
                  onClick={() => assignEmployee(null)}
                  disabled={assigning}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-gray-700 transition-colors"
                >
                  <UserX className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Zuweisung entfernen</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
              </>
            )}

            {/* Employee List */}
            {employees.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Keine Mitarbeiter verfügbar
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {employees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => assignEmployee(employee.id)}
                    disabled={assigning || employee.id === currentEmployeeId}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                      employee.id === currentEmployeeId
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      employee.id === currentEmployeeId
                        ? 'bg-green-200 text-green-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {employee.email}
                      </p>
                    </div>
                    {employee.id === currentEmployeeId && (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AssignEmployeeDropdown;
