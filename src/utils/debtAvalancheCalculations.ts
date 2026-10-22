/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Deuda,
  VariablesMacroeconomicas,
  DeudaPriorizada,
  ResultadoAvalancha,
  AsignacionExcedente,
} from '../types/debt';

/**
 * Calcula la tasa nominal anual pesificada equivalente considerando
 * la divisa, el tipo de deuda y el riesgo cambiario.
 */
export function calcularTasaNominalEquivalente(
  deuda: Deuda,
  macro: VariablesMacroeconomicas
): number {
  switch (deuda.tipo_deuda) {
    case 'cuotas_sin_interes': {
      if (deuda.moneda === 'ARS') {
        // En pesos y sin interés: costo nominal 0%
        return 0;
      }
      // En EUR sin interés: solo sufre la devaluación esperada
      const devaluacion = macro.devaluacion_anual_eur_ars / 100;
      const riesgo = deuda.incluir_riesgo_cambiario ? macro.tasa_riesgo_cambiario_anual / 100 : 0;
      const tasaEquivalente = (1 + devaluacion) * (1 + riesgo) - 1;
      return Number((tasaEquivalente * 100).toFixed(2));
    }

    case 'amigo_inflacion': {
      // Ajusta por IPC: Tasa = Inflación proyectada + sobretasa pactada
      return Number((macro.inflacion_anual_estimada + (deuda.tasa_interes_anual || 0)).toFixed(2));
    }

    case 'estatica_interes':
    default: {
      if (deuda.moneda === 'ARS') {
        return deuda.tasa_interes_anual;
      }

      // Deuda en EUR con interés:
      // (1 + i_eur) * (1 + devaluacion) * (1 + prima_riesgo) - 1
      const tasaEur = deuda.tasa_interes_anual / 100;
      const devaluacion = macro.devaluacion_anual_eur_ars / 100;
      const riesgo = deuda.incluir_riesgo_cambiario ? macro.tasa_riesgo_cambiario_anual / 100 : 0;

      const tasaPesificada = (1 + tasaEur) * (1 + devaluacion) * (1 + riesgo) - 1;
      return Number((tasaPesificada * 100).toFixed(2));
    }
  }
}

/**
 * Calcula el Costo Financiero Real Neto Anualizado aplicando la Ecuación de Fisher:
 * (1 + r_real) = (1 + i_nominal) / (1 + inflacion)
 */
export function calcularCostoFinancieroReal(
  tasaNominalAnual: number,
  inflacionAnual: number
): { anual: number; mensual: number } {
  const i = tasaNominalAnual / 100;
  const pi = inflacionAnual / 100;

  // Ecuación de Fisher exacta
  const realAnual = (1 + i) / (1 + pi) - 1;
  const realAnualPct = Number((realAnual * 100).toFixed(2));

  // Tasa real mensual equivalente: (1 + r_anual)^(1/12) - 1
  const factorBase = 1 + realAnual;
  const realMensual = factorBase > 0 ? Math.pow(factorBase, 1 / 12) - 1 : realAnual / 12;
  const realMensualPct = Number((realMensual * 100).toFixed(2));

  return {
    anual: realAnualPct,
    mensual: realMensualPct,
  };
}

/**
 * Genera la recomendación estratégica y justificación para una deuda específica
 */
