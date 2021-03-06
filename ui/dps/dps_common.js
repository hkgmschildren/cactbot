import ContentType from '../../resources/content_type.js';
import { Util } from '../../resources/common.js';
import ZoneInfo from '../../resources/zone_info.js';

export let Options = {
  Language: 'en',
  IgnoreContentTypes: [
    ContentType.Pvp,
    ContentType.Eureka,
  ],
};

let gIgnoreCurrentZone = false;
let gIgnoreCurrentJob = false;
let gCurrentJob = null;
let gCurrentZone = null;
let gInCombat = false;

export const InitDpsModule = function(updateFunc, hideFunc) {
  addOverlayListener('CombatData', (e) => {
    // DPS numbers in large pvp is not useful and hella noisy.
    if (gIgnoreCurrentZone || gIgnoreCurrentJob)
      return;

    // When ACT stops, stop updating.  This is mostly to avoid
    // a spurious update when changing zones which will unhide
    // the dps overlay.
    if (!gInCombat)
      return;

    // Don't bother showing the first "Infinity" dps right as
    // combat starts.
    let dps = parseFloat(e.Encounter.encdps);
    if (dps <= 0 || dps === Infinity)
      return;

    updateFunc({ detail: e });
  });

  addOverlayListener('ChangeZone', (e) => {
    let newZone = e.zoneName;
    if (gCurrentZone === newZone)
      return;
    // Always hide on switching zones.
    hideFunc();
    gCurrentZone = newZone;

    const zoneInfo = ZoneInfo[e.zoneID];
    const contentType = zoneInfo ? zoneInfo.contentType : 0;
    gIgnoreCurrentZone = Options.IgnoreContentTypes.includes(contentType);
  });

  addOverlayListener('onInCombatChangedEvent', (e) => {
    gInCombat = e.detail.inACTCombat;
  });

  addOverlayListener('onPlayerChangedEvent', (e) => {
    let job = e.detail.job;
    if (job === gCurrentJob)
      return;
    gCurrentJob = job;
    if (Util.isCombatJob(job)) {
      gIgnoreCurrentJob = false;
      return;
    }
    gIgnoreCurrentJob = true;
    hideFunc();
  });
};
