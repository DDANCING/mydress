// Função para converter número em texto por extenso
function numberToWords(num: number): string {
  const units = [
    '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
    'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'
  ];
  
  const tens = [
    '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'
  ];
  
  const hundreds = [
    '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'
  ];

  if (num === 0) return 'zero';
  if (num === 100) return 'cem';
  if (num === 1000) return 'mil';
  
  let result = '';
  
  // Milhares
  if (num >= 1000) {
    const milhares = Math.floor(num / 1000);
    if (milhares === 1) {
      result += 'mil';
    } else {
      result += numberToWordsUpTo999(milhares) + ' mil';
    }
    num %= 1000;
    if (num > 0) result += ' e ';
  }
  
  // Centenas, dezenas e unidades (até 999)
  if (num > 0) {
    result += numberToWordsUpTo999(num);
  }
  
  return result;
}

// Função auxiliar para números até 999
function numberToWordsUpTo999(num: number): string {
  const units = [
    '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
    'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'
  ];
  
  const tens = [
    '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'
  ];
  
  const hundreds = [
    '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'
  ];

  if (num === 0) return '';
  if (num === 100) return 'cem';
  
  let result = '';
  
  // Centenas
  if (num >= 100) {
    const centena = Math.floor(num / 100);
    result += hundreds[centena];
    num %= 100;
    if (num > 0) result += ' e ';
  }
  
  // Dezenas e unidades
  if (num >= 20) {
    const dezena = Math.floor(num / 10);
    result += tens[dezena];
    num %= 10;
    if (num > 0) result += ' e ';
  }
  
  if (num > 0 && num < 20) {
    result += units[num];
  }
  
  return result;
}

export function formatCurrency(value: number): string {
  const reais = Math.floor(value);
  const centavos = Math.round((value - reais) * 100);
  
  let result = '';
  
  if (reais === 1) {
    result = 'um real';
  } else if (reais > 1) {
    result = numberToWords(reais) + ' reais';
  }
  
  if (centavos > 0) {
    if (result) result += ' e ';
    if (centavos === 1) {
      result += 'um centavo';
    } else {
      result += numberToWords(centavos) + ' centavos';
    }
  }
  
  return result || 'zero reais';
}