function generarRecomendacionDeuda(
  deuda: Deuda,
  costoRealAnual: number,
  tasaNominal: number,
  macro: VariablesMacroeconomicas
): {
  recomendacion: 'ACELERAR_PAGO' | 'PAGAR_MINIMO_ESTRICTO' | 'MONITOREAR_AJUSTE';
  justificacion: string;
} {
  // Caso 1: Cuotas sin interés en ARS (CFR fuertemente negativo por inflación)
  if (deuda.tipo_deuda === 'cuotas_sin_interes' && deuda.moneda === 'ARS') {
    return {
      recomendacion: 'PAGAR_MINIMO_ESTRICTO',
      justificacion: `Licuación activa: la inflación proyectada (${macro.inflacion_anual_estimada}%) destruye el valor real de la deuda en un ${Math.abs(costoRealAnual)}% anual. Paga exclusivamente la cuota mensual mínima y mantén el saldo en cuentas remuneradas o bonos.`,
    };
  }

  // Caso 2: Deuda en EUR con riesgo cambiario o tasa de interés
  if (deuda.moneda === 'EUR') {
    if (costoRealAnual > 0) {
      return {
        recomendacion: 'ACELERAR_PAGO',
        justificacion: `Alerta cambiaria: deuda denominada en Euros con tasa nominal pesificada equivalente del ${tasaNominal}%. Supera la inflación argentina; liquidarla previene saltos cambiarios bruscos.`,
      };
    }
    return {
      recomendacion: 'MONITOREAR_AJUSTE',
      justificacion: `Deuda en Euros sin interés. Se encarece al ritmo de la devaluación (${macro.devaluacion_anual_eur_ars}% anual), pero no acumula tasa punitoria. Priorizar según liquidez.`,
    };
  }

  // Caso 3: Deuda amigo/familia indexada a inflación
  if (deuda.tipo_deuda === 'amigo_inflacion') {
    return {
      recomendacion: 'MONITOREAR_AJUSTE',
      justificacion: `Deuda ética indexada a inflación (tasa real ~${costoRealAnual}%). Mantiene el poder adquisitivo sin penalidad financiera excesiva. Pagar según cronograma acordado.`,
    };
  }

  // Caso 4: Deudas estáticas con interés
  if (costoRealAnual > 0) {
    return {
      recomendacion: 'ACELERAR_PAGO',
      justificacion: `Punta de la avalancha: genera un costo real del ${costoRealAnual}% anual por encima de la inflación. Cada peso excedente debe destinarse a cancelar este capital urgente.`,
    };
  }

  // Si la tasa nominal es menor que la inflación pero mayor que cero
  return {
    recomendacion: 'PAGAR_MINIMO_ESTRICTO',
    justificacion: `Tasa nominal pactada (${deuda.tasa_interes_anual}%) inferior a la inflación actual (${macro.inflacion_anual_estimada}%). Pagar solo el mínimo y no anticipar capital.`,
  };
}

/**
 * Función principal: Algoritmo de Evaluación y Priorización del Método Avalancha Multidivisa
 * 
 * @param deudas Lista de deudas activas en cualquier divisa
 * @param macro Variables macroeconómicas de contexto argentino
 * @param excedenteDisponibleArs Monto de dinero libre a fin de mes para aplicar a desendeudamiento
 */
