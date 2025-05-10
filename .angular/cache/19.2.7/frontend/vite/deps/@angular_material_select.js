import {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-RBNL6RHV.js";
import "./chunk-E5VNTCAI.js";
import "./chunk-DVBPRQVN.js";
import "./chunk-MYGWYFJK.js";
import "./chunk-OIZAD6NR.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-4NEMIBH5.js";
import "./chunk-62XQCIF5.js";
import "./chunk-5G3CKESK.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-RPVZYNY7.js";
import "./chunk-TJFXYFZX.js";
import "./chunk-EIKSUSSA.js";
import "./chunk-FK7OJCKX.js";
import "./chunk-M3F6YPZA.js";
import "./chunk-SZS4RJEH.js";
import "./chunk-IUAPF5JB.js";
import "./chunk-AQ3C3XL6.js";
import "./chunk-EVQUVBAU.js";
import "./chunk-5NH6PEPZ.js";
import "./chunk-UCL4LZVP.js";
import "./chunk-IFTZZKWL.js";
import "./chunk-TRES2BGH.js";
import "./chunk-WNB2LB2T.js";
import "./chunk-YCGZSIWM.js";
import "./chunk-M3HR6BUY.js";
import "./chunk-MVFG3JTJ.js";
import "./chunk-AHK4RYKX.js";
import "./chunk-UDU42JBG.js";
import "./chunk-MOV2PGJV.js";
import "./chunk-HEUZC2DL.js";
import "./chunk-LLSYBTIE.js";
import "./chunk-STPTZZ47.js";
import "./chunk-45D34AXQ.js";
import "./chunk-NAN6RB5O.js";
import "./chunk-ABKXCPE2.js";
import "./chunk-D5HA4SGY.js";
import "./chunk-MI7JQR32.js";
import "./chunk-TXCUGLBZ.js";
import "./chunk-WPM5VTLQ.js";
import "./chunk-PEBH6BBU.js";
import "./chunk-4S3KYZTJ.js";
import "./chunk-X7L4HDFA.js";

// node_modules/@angular/material/fesm2022/select.mjs
var matSelectAnimations = {
  // Represents
  // trigger('transformPanelWrap', [
  //   transition('* => void', query('@transformPanel', [animateChild()], {optional: true})),
  // ])
  /**
   * This animation ensures the select's overlay panel animation (transformPanel) is called when
   * closing the select.
   * This is needed due to https://github.com/angular/angular/issues/23302
   */
  transformPanelWrap: {
    type: 7,
    name: "transformPanelWrap",
    definitions: [{
      type: 1,
      expr: "* => void",
      animation: {
        type: 11,
        selector: "@transformPanel",
        animation: [{
          type: 9,
          options: null
        }],
        options: {
          optional: true
        }
      },
      options: null
    }],
    options: {}
  },
  // Represents
  // trigger('transformPanel', [
  //   state(
  //     'void',
  //     style({
  //       opacity: 0,
  //       transform: 'scale(1, 0.8)',
  //     }),
  //   ),
  //   transition(
  //     'void => showing',
  //     animate(
  //       '120ms cubic-bezier(0, 0, 0.2, 1)',
  //       style({
  //         opacity: 1,
  //         transform: 'scale(1, 1)',
  //       }),
  //     ),
  //   ),
  //   transition('* => void', animate('100ms linear', style({opacity: 0}))),
  // ])
  /** This animation transforms the select's overlay panel on and off the page. */
  transformPanel: {
    type: 7,
    name: "transformPanel",
    definitions: [{
      type: 0,
      name: "void",
      styles: {
        type: 6,
        styles: {
          opacity: 0,
          transform: "scale(1, 0.8)"
        },
        offset: null
      }
    }, {
      type: 1,
      expr: "void => showing",
      animation: {
        type: 4,
        styles: {
          type: 6,
          styles: {
            opacity: 1,
            transform: "scale(1, 1)"
          },
          offset: null
        },
        timings: "120ms cubic-bezier(0, 0, 0.2, 1)"
      },
      options: null
    }, {
      type: 1,
      expr: "* => void",
      animation: {
        type: 4,
        styles: {
          type: 6,
          styles: {
            opacity: 0
          },
          offset: null
        },
        timings: "100ms linear"
      },
      options: null
    }],
    options: {}
  }
};
export {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatOptgroup,
  MatOption,
  MatPrefix,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger,
  MatSuffix,
  matSelectAnimations
};
//# sourceMappingURL=@angular_material_select.js.map
