export type ProjectionType = 'viagem' | 'apartamento' | 'negocio' | 'aposentadoria' | 'imovel' | 'educacao' | 'customizado';

export interface ViagemProjection {
    dias: number;
    gastoPorDia: number;
    descricao: string;
}

export interface ApartamentoProjection {
    valor: number;
    frequencia: 'mensal' | 'anual';
    descricao: string;
}

export interface NegocioProjection {
    investimentoInicial: number;
    custoMensal: number;
    receitaEstimada: number;
    mesesAteBreakEven: number;
    descricao: string;
}

export interface AposentadoriaProjection {
    idadeAtual: number;
    idadeAposentadoria: number;
    patrimonioAtual: number;
    contribuicaoMensal: number;
    taxaRetornoAnual: number; // %
    expectativaVida: number;
    gastoMensalAposentadoria: number;
}

export interface ImovelProjection {
    valorImovel: number;
    entrada: number;
    taxaJurosAnual: number; // %
    prazoAnos: number;
    valorAluguelEstimado?: number; // Se for para investimento
    descricao: string;
}

export interface EducacaoProjection {
    mensalidade: number;
    duracaoMeses: number;
    materialAnual: number;
    inflacaoEducacaoStats: number; // % anual
    descricao: string;
}

export interface CustomizadoProjection {
    valor: number;
    descricao: string;
}

export interface ProjectionData {
    viagem: ViagemProjection;
    apartamento: ApartamentoProjection;
    negocio: NegocioProjection;
    aposentadoria: AposentadoriaProjection;
    imovel: ImovelProjection;
    educacao: EducacaoProjection;
    customizado: CustomizadoProjection;
}

export const defaultProjectionData: ProjectionData = {
    viagem: { dias: 0, gastoPorDia: 0, descricao: 'Viagem de Férias' },
    apartamento: { valor: 0, frequencia: 'mensal', descricao: 'Aluguel' },
    negocio: {
        investimentoInicial: 0,
        custoMensal: 0,
        receitaEstimada: 0,
        mesesAteBreakEven: 12,
        descricao: 'Novo Negócio'
    },
    aposentadoria: {
        idadeAtual: 30,
        idadeAposentadoria: 65,
        patrimonioAtual: 0,
        contribuicaoMensal: 0,
        taxaRetornoAnual: 6,
        expectativaVida: 90,
        gastoMensalAposentadoria: 5000
    },
    imovel: {
        valorImovel: 0,
        entrada: 0,
        taxaJurosAnual: 9,
        prazoAnos: 30,
        descricao: 'Compra de Imóvel'
    },
    educacao: {
        mensalidade: 0,
        duracaoMeses: 48, // 4 anos
        materialAnual: 0,
        inflacaoEducacaoStats: 5,
        descricao: 'Faculdade/Curso'
    },
    customizado: { valor: 0, descricao: 'Outros Gastos' }
};