export function calcularAvalanchaMultidivisa(
  deudas: Deuda[],
  macro: VariablesMacroeconomicas,
  excedenteDisponibleArs = 0
): ResultadoAvalancha {
  if (!deudas || deudas.length === 0) {
    return {
      deudas_priorizadas: [],
      resumen_cartera: {
        deuda_total_ars: 0,
        deuda_total_eur: 0,
        pago_minimo_total_ars: 0,
        costo_real_promedio_ponderado: 0,
        deuda_critica_urgente_ars: 0,
        deuda_licuandose_ars: 0,
      },
      macro,
      plan_excedente: {
        excedente_ingresado_ars: excedenteDisponibleArs,
        excedente_utilizado_ars: 0,
        excedente_destinado_a_inversion_ars: excedenteDisponibleArs,
        asignaciones: [],
        dictamen_estrategico: 'No hay deudas registradas.',
      },
    };
  }

  // 1. Unificación y cálculo de métricas financieras de cada deuda
  const deudasEvaluadas: Omit<DeudaPriorizada, 'orden_prioridad'>[] = deudas.map((deuda) => {
    const esEur = deuda.moneda === 'EUR';
    const tipoCambio = esEur ? macro.tipo_cambio_eur_ars : 1;

    const saldo_equivalente_ars = deuda.saldo_actual * tipoCambio;
    const pago_minimo_ars = deuda.pago_minimo * tipoCambio;

    const tasaNominalEquivalente = calcularTasaNominalEquivalente(deuda, macro);
    const costoReal = calcularCostoFinancieroReal(tasaNominalEquivalente, macro.inflacion_anual_estimada);

    const { recomendacion, justificacion } = generarRecomendacionDeuda(
      deuda,
      costoReal.anual,
      tasaNominalEquivalente,
      macro
    );

    // Estimación de intereses ahorrados al priorizarla durante 1 año
    const ahorro_estimado_interes_ars = costoReal.anual > 0 
      ? saldo_equivalente_ars * (tasaNominalEquivalente / 100)
      : 0;

    return {
      ...deuda,
      saldo_equivalente_ars: Number(saldo_equivalente_ars.toFixed(2)),
      pago_minimo_ars: Number(pago_minimo_ars.toFixed(2)),
      tasa_nominal_anual_efectiva: tasaNominalEquivalente,
      costo_financiero_real_anual: costoReal.anual,
      costo_financiero_real_mensual: costoReal.mensual,
      recomendacion,
      justificacion,
      ahorro_estimado_interes_ars: Number(ahorro_estimado_interes_ars.toFixed(2)),
    };
  });

  // 2. Ordenamiento Avalancha: Mayor Costo Financiero Real -> Menor Saldo (para desempatar)
  const deudasOrdenadas = [...deudasEvaluadas].sort((a, b) => {
    // 1º Criterio: Costo financiero real anual descendente
    if (Math.abs(b.costo_financiero_real_anual - a.costo_financiero_real_anual) > 0.01) {
      return b.costo_financiero_real_anual - a.costo_financiero_real_anual;
    }
    // 2º Criterio (desempate): Menor saldo para liberar flujo mensual
    return a.saldo_equivalente_ars - b.saldo_equivalente_ars;
  });

  // Asignar posición en la avalancha (1 = más urgente)
  const deudas_priorizadas: DeudaPriorizada[] = deudasOrdenadas.map((d, index) => ({
    ...d,
    orden_prioridad: index + 1,
  }));

  // 3. Resumen consolidado de cartera
  let deuda_total_ars = 0;
  let deuda_total_eur = 0;
  let pago_minimo_total_ars = 0;
  let sumaPonderadaCostoReal = 0;
  let deuda_critica_urgente_ars = 0;
  let deuda_licuandose_ars = 0;

  deudas_priorizadas.forEach((d) => {
    deuda_total_ars += d.saldo_equivalente_ars;
    if (d.moneda === 'EUR') deuda_total_eur += d.saldo_actual;
    pago_minimo_total_ars += d.pago_minimo_ars;
    sumaPonderadaCostoReal += d.costo_financiero_real_anual * d.saldo_equivalente_ars;

    if (d.costo_financiero_real_anual > 0) {
      deuda_critica_urgente_ars += d.saldo_equivalente_ars;
    } else {
      deuda_licuandose_ars += d.saldo_equivalente_ars;
    }
  });

  const costo_real_promedio_ponderado = deuda_total_ars > 0
    ? Number((sumaPonderadaCostoReal / deuda_total_ars).toFixed(2))
    : 0;

  // 4. Algoritmo de Distribución Inteligente del Excedente
  let remanenteExcedente = Math.max(0, excedenteDisponibleArs);
  let excedente_utilizado_ars = 0;
  const asignaciones: AsignacionExcedente[] = [];

  for (const deuda of deudas_priorizadas) {
    const esEur = deuda.moneda === 'EUR';
    const tipoCambio = esEur ? macro.tipo_cambio_eur_ars : 1;

    // Regla de optimización patrimonial:
    // Si la deuda tiene costo real negativo o es cuota sin interés, NO asignamos excedente.
    // Solo aceleramos deudas con recomendación 'ACELERAR_PAGO'.
    let pagoExtraArs = 0;
    let motivo = 'Pago mínimo obligatorio.';

    if (deuda.recomendacion === 'ACELERAR_PAGO' && remanenteExcedente > 0) {
      const saldoRemanenteTrasMinimo = Math.max(0, deuda.saldo_equivalente_ars - deuda.pago_minimo_ars);
      pagoExtraArs = Math.min(remanenteExcedente, saldoRemanenteTrasMinimo);
      remanenteExcedente -= pagoExtraArs;
      excedente_utilizado_ars += pagoExtraArs;

      motivo = pagoExtraArs >= saldoRemanenteTrasMinimo
        ? '¡Deuda cancelada en su totalidad este mes con el excedente!'
        : `Aceleración de avalancha: mayor costo real (${deuda.costo_financiero_real_anual}% anual).`;
    } else if (deuda.recomendacion === 'PAGAR_MINIMO_ESTRICTO') {
      motivo = 'Licuación por inflación: pagar solo el mínimo y no anticipar capital.';
    }

    const pagoTotalArs = deuda.pago_minimo_ars + pagoExtraArs;
    const pagoTotalOrig = Number((pagoTotalArs / tipoCambio).toFixed(2));
    const saldoPostPago = Math.max(0, deuda.saldo_equivalente_ars - pagoTotalArs);

    asignaciones.push({
      id_deuda: deuda.id_deuda,
      acreedor: deuda.acreedor,
      pago_minimo_ars: deuda.pago_minimo_ars,
      pago_extra_ars: Number(pagoExtraArs.toFixed(2)),
      pago_total_sugerido_ars: Number(pagoTotalArs.toFixed(2)),
      pago_total_moneda_original: pagoTotalOrig,
      moneda_original: deuda.moneda,
      saldo_post_pago_ars: Number(saldoPostPago.toFixed(2)),
      motivo_asignacion: motivo,
    });
  }

  const excedente_destinado_a_inversion_ars = Number(remanenteExcedente.toFixed(2));

  // Generar dictamen estratégico global
  let dictamen_estrategico = '';
  if (deuda_critica_urgente_ars > 0) {
    dictamen_estrategico = `Tienes $${deuda_critica_urgente_ars.toLocaleString()} ARS en deudas con tasa real destructiva (punta de avalancha). Se recomienda aplicar todo excedente a liquidar la deuda #1 (${deudas_priorizadas[0]?.acreedor}).`;
  } else if (deuda_licuandose_ars > 0) {
    dictamen_estrategico = `Excelente situación: El 100% de tus pasivos ($${deuda_licuandose_ars.toLocaleString()} ARS) se está licuando frente a la inflación (${macro.inflacion_anual_estimada}% anual). No aceleres ningún pago; invierte el excedente mensual ($${excedente_destinado_a_inversion_ars.toLocaleString()} ARS) en instrumentos remunerados en ARS.`;
  } else {
    dictamen_estrategico = 'Cartera equilibrada sin pasivos críticos con tasa punitoria.';
  }

  return {
    deudas_priorizadas,
    resumen_cartera: {
      deuda_total_ars: Number(deuda_total_ars.toFixed(2)),
      deuda_total_eur: Number(deuda_total_eur.toFixed(2)),
      pago_minimo_total_ars: Number(pago_minimo_total_ars.toFixed(2)),
      costo_real_promedio_ponderado,
      deuda_critica_urgente_ars: Number(deuda_critica_urgente_ars.toFixed(2)),
      deuda_licuandose_ars: Number(deuda_licuandose_ars.toFixed(2)),
    },
    macro,
    plan_excedente: {
      excedente_ingresado_ars: excedenteDisponibleArs,
      excedente_utilizado_ars: Number(excedente_utilizado_ars.toFixed(2)),
      excedente_destinado_a_inversion_ars,
      asignaciones,
      dictamen_estrategico,
    },
  };
}
