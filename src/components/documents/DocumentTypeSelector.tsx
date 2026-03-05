import { DOCUMENT_TYPE_LIST } from '../../config/documentTypes';

interface DocumentTypeSelectorProps {
  selectedType: string;
  onSelectType: (type: string) => void;
}

export function DocumentTypeSelector({ selectedType, onSelectType }: DocumentTypeSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Types de Documents</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DOCUMENT_TYPE_LIST.map((docType) => {
          const Icon = docType.icon;
          const isSelected = selectedType === docType.type;

          return (
            <button
              key={docType.type}
              onClick={() => onSelectType(docType.type === selectedType ? '' : docType.type)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? `${docType.bgColor} ${docType.borderColor} shadow-md scale-105`
                  : `bg-white border-gray-200 ${docType.hoverColor}`
              }`}
              style={isSelected ? { borderColor: docType.color } : {}}
            >
              <Icon
                className="w-6 h-6 mb-2"
                style={{ color: isSelected ? docType.color : '#6B7280' }}
              />
              <p
                className={`text-sm font-medium ${
                  isSelected ? 'font-semibold' : 'text-gray-700'
                }`}
                style={isSelected ? { color: docType.color } : {}}
              >
                {docType.name}
              </p>
            </button>
          );
        })}
      </div>
      {selectedType && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Filtre actif: <span className="font-semibold">{DOCUMENT_TYPE_LIST.find(d => d.type === selectedType)?.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}
