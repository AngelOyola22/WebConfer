import { SettingsManager } from '../../components/admin/SettingsManager';
import AdminLayout from '../../components/layout/AdminLayout';
import './DashboardPage.css';

export default function SettingsPage() {
  return (
    <AdminLayout
      title="Configuración Global"
      subtitle="Administra las variables y ajustes del sistema"
    >
      <SettingsManager />
    </AdminLayout>
  );
}
