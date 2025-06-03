import React from 'react';
import PropTypes from 'prop-types';
import { STATUS_STYLES } from '../../../statusStyles';

const ConfirmStatusModal = ({ isOpen, onClose, onConfirm, action }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative overflow-hidden p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm {action === 'approve' ? 'Approval' : 'Rejection'}</h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to {action === 'approve' ? 'approve' : 'reject'} this reservation?
        </p>
        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${action === 'approve' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmStatusModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  action: PropTypes.oneOf(['approve', 'reject']).isRequired,
};

export default ConfirmStatusModal;
