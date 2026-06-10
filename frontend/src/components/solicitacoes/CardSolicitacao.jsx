/**
 * Card de Solicitação — usado na lista mobile (estoquista/almoxarife)
 * e como linha clicável na versão desktop
 */

import { Clock, Package, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BadgeStatus }     from './BadgeStatus';
import { BadgePrioridade } from './BadgePrioridade';
import { LABELS_SETOR }    from '../../utils/constantes';
import { formatarDataHora } from '../../utils/formatters';

export function CardSolicitacao({ solicitacao, compacto = false }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/solicitacoes/${solicitacao.id}`)}
      className="w-full text-left card-base p-4 hover:shadow-md transition-shadow
                  border-l-4 border-marinho-300 hover:border-marinho-600"
    >
      {/* Linha superior: proposta + badges */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-marinho-900 text-sm">
            #{solicitacao.numero_proposta}
          </p>
          {solicitacao.numero_orcamento && (
            <p className="text-xs text-marinho-300">Orç: {solicitacao.numero_orcamento}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {solicitacao.prioridade && (
            <BadgePrioridade prioridade={solicitacao.prioridade} />
          )}
          <BadgeStatus status={solicitacao.status} />
        </div>
      </div>

      {!compacto && (
        <>
          {/* Info: vendedor + setor */}
          <div className="flex items-center gap-3 text-xs text-marinho-400 mb-2">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {solicitacao.vendedor_nome}
            </span>
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {LABELS_SETOR[solicitacao.setor_destino]}
            </span>
          </div>

          {/* Estoquista atribuído */}
          {solicitacao.estoquista_nome && (
            <p className="text-xs text-marinho-600 mb-2">
              Separando: {solicitacao.estoquista_nome}
            </p>
          )}
        </>
      )}

      {/* Rodapé: data + seta */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-marinho-300">
          <Clock className="w-3 h-3" />
          {formatarDataHora(solicitacao.created_at)}
        </span>
        <ArrowRight className="w-4 h-4 text-marinho-300" />
      </div>
    </button>
  );
}
