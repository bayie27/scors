import { useEffect, useState } from 'react';

export default function ReservationModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  initialData = {},
  venues = [],
  equipmentList = [],
  statuses = [],
  isEdit = false,
}) {
  const [form, setForm] = useState({
    purpose: '',
    activity_date: '',
    start_time: '',
    end_time: '',
    venue_id: '',
    equipment_id: '',
    reservation_status_id: '',
    reserved_by: '',
    officer_in_charge: '',
    contact_no: '',
  });

  useEffect(() => {
    if (open && initialData) {
      setForm({
        ...form,
        ...initialData,
        activity_date: initialData.activity_date ? initialData.activity_date.slice(0, 10) : '',
        start_time: initialData.start_time ? initialData.start_time.slice(0, 5) : '',
        end_time: initialData.end_time ? initialData.end_time.slice(0, 5) : '',
      });
    }
    // eslint-disable-next-line
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl">×</button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold mb-2">{isEdit ? 'Edit Reservation' : 'New Reservation'}</h2>
          <div>
            <label className="block text-sm font-medium">Purpose</label>
            <input type="text" name="purpose" value={form.purpose} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium">Date</label>
              <input type="date" name="activity_date" value={form.activity_date} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Start Time</label>
              <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">End Time</label>
              <input type="time" name="end_time" value={form.end_time} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium">Venue</label>
              <select name="venue_id" value={form.venue_id} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option value="">None</option>
                {venues.map((v) => (
                  <option key={v.venue_id} value={v.venue_id}>{v.venue_name ? v.venue_name : `Venue ${v.venue_id}`}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Equipment</label>
              <select name="equipment_id" value={form.equipment_id} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option value="">None</option>
                {equipmentList.map((e) => (
                  <option key={e.equipment_id} value={e.equipment_id}>{e.equipment_name ? e.equipment_name : `Equipment ${e.equipment_id}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium">Reserved By</label>
              <input type="text" name="reserved_by" value={form.reserved_by} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Officer in Charge</label>
              <input type="text" name="officer_in_charge" value={form.officer_in_charge} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Contact No.</label>
              <input type="tel" name="contact_no" value={form.contact_no} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            {isEdit && (
              <button type="button" onClick={onDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
            )}
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{isEdit ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
