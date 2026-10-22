/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VariablesMacroeconomicas } from '../types/debt';

const CACHE_KEY_MACRO = 'finanzaris_macro_variables_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora de caché

/**
 * Variables de contingencia realistas si las APIs están caídas o en modo offline PWA
 */
export const DEFAULT_MACRO_VARIABLES: VariablesMacroeconomicas = {
  tipo_cambio_eur_ars: 1420.0,
  inflacion_mensual_estimada: 3.2,
  inflacion_anual_estimada: 45.0,
  devaluacion_anual_eur_ars: 38.0,
  tasa_riesgo_cambiario_anual: 8.5,
  tasa_libre_riesgo_ars: 36.0, // Tasa de referencia money market / caución
  fecha_actualizacion: new Date().toISOString(),
  fuente_cotizacion: 'Respaldo Estimado (DolarApi Fallback)',
  fuente_inflacion: 'Respaldo Estimado (REM BCRA Fallback)',
};

interface DolarApiCotizacionResponse {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

interface ArgentinaDatosInflacionResponse {
  fecha: string;
  valor: number; // Porcentaje de inflación mensual
}

/**
 * Consulta la cotización del Euro con timeout
 */
async function fetchCotizacionEuro(): Promise<{ cotizacion: number; fuente: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch('https://dolarapi.com/v1/cotizaciones/eur', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`DolarApi error HTTP ${res.status}`);
    }

    const data: DolarApiCotizacionResponse = await res.json();
    const cotizacion = data.venta > 0 ? data.venta : data.compra;

    if (!cotizacion || isNaN(cotizacion)) {
      throw new Error('Cotización de Euro inválida');
    }

    return {
      cotizacion,
      fuente: `DolarApi (${data.casa || 'Oficial'} - ${new Date(data.fechaActualizacion || Date.now()).toLocaleDateString()})`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Consulta la inflación mensual reciente desde ArgentinaDatos
 */
async function fetchInflacionReciente(): Promise<{ mensual: number; anual: number; fuente: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch('https://api.argentinadatos.com/v1/finanzas/indices/inflacion', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`ArgentinaDatos error HTTP ${res.status}`);
    }

    const data: ArgentinaDatosInflacionResponse[] = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      // Tomar los últimos registros válidos
      const ultimosRegistros = data.slice(-12);
      const ultimoMes = ultimosRegistros[ultimosRegistros.length - 1];
      const mensual = ultimoMes.valor;

      // Anualizar el último dato mensual: (1 + m)^12 - 1
      const anualCompuesta = (Math.pow(1 + mensual / 100, 12) - 1) * 100;

      return {
        mensual: Number(mensual.toFixed(1)),
        anual: Number(anualCompuesta.toFixed(1)),
        fuente: `ArgentinaDatos INDEC (${ultimoMes.fecha})`,
      };
    }

    throw new Error('Formato de datos de inflación inesperado');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Obtiene las variables macroeconómicas actualizadas, utilizando caché de 1h
 * y cayendo en fallback seguro ante cualquier fallo de red o modo offline.
 */
export async function fetchVariablesMacroeconomicas(forzarRefresco = false): Promise<VariablesMacroeconomicas> {
  // 1. Verificar caché en localStorage
  if (!forzarRefresco && typeof window !== 'undefined') {
    try {
      const cacheItem = localStorage.getItem(CACHE_KEY_MACRO);
      if (cacheItem) {
        const { timestamp, data } = JSON.parse(cacheItem);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          return data as VariablesMacroeconomicas;
        }
      }
    } catch {
      // Continuar a red si falla lectura de caché
    }
  }

  // 2. Ejecutar llamadas en paralelo con resiliencia individual
  const [euroResult, inflacionResult] = await Promise.allSettled([
    fetchCotizacionEuro(),
    fetchInflacionReciente(),
  ]);

  const tipo_cambio_eur_ars = euroResult.status === 'fulfilled' 
    ? euroResult.value.cotizacion 
    : DEFAULT_MACRO_VARIABLES.tipo_cambio_eur_ars;

  const fuente_cotizacion = euroResult.status === 'fulfilled'
    ? euroResult.value.fuente
    : DEFAULT_MACRO_VARIABLES.fuente_cotizacion;

  const inflacion_mensual = inflacionResult.status === 'fulfilled'
    ? inflacionResult.value.mensual
    : DEFAULT_MACRO_VARIABLES.inflacion_mensual_estimada;

  const inflacion_anual = inflacionResult.status === 'fulfilled'
    ? inflacionResult.value.anual
    : DEFAULT_MACRO_VARIABLES.inflacion_anual_estimada;

  const fuente_inflacion = inflacionResult.status === 'fulfilled'
    ? inflacionResult.value.fuente
    : DEFAULT_MACRO_VARIABLES.fuente_inflacion;

  // Proyectar devaluación esperada EUR/ARS proporcional a la inflación menos la inflación de la eurozona (~2.5%)
  const devaluacion_estimada = Math.max(10, inflacion_anual - 4.0);

  const variablesCalculadas: VariablesMacroeconomicas = {
    tipo_cambio_eur_ars,
    inflacion_mensual_estimada: inflacion_mensual,
    inflacion_anual_estimada: inflacion_anual,
    devaluacion_anual_eur_ars: Number(devaluacion_estimada.toFixed(1)),
    tasa_riesgo_cambiario_anual: DEFAULT_MACRO_VARIABLES.tasa_riesgo_cambiario_anual,
    tasa_libre_riesgo_ars: DEFAULT_MACRO_VARIABLES.tasa_libre_riesgo_ars,
    fecha_actualizacion: new Date().toISOString(),
    fuente_cotizacion,
    fuente_inflacion,
  };

  // 3. Persistir en caché
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        CACHE_KEY_MACRO,
        JSON.stringify({ timestamp: Date.now(), data: variablesCalculadas })
      );
    } catch {
      // Ignorar quota exceeded en safari private
    }
  }

  return variablesCalculadas;
}
