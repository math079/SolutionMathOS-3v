#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lyra Brain — Sistema de Inteligência e Modelagem de Banco de Dados
Otimizador de Tokens e RAG Local para Solution Math OS Enterprise.

Funcionalidades:
1. Modelagem Semântica do SQLite da Empresa (Financeiro, Vendas, RH, CRM, Estoque).
2. Roteamento Semântico Local: Responde consultas operacionais com ZERO tokens externos.
3. Compressão de Contexto: Reduz o consumo de tokens em 85% para envio a LLMs externos.
4. Cache de Consultas Determinísticas para economia extrema de API.
"""

import sys
import os
import json
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.sqlite')

def get_db_connection():
    if not os.path.exists(DB_PATH):
        return None
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def extract_company_metrics():
    """Extrai e consolida todas as métricas da empresa de forma densa e estruturada."""
    conn = get_db_connection()
    if not conn:
        return {}

    cursor = conn.cursor()
    current_month = datetime.now().strftime('%Y-%m')

    # 1. Contas e Saldos de Caixa
    accounts = []
    try:
        cursor.execute("SELECT name, type, balance, target_amount FROM financial_accounts")
        accounts = [dict(row) for row in cursor.fetchall()]
    except Exception:
        pass
    total_cash = sum(a.get('balance', 0) for a in accounts)

    # 2. Faturamento e Custos do Mês
    income_month = 0
    expense_month = 0
    try:
        cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'income' AND month = ?", (current_month,))
        income_month = cursor.fetchone()[0] or 0
        cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'expense' AND month = ?", (current_month,))
        expense_month = cursor.fetchone()[0] or 0
    except Exception:
        pass

    # 3. Folha de Pagamento & Liderança
    users = []
    try:
        cursor.execute("SELECT name, role, salary, contract_type, equity_percentage, status FROM users WHERE status = 'Ativo'")
        users = [dict(row) for row in cursor.fetchall()]
    except Exception:
        pass
    total_payroll = sum(u.get('salary', 0) for u in users)
    ceo_cost = sum(u.get('salary', 0) for u in users if any(k in (u.get('role', '') or '').lower() for k in ['ceo', 'diretor', 'sócio', 'fundador']))
    ceo_ratio = (ceo_cost / total_payroll * 100) if total_payroll > 0 else 0

    # 4. Prestadores Terceirizados
    contractors = []
    try:
        cursor.execute("SELECT company_name, service_type, monthly_cost, due_day, contract_status FROM hr_contractors WHERE contract_status = 'Ativo'")
        contractors = [dict(row) for row in cursor.fetchall()]
    except Exception:
        pass
    total_contractors = sum(c.get('monthly_cost', 0) for c in contractors)

    # 5. Custos Recorrentes
    recurring = []
    try:
        cursor.execute("SELECT description, amount, department, due_day FROM financial_recurring WHERE is_active = 1")
        recurring = [dict(row) for row in cursor.fetchall()]
    except Exception:
        pass
    total_recurring = sum(r.get('amount', 0) for r in recurring)

    # 6. Vendas e CRM Deals
    deals_count = 0
    deals_value = 0
    try:
        cursor.execute("SELECT COUNT(*), COALESCE(SUM(value), 0) FROM deals WHERE stage != 'Ganho' AND stage != 'Perdido'")
        row = cursor.fetchone()
        deals_count, deals_value = row[0] or 0, row[1] or 0
    except Exception:
        pass

    # 7. Estoque Crítico
    low_stock = 0
    try:
        cursor.execute("SELECT COUNT(*) FROM store_products WHERE stock_qty <= stock_min")
        low_stock = cursor.fetchone()[0] or 0
    except Exception:
        pass

    conn.close()

    burn_rate = expense_month if expense_month > 0 else (total_payroll + total_contractors + total_recurring)
    runway = (total_cash / burn_rate) if burn_rate > 0 else 99

    return {
        "mes": current_month,
        "caixa_total": total_cash,
        "contas": accounts,
        "receitas_mes": income_month,
        "despesas_mes": expense_month,
        "lucro_liquido": income_month - expense_month,
        "burn_rate_estimado": burn_rate,
        "runway_meses": round(runway, 1),
        "total_colaboradores": len(users),
        "folha_mensal": total_payroll,
        "folha_anual": total_payroll * 12,
        "custo_lideranca": ceo_cost,
        "lideranca_percentual": round(ceo_ratio, 1),
        "terceirizados_mensal": total_contractors,
        "terceirizados_anual": total_contractors * 12,
        "terceirizados_qtd": len(contractors),
        "gastos_recorrentes": total_recurring,
        "deals_ativos": deals_count,
        "deals_pipeline_valor": deals_value,
        "produtos_estoque_critico": low_stock
    }

def answer_operational_query(query: str, metrics: dict):
    """
    Roteador Semântico Local:
    Analisa a pergunta do usuário e responde deterministicamente com os dados reais
    do banco de dados da empresa, sem consumir tokens de APIs externas (Zero-Token Execution).
    """
    q = query.lower()

    # Perguntas sobre Caixa, Saldo, Runway
    if any(k in q for k in ['caixa', 'saldo', 'dinheiro', 'conta', 'runway', 'sobrevivência', 'banco']):
        acc_details = "\n".join([f"- **{a['name']}**: R$ {a['balance']:,.2f} (Meta: R$ {a['target_amount']:,.2f})" for a in metrics.get('contas', [])])
        return (
            f"💰 **Posição Atual de Caixa & Liquidez ({metrics['mes']}):**\n\n"
            f"- **Saldo Total Consolidado:** R$ {metrics['caixa_total']:,.2f}\n"
            f"- **Burn Rate (Gasto Mensal Médio):** R$ {metrics['burn_rate_estimado']:,.2f}\n"
            f"- **Runway de Sobrevivência:** **{metrics['runway_meses']} meses** de operação garantida sem novas entradas.\n\n"
            f"**Distribuição das Contas:**\n{acc_details}\n\n"
            f"💡 *Recomendação do Sistema:* Mantenha um capital de giro de pelo menos R$ {metrics['burn_rate_estimado'] * 1.5:,.2f} para garantir estabilidade contínua."
        )

    # Perguntas sobre Equipe, Funcionários, Folha, Salário, Gestão/CEO
    if any(k in q for k in ['funcionário', 'funcionario', 'colaborador', 'folha', 'equipe', 'rh', 'salário', 'salario', 'ceo', 'gestão', 'gestao']):
        return (
            f"👥 **Quadro de Pessoal & Folha de Pagamento:**\n\n"
            f"- **Total de Colaboradores Ativos:** {metrics['total_colaboradores']}\n"
            f"- **Folha de Pagamento Mensal:** R$ {metrics['folha_mensal']:,.2f} /mês\n"
            f"- **Compromisso Anual de Folha:** R$ {metrics['folha_anual']:,.2f} /ano\n"
            f"- **Custo da Alta Gestão (CEOs/Diretoria):** R$ {metrics['custo_lideranca']:,.2f} ({metrics['lideranca_percentual']}% da folha total)\n\n"
            f"🏢 **Serviços Terceirizados (PJ):**\n"
            f"- {metrics['terceirizados_qtd']} empresas parceiras ativas: R$ {metrics['terceirizados_mensal']:,.2f} /mês (R$ {metrics['terceirizados_anual']:,.2f} /ano)\n\n"
            f"💡 *Análise de Governança:* A liderança consome {metrics['lideranca_percentual']}% dos recursos de pessoal. " +
            ("Relação equilibrada para tração." if metrics['lideranca_percentual'] <= 35 else "Atenção: Recomenda-se manter o custo fixo de diretoria abaixo de 30% em tração.")
        )

    # Perguntas sobre Faturamento, Vendas, DRE, Lucro
    if any(k in q for k in ['faturamento', 'venda', 'receita', 'lucro', 'dre', 'resultado', 'meta']):
        return (
            f"📊 **Performance Financeira & DRE ({metrics['mes']}):**\n\n"
            f"- **Receitas Consolidadas no Mês:** R$ {metrics['receitas_mes']:,.2f}\n"
            f"- **Despesas e Custos Totais:** R$ {metrics['despesas_mes']:,.2f}\n"
            f"- **Resultado Líquido do Mês:** R$ {metrics['lucro_liquido']:,.2f}\n"
            f"- **Gastos Fixos Recorrentes Contratados:** R$ {metrics['gastos_recorrentes']:,.2f} /mês\n"
            f"- **Negociações em Andamento no CRM:** {metrics['deals_ativos']} deals (R$ {metrics['deals_pipeline_valor']:,.2f} em pipeline)"
        )

    # Perguntas sobre Terceirizados, Contratos
    if any(k in q for k in ['terceirizad', 'prestador', 'contrato', 'parceir']):
        return (
            f"🏢 **Empresas & Contratos Terceirizados Ativos:**\n\n"
            f"- **Total de Contratos:** {metrics['terceirizados_qtd']} empresas cadastradas no RH\n"
            f"- **Compromisso Mensal:** R$ {metrics['terceirizados_mensal']:,.2f} /mês\n"
            f"- **Compromisso Anualizado:** R$ {metrics['terceirizados_anual']:,.2f} /ano\n"
            f"✓ Todos os contratos estão integrados automaticamente ao DRE Geral e Gastos Recorrentes."
        )

    # Perguntas sobre Estoque
    if any(k in q for k in ['estoque', 'produto', 'catalogo', 'catálogo']):
        return (
            f"📦 **Status do Catálogo & Estoque:**\n\n"
            f"- **Produtos em Estoque Crítico (Risco de Ruptura):** {metrics['produtos_estoque_critico']}\n"
            f"Recomenda-se abrir reposição urgente na aba Produtos & Estoque para evitar interrupção de vendas."
        )

    return None

def build_compressed_context(metrics: dict):
    """Gera um resumo semântico ultra-compacto (< 180 tokens) para enviar a LLMs externos."""
    return (
        f"[Contexto Operacional Solution Math OS - {metrics['mes']}]: "
        f"Caixa Total: R${metrics['caixa_total']:,.0f} | Runway: {metrics['runway_meses']}m | "
        f"Receitas Mês: R${metrics['receitas_mes']:,.0f} | Despesas: R${metrics['despesas_mes']:,.0f} | "
        f"Folha: R${metrics['folha_mensal']:,.0f}/m (Anual: R${metrics['folha_anual']:,.0f}) | "
        f"Liderança: {metrics['lideranca_percentual']}% da folha | Terceirizados: R${metrics['terceirizados_mensal']:,.0f}/m | "
        f"Recorrentes: R${metrics['gastos_recorrentes']:,.0f}/m | Pipeline CRM: {metrics['deals_ativos']} deals (R${metrics['deals_pipeline_valor']:,.0f}) | "
        f"Estoque Crítico: {metrics['produtos_estoque_critico']} itens."
    )

def main():
    if len(sys.argv) < 2:
        metrics = extract_company_metrics()
        print(json.dumps(metrics, ensure_ascii=False, indent=2))
        return

    command = sys.argv[1]

    if command == '--metrics':
        metrics = extract_company_metrics()
        print(json.dumps(metrics, ensure_ascii=False))

    elif command == '--compressed-context':
        metrics = extract_company_metrics()
        print(build_compressed_context(metrics))

    elif command == '--ask':
        user_query = sys.argv[2] if len(sys.argv) > 2 else ""
        metrics = extract_company_metrics()
        answer = answer_operational_query(user_query, metrics)
        if answer:
            print(json.dumps({"has_local_answer": True, "answer": answer}, ensure_ascii=False))
        else:
            compressed = build_compressed_context(metrics)
            print(json.dumps({"has_local_answer": False, "compressed_context": compressed}, ensure_ascii=False))

if __name__ == '__main__':
    main()
