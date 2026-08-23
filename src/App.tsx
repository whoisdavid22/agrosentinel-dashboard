import { useState } from 'react';
import { useDashboard, EDGE_CASES } from './hooks/useDashboard';
import { TAB_LABELS } from './lib/i18n';
import type { TabId } from './lib/tabs';
import { exportPDF } from './lib/exportPdf';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import MobileTabNav from './components/MobileTabNav';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import Copilot from './components/Copilot';
import QRModal from './components/QRModal';
import DecisionTab from './components/tabs/DecisionTab';
import Valve3DTab from './components/tabs/Valve3DTab';
import CompareTab from './components/tabs/CompareTab';
import PredictionsTab from './components/tabs/PredictionsTab';
import ChartsTab from './components/tabs/ChartsTab';
import MapTab from './components/tabs/MapTab';
import EdgeTab from './components/tabs/EdgeTab';
import SimuladorTab from './components/tabs/SimuladorTab';
import RedTab from './components/tabs/RedTab';
import HistorialTab from './components/tabs/HistorialTab';
import ValidacionTab from './components/tabs/ValidacionTab';

export default function App() {
  const d = useDashboard();
  const [tab, setTab] = useState<TabId>('decision');
  const [qrOpen, setQrOpen] = useState(false);

  if (d.authLoading) {
    return (
      <div className="fixed inset-0 bg-[#0d0d0f] flex items-center justify-center">
        <span className="text-white/40 text-sm">Cargando...</span>
      </div>
    );
  }

  if (!d.user) {
    return <AuthScreen />;
  }

  const pct = d.offline
    ? d.offline.calc.aperturaPct
    : d.lastResponse
      ? typeof d.lastResponse.porcentaje_apertura === 'number'
        ? d.lastResponse.porcentaje_apertura
        : d.lastResponse.valvula === 'ABIERTA'
          ? 100
          : 0
      : 0;
  const level = d.offline ? d.offline.calc.nivel : (d.lastResponse?.nivel_alerta ?? null);
  const labels = TAB_LABELS[d.lang];

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex">
      <Sidebar active={tab} onSelect={setTab} labels={labels} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          userEmail={d.user.email ?? null}
          apiStatus={d.apiStatus}
          apiStatusLabel={d.apiStatusLabel}
          lang={d.lang}
          onToggleLang={() => d.setLang(d.lang === 'es' ? 'en' : 'es')}
          onOpenQR={() => setQrOpen(true)}
          onExportPDF={() => exportPDF(d.logEntries, d.currentData, d.impact?.litros ?? null)}
        />
        <MobileTabNav active={tab} onSelect={setTab} labels={labels} />

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          <LeftPanel
            currentData={d.currentData}
            updateField={d.updateField}
            fetchData={d.fetchData}
            isLoading={d.isLoading}
            lastResponse={d.lastResponse}
            offline={d.offline}
            autoActive={d.autoActive}
            toggleAuto={d.toggleAuto}
            autoInterval={d.autoInterval}
            setAutoInterval={d.setAutoInterval}
            autoCountdown={d.autoCountdown}
            demoRunning={d.demoRunning}
            runDemoMode={d.runDemoMode}
            analyzeImage={d.analyzeImage}
          />

          <main className="flex-1 min-w-0 overflow-y-auto p-5 sm:p-6">
            {tab === 'decision' && <DecisionTab lastResponse={d.lastResponse} offline={d.offline} logEntries={d.logEntries} />}
            {tab === 'valve3d' && <Valve3DTab pct={pct} />}
            {tab === 'compare' && <CompareTab lastResponse={d.lastResponse} aguaAhorradaAcumulada={d.aguaAhorradaAcumulada} analisisAcumulados={d.analisisAcumulados} />}
            {tab === 'predictions' && (
              <PredictionsTab predictions={d.predictions} level={level} hum={d.currentData.humedad_suelo_pct} temp={d.currentData.temperatura_c} ndvi={d.currentData.ndvi} />
            )}
            {tab === 'charts' && <ChartsTab chartHistory={d.chartHistory} />}
            {tab === 'map' && (
              <MapTab
                hum={d.currentData.humedad_suelo_pct}
                ndvi={d.currentData.ndvi}
                usingImageZones={d.usingImageZones}
                imageZones={d.imageZones}
                resetMapToSimulation={d.resetMapToSimulation}
              />
            )}
            {tab === 'edge' && <EdgeTab applyEdgeCase={(name: keyof typeof EDGE_CASES) => d.applyEdgeCase(name)} isLoading={d.isLoading} />}
            {tab === 'simulador' && <SimuladorTab currentData={d.currentData} />}
            {tab === 'red' && <RedTab />}
            {tab === 'historial' && (
              <HistorialTab historial={d.historial} historialStatus={d.historialStatus} cargarHistorialReal={d.cargarHistorialReal} loggedIn={!!d.user} />
            )}
            {tab === 'validacion' && <ValidacionTab />}
          </main>
        </div>
      </div>

      <Copilot messages={d.chatMessages} loading={d.chatLoading} sendMessage={d.sendCopilotMessage} />
      <QRModal open={qrOpen} onClose={() => setQrOpen(false)} />

      {d.demoNarration && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[2500] max-w-[600px] w-[92%] bg-[#1c1330] text-white px-5 py-3.5 rounded-xl text-[13px] leading-relaxed shadow-2xl border-l-4 border-[#8f5da6]">
          {d.demoNarration}
        </div>
      )}
    </div>
  );
}
