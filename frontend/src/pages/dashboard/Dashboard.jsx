/**
 * Roteador de Dashboard
 * Renderiza o dashboard correto baseado no role do usuário logado
 */

import { useAuth } from '../../context/AuthContext';
import DashboardVendedor   from './DashboardVendedor';
import DashboardEstoquista from './DashboardEstoquista';
import DashboardAlmoxarife from './DashboardAlmoxarife';
import DashboardMotorista  from './DashboardMotorista';

// Importa dashboards que serão reaproveitados pelos novos roles
import DashboardCoordenador from './DashboardCoordenador'; // super_admin
import DashboardAdmGalpao   from './DashboardAdmGalpao';   // adm
import DashboardGerencia    from './DashboardGerencia';    // gerencia
import DashboardEmissorNF   from './DashboardEmissorNF';   // fiscal

const DASHBOARDS = {
  super_admin: DashboardCoordenador,
  gerencia:    DashboardGerencia,
  vendedor:    DashboardVendedor,
  estoquista:  DashboardEstoquista,
  almoxarife:  DashboardAlmoxarife,
  adm:         DashboardAdmGalpao,
  motorista:   DashboardMotorista,
  fiscal:      DashboardEmissorNF,
};

export default function Dashboard() {
  const { usuario } = useAuth();
  const DashboardDoRole = DASHBOARDS[usuario?.role];

  if (!DashboardDoRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">
          Perfil não reconhecido: {usuario?.role}
        </p>
      </div>
    );
  }

  return <DashboardDoRole />;
}
