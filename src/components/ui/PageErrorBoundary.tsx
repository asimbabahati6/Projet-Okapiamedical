import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Une erreur est survenue
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Cette page n'a pas pu se charger correctement. Veuillez réessayer.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
