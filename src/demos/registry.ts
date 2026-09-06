import type { FC } from 'react';
import type { DemoProps } from './primitives';
import { WardTwinDemo, NightEconomyDemo, ManuscriptIntelDemo, CampusLoadDemo, SkuHierarchyDemo, ModelWatchDemo } from './chapter01-02';
import { UpliftDemo, SyntheticControlDemo, WarehouseSimDemo, LandUseDemo, InspectionKpiDemo, RobustnessAuditDemo } from './chapter03-04';
import { NightlyFabricDemo, ScoreApiDemo, ExecKpiDemo, SupplierRiskDemo, CollabMapDemo, FraudRingDemo } from './chapter05-06';
import { VicEdFlowDemo, RentAtlasDemo, GridPeakDemo, InvoiceLeakDemo } from './fieldDesks';

/** Interactive, in-browser demo for each project id. Mirrors the runnable code in `projects/<id>/main.py`. */
export const demoRegistry: Record<string, FC<DemoProps>> = {
  'ward-twin-synthetic': WardTwinDemo,
  'night-economy-counterfactual': NightEconomyDemo,
  'manuscript-intel': ManuscriptIntelDemo,
  'campus-load-forecast': CampusLoadDemo,
  'sku-hierarchy': SkuHierarchyDemo,
  'model-watch-desk': ModelWatchDemo,
  'retention-uplift': UpliftDemo,
  'fare-synthetic-control': SyntheticControlDemo,
  'warehouse-twin-sim': WarehouseSimDemo,
  'land-use-change': LandUseDemo,
  'inspection-kpi': InspectionKpiDemo,
  'vision-robustness-audit': RobustnessAuditDemo,
  'nightly-analytics-fabric': NightlyFabricDemo,
  'score-api': ScoreApiDemo,
  'exec-kpi-twin': ExecKpiDemo,
  'supplier-risk-web': SupplierRiskDemo,
  'collab-map': CollabMapDemo,
  'fraud-ring': FraudRingDemo,
  'vic-ed-flow': VicEdFlowDemo,
  'rent-pressure-atlas': RentAtlasDemo,
  'vic-grid-peak': GridPeakDemo,
  'invoice-leak-desk': InvoiceLeakDemo,
};
