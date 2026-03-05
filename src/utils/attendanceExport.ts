interface StaffAttendance {
  staff: {
    id: string;
    full_name: string;
    email: string;
    role: { name: string };
  };
  today_status: 'present' | 'late' | 'absent' | 'on_leave' | null;
  this_week_present: number;
  this_month_present: number;
  total_hours_month: number;
}

export async function exportAttendanceToCSV(
  staffAttendance: StaffAttendance[],
  currentDate: Date,
  view: 'day' | 'week' | 'month'
) {
  const headers = ['Nom', 'Email', 'Rôle', 'Statut Aujourd\'hui', 'Présent Cette Semaine', 'Présent Ce Mois', 'Heures Totales'];

  const rows = staffAttendance.map(sa => [
    sa.staff.full_name,
    sa.staff.email,
    sa.staff.role.name,
    sa.today_status || 'absent',
    sa.this_week_present.toString(),
    sa.this_month_present.toString(),
    sa.total_hours_month.toString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `attendance_${currentDate.toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportAttendanceToPDF(
  staffAttendance: StaffAttendance[],
  currentDate: Date,
  view: 'day' | 'week' | 'month'
) {
  const printWindow = window.open('', '', 'height=800,width=1000');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Rapport de Présence</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          h1 {
            color: #1e40af;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 10px;
          }
          .header-info {
            margin: 20px 0;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #1e40af;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .status {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-present { background-color: #d1fae5; color: #065f46; }
          .status-late { background-color: #fef3c7; color: #92400e; }
          .status-absent { background-color: #fee2e2; color: #991b1b; }
          .status-on_leave { background-color: #dbeafe; color: #1e40af; }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <h1>Rapport de Présence</h1>
        <div class="header-info">
          <p><strong>Date:</strong> ${currentDate.toLocaleDateString('fr-FR')}</p>
          <p><strong>Total Personnel:</strong> ${staffAttendance.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Semaine</th>
              <th>Mois</th>
              <th>Heures</th>
            </tr>
          </thead>
          <tbody>
            ${staffAttendance.map(sa => `
              <tr>
                <td>${sa.staff.full_name}</td>
                <td>${sa.staff.email}</td>
                <td>${sa.staff.role.name}</td>
                <td><span class="status status-${sa.today_status || 'absent'}">${sa.today_status || 'absent'}</span></td>
                <td>${sa.this_week_present} j</td>
                <td>${sa.this_month_present} j</td>
                <td>${sa.total_hours_month}h</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
