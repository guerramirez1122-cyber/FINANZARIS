/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TipoDeuda = 
  | 'estatica_interes'       // Tarjeta de crédito rotativo, préstamo personal tasa fija/variable
  | 'cuotas_sin_interes'     // Cuotas fijas en pesos sin interés (CFT 0% nominal)
  | 'amigo_inflacion';       // Préstamo familiar/amigos indexado a inflación o costo de vida

export type Moneda = 'ARS' | 'EUR';

export interface Deuda {
  id_deuda: string;
  acreedor: string;
  tipo_deuda: TipoDeuda;
  moneda: Moneda;
  saldo_actual: number;             // En moneda original de la deuda
  tasa_interes_anual: number;       // TNA nominal anual en porcentaje (ej: 45.5 para 45.5%)
  pago_minimo: number;              // Cuota mensual obligatoria en moneda original
  cuotas_restantes: number;         // Cantidad de cuotas pendientes (o meses estimados)
  incluir_riesgo_cambiario: boolean;// Si es EUR, suma prima de volatilidad/brecha cambiaria
}

export interface VariablesMacroeconomicas {
  tipo_cambio_eur_ars: number;        // Cotización Euro en ARS (ej: 1350.50)
  inflacion_mensual_estimada: number; // Inflación proyectada mensual % (ej: 3.2%)
  inflacion_anual_estimada: number;  // Inflación proyectada anual % (ej: 45.0%)
  devaluacion_anual_eur_ars: number;  // Depreciación proyectada ARS vs EUR % (ej: 38.0%)
  tasa_riesgo_cambiario_anual: number;// Prima adicional de riesgo cambiario (ej: 8.0%)
  tasa_libre_riesgo_ars: number;      // Rendimiento alternativo en ARS (plazo fijo / money market) %
  fecha_actualizacion: string;
  fuente_cotizacion: string;
  fuente_inflacion: string;
}

export interface DeudaPriorizada extends Deuda {
  saldo_equivalente_ars: number;
  pago_minimo_ars: number;
  tasa_nominal_anual_efectiva: number; // Tasa nominal pesificada anual equivalente
  costo_financiero_real_anual: number; // Tasa real Fisher descontando inflación (puede ser negativa)
  costo_financiero_real_mensual: number;
  orden_prioridad: number;             // 1 = máxima prioridad (punta de avalancha)
  recomendacion: 'ACELERAR_PAGO' | 'PAGAR_MINIMO_ESTRICTO' | 'MONITOREAR_AJUSTE';
  justificacion: string;
  ahorro_estimado_interes_ars: number; // Estimación de intereses ahorrados al priorizarla
}

export interface AsignacionExcedente {
  id_deuda: string;
  acreedor: string;
  pago_minimo_ars: number;
  pago_extra_ars: number;
  pago_total_sugerido_ars: number;
  pago_total_moneda_original: number;
  moneda_original: Moneda;
  saldo_post_pago_ars: number;
  motivo_asignacion: string;
}

export interface ResultadoAvalancha {
  deudas_priorizadas: DeudaPriorizada[];
  resumen_cartera: {
    deuda_total_ars: number;
    deuda_total_eur: number;
    pago_minimo_total_ars: number;
    costo_real_promedio_ponderado: number;
    deuda_critica_urgente_ars: number; // Deudas con costo real positivo
    deuda_licuandose_ars: number;       // Deudas con costo real negativo (cuotas sin interés)
  };
  macro: VariablesMacroeconomicas;
  plan_excedente: {
    excedente_ingresado_ars: number;
    excedente_utilizado_ars: number;
    excedente_destinado_a_inversion_ars: number; // Cuando el excedente no debe ir a cuotas sin interés
    asignaciones: AsignacionExcedente[];
    dictamen_estrategico: string;
  };
}
