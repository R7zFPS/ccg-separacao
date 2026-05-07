/**
 * ErrorBoundary — captura erros de render inesperados
 * Exibe uma tela amigável em vez de tela branca (white screen of death).
 *
 * Uso no App.jsx:
 *   <ErrorBoundary>
 *     <BrowserRouter>...</BrowserRouter>
 *   </ErrorBoundary>
 */

import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { temErro: false, erro: null, info: null };
  }

  static getDerivedStateFromError(erro) {
    return { temErro: true, erro };
  }

  componentDidCatch(erro, info) {
    // Em produção, aqui você poderia enviar para um serviço de monitoramento
    console.error('[ErrorBoundary] Erro capturado:', erro, info);
    this.setState({ info });
  }

  handleRecarregar() {
    this.setState({ temErro: false, erro: null, info: null });
    window.location.href = '/';
  }

  render() {
    if (!this.state.temErro) {
      return this.props.children;
    }

    const msgErro = this.state.erro?.message || 'Erro desconhecido';

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-5">
          {/* Ícone */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          {/* Mensagem */}
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Algo deu errado
            </h1>
            <p className="text-sm text-gray-500">
              O app encontrou um problema inesperado. Recarregue a página para continuar.
            </p>
          </div>

          {/* Detalhe do erro (apenas em desenvolvimento) */}
          {import.meta.env.DEV && (
            <div className="text-left bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-mono text-red-700 break-words">{msgErro}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => this.handleRecarregar()}
              className="flex items-center gap-2 px-5 py-2.5 bg-marinho-700
                         hover:bg-marinho-800 text-white text-sm font-medium
                         rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
