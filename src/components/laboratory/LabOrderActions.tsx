import { Eye, Edit, Trash2 } from 'lucide-react';
import { RolePermissions } from '../../hooks/useRolePermissions';

interface LabOrder {
  id: string;
  order_number: string;
  status: string;
}

interface LabOrderActionsProps {
  order: LabOrder;
  permissions: RolePermissions;
  onView?: (order: LabOrder) => void;
  onEdit?: (order: LabOrder) => void;
  onDelete?: (order: LabOrder) => void;
}

export function LabOrderActions({
  order,
  permissions,
  onView,
  onEdit,
  onDelete
}: LabOrderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {permissions.canViewDetails && onView && (
        <button
          onClick={() => onView(order)}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          title="Voir les détails de l'analyse"
        >
          <Eye className="w-4 h-4 inline mr-1" />
          Détails
        </button>
      )}

      {permissions.canEdit && onEdit && (
        <button
          onClick={() => onEdit(order)}
          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
          title="Modifier l'analyse"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}

      {permissions.canDelete && onDelete && (
        <button
          onClick={() => onDelete(order)}
          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          title="Supprimer l'analyse"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {!permissions.canViewDetails && !permissions.canEdit && !permissions.canDelete && (
        <span className="text-xs text-gray-400 italic">Accès limité</span>
      )}
    </div>
  );
}
