import { jsPDF } from 'jspdf';
import type { CurrentData, LogEntry } from './types';

export function exportPDF(logEntries: LogEntry[], currentData: CurrentData, waterSaved: number | null) {
  if (logEntries.length === 0) {
    alert('No hay registros. Realiza al menos un análisis primero.');
    return;
  }

  const doc = new jsPDF();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(125, 44, 68);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AgroSentinel', 20, 22);
  doc.setTextColor(107, 86, 66);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Monitor de Estres Hidrico — Reporte de Decisiones IA', 20, 29);
  doc.text('Generado: ' + new Date().toLocaleString('es-CR'), 20, 35);
  doc.setDrawColor(125, 44, 68);
  doc.setLineWidth(0.3);
  doc.line(20, 39, 190, 39);

  doc.setTextColor(107, 86, 66);
  doc.setFontSize(8);
  doc.text('DATOS INGRESADOS (ultimo analisis)', 20, 47);
  doc.setTextColor(46, 32, 19);
  doc.setFontSize(9);
  doc.text(
    `NDVI: ${currentData.ndvi.toFixed(2)}   Temp: ${currentData.temperatura_c}°C   Hum suelo: ${currentData.humedad_suelo_pct}%   Precip: ${currentData.precipitacion_mm}mm   Dias sin lluvia: ${currentData.dias_sin_lluvia}`,
    20,
    54,
  );

  let y = 64;
  if (waterSaved !== null) {
    doc.setTextColor(38, 138, 74);
    doc.setFontSize(9);
    doc.text(`Agua ahorrada estimada: ${waterSaved} litros/m²`, 20, y);
    y += 8;
  }

  doc.setTextColor(107, 86, 66);
  doc.setFontSize(8);
  doc.text('REGISTRO DE DECISIONES', 20, y);
  y += 6;

  logEntries.slice(0, 16).forEach((entry) => {
    const color = entry.nivel_alerta === 'NORMAL' ? [38, 138, 74] : entry.nivel_alerta === 'LEVE' ? [184, 121, 31] : [178, 58, 44];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(22, y - 1.5, 1.2, 'F');
    doc.setTextColor(46, 32, 19);
    doc.setFontSize(8);
    doc.text(entry.time, 26, y);
    doc.text(entry.valvula, 46, y);
    const snapshot = `NDVI ${entry.snapshot.ndvi.toFixed(2)} · ${entry.snapshot.temperatura_c}°C · Hum ${entry.snapshot.humedad_suelo_pct}%`;
    doc.text(snapshot, 68, y);
    const accion = entry.accion.length > 85 ? entry.accion.slice(0, 85) + '…' : entry.accion;
    doc.setFontSize(7);
    doc.setTextColor(107, 86, 66);
    doc.text(accion, 26, y + 4);
    y += 10;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.setTextColor(160, 150, 140);
  doc.setFontSize(7);
  doc.text('AgroSentinel — Intel InNow Technology Fest 2026', 20, 290);

  doc.save(`AgroSentinel_Reporte_${new Date().toISOString().slice(0, 10)}.pdf`);
}
