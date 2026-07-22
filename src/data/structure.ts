export interface ProcessDetail {
  id: string;
  name: string;
  objective: string;
  owners: string[];
  inputs: string[];
  outputs: string[];
  documents: string[];
  templates: string[];
  kpis: string[];
  tools: string[];
  flows: string[];
  automations: string[];
  integrations: string[];
  relatedModules: string[];
  type?: 'default' | 'crm' | 'tasks' | 'hr' | 'products' | 'agenda';
}

export interface Sector {
  id: string;
  name: string;
  description: string;
  processes: ProcessDetail[];
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  description: string;
  sectors: Sector[];
}

export interface CompanyStructure {
  id: string;
  name: string;
  departments: Department[];
}

export const companyData: CompanyStructure = {
  id: "solution-math",
  name: "Solution Math",
  departments: [
    {
      id: "recursos-humanos",
      name: "Recursos Humanos",
      icon: "Users",
      description: "Gestão de equipe e alocação de funcionários.",
      sectors: [
        {
          id: "equipe",
          name: "Gestão de Equipe",
          description: "Painel de controle de funcionários ativos.",
          processes: [
            {
              id: "proc-gestao-equipe",
              name: "Membros da Equipe",
              objective: "Controlar quem tem acesso e as funções no sistema.",
              owners: ["RH", "CEO"],
              inputs: [],
              outputs: [],
              documents: [],
              templates: [],
              kpis: [],
              tools: ["Backend API", "SQLite Users"],
              flows: ["Cadastrar Funcionario -> Vincular a Projetos"],
              automations: ["Funcionário aparece automaticamente no módulo de Tarefas"],
              integrations: [],
              relatedModules: ["operacoes-projetos"],
              type: "hr"
            }
          ]
        }
      ]
    },
    {
      id: "operacoes-projetos",
      name: "Operações & Projetos",
      icon: "Cpu",
      description: "Núcleo de produção tecnológica: Software, Sites, IA e Infraestrutura.",
      sectors: [
        {
          id: "desenvolvimento",
          name: "Desenvolvimento de Software",
          description: "Criação de sistemas personalizados, apps e plataformas.",
          processes: [
            {
              id: "proc-sistemas-personalizados",
              name: "Sistemas Personalizados",
              objective: "Entregar sistemas sob medida de alta qualidade.",
              owners: ["Tech Lead", "Desenvolvedores Full Stack"],
              inputs: ["Escopo de Projeto", "Prototipagem UI/UX"],
              outputs: ["Código Fonte", "Sistema em Produção"],
              documents: ["Documento de Arquitetura", "Manuais de Usuário"],
              templates: ["Template de Repositório", "Boilerplate React/Node"],
              kpis: ["Lead Time for Changes", "Bugs em Produção", "Cobertura de Testes"],
              tools: ["GitHub", "Jira", "Vercel", "AWS"],
              flows: ["Planning -> Sprint -> Code -> Review -> CI/CD -> Deploy"],
              automations: ["Deploy automatizado via GitHub Actions", "Testes automatizados no PR"],
              integrations: ["Slack (Notificações de Deploy)", "Sentry (Monitoramento)"],
              relatedModules: ["proc-qa", "proc-infraestrutura"]
            },
          ]
        },
        {
          id: "gestao-tarefas",
          name: "Gestão de Tarefas (Dev)",
          description: "Quadro de tarefas e envio de arquivos/entregas.",
          processes: [
            {
              id: "proc-tarefas-equipe",
              name: "Minhas Tarefas",
              objective: "Visualizar backlog e fazer upload de arquivos entregáveis.",
              owners: ["Time de Operações"],
              inputs: [],
              outputs: [],
              documents: [],
              templates: [],
              kpis: [],
              tools: ["File Upload", "Backend API"],
              flows: ["Pegar tarefa -> Executar -> Upload Arquivo -> Concluído"],
              automations: ["Sincronização com o Backend SQLite"],
              integrations: ["Node.js API", "Multer Upload"],
              relatedModules: ["desenvolvimento"],
              type: "tasks" // Special flag to render Custom Component
            }
          ]
        }
      ]
    },
    {
      id: "comercial",
      name: "Comercial & Marketing",
      icon: "Briefcase",
      description: "Captação, negociação e relacionamento com clientes.",
      sectors: [
        {
          id: "crm",
          name: "CRM de Vendas",
          description: "Gestão de Leads e Clientes.",
          processes: [
            {
              id: "proc-gestao-leads",
              name: "Painel de Leads (CRM)",
              objective: "Gerenciar novos contatos, clientes e status.",
              owners: ["Executivo de Vendas", "Pré-vendas (SDR)"],
              inputs: [],
              outputs: [],
              documents: [],
              templates: [],
              kpis: [],
              tools: ["SQLite CRM", "Backend API"],
              flows: ["Novo Lead -> Qualificação -> Proposta -> Fechamento"],
              automations: ["Lead entra pelo site e cai direto aqui"],
              integrations: ["API do Formulário do Site"],
              relatedModules: ["projetos"],
              type: "crm" // Special flag for CRM View
            }
          ]
        }
      ]
    },
    {
      id: "diretoria",
      name: "Diretoria (CEO)",
      icon: "LineChart",
      description: "Visão executiva, dashboards e estratégia.",
      sectors: [
        {
          id: "estrategia",
          name: "Estratégia & Dashboards",
          description: "Monitoramento de métricas vitais da empresa.",
          processes: [
            {
              id: "proc-dashboard-ceo",
              name: "Revisão Executiva",
              objective: "Analisar saúde financeira e operacional para tomada de decisão.",
              owners: ["CEO"],
              inputs: ["DRE", "Relatório de Vendas", "Status de Projetos"],
              outputs: ["Metas Ajustadas", "Decisões Estratégicas"],
              documents: ["Business Plan", "OKR Sheet"],
              templates: ["Template de Reunião Mensal"],
              kpis: ["MRR / ARR", "EBITDA", "Churn Rate", "CAC", "LTV"],
              tools: ["Power BI", "Metabase", "Notion"],
              flows: ["Coleta de Dados Automática -> Atualização do Dashboard -> Reunião Mensal -> Action Items"],
              automations: ["Sincronização diária do banco de dados com Metabase"],
              integrations: ["Conta Azul -> Metabase", "HubSpot -> Power BI"],
              relatedModules: ["financeiro", "comercial", "operacoes-projetos"]
            }
          ]
        }
      ]
    }
  ]
};
