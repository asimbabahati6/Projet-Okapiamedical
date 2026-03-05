export default function AttendanceCalendar({ currentDate }: { currentDate: Date }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="grid grid-cols-7 gap-2">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-700 py-2">
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <div
            key={index}
            className={`text-center py-3 rounded-lg ${
              day ? 'hover:bg-blue-50 cursor-pointer' : ''
            } ${day === new Date().getDate() && month === new Date().getMonth() ? 'bg-blue-100 font-bold' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}
