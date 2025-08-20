import {
  require_leaflet_src
} from "./chunk-NUYZKGF5.js";
import {
  __commonJS
} from "./chunk-X7L4HDFA.js";

// node_modules/leaflet-editable/src/Leaflet.Editable.js
var require_Leaflet_Editable = __commonJS({
  "node_modules/leaflet-editable/src/Leaflet.Editable.js"(exports, module) {
    ((factory, window2) => {
      if (typeof define === "function" && define.amd) {
        define(["leaflet"], factory);
      } else if (typeof exports === "object") {
        module.exports = factory(require_leaflet_src());
      }
      if (typeof window2 !== "undefined" && window2.L) {
        factory(window2.L);
      }
    })((L) => {
      L.Editable = L.Evented.extend({
        statics: {
          FORWARD: 1,
          BACKWARD: -1
        },
        options: {
          // You can pass them when creating a map using the `editOptions` key.
          // 🍂option zIndex: int = 1000
          // The default zIndex of the editing tools.
          zIndex: 1e3,
          // 🍂option polygonClass: class = L.Polygon
          // Class to be used when creating a new Polygon.
          polygonClass: L.Polygon,
          // 🍂option polylineClass: class = L.Polyline
          // Class to be used when creating a new Polyline.
          polylineClass: L.Polyline,
          // 🍂option markerClass: class = L.Marker
          // Class to be used when creating a new Marker.
          markerClass: L.Marker,
          // 🍂option circleMarkerClass: class = L.CircleMarker
          // Class to be used when creating a new CircleMarker.
          circleMarkerClass: L.CircleMarker,
          // 🍂option rectangleClass: class = L.Rectangle
          // Class to be used when creating a new Rectangle.
          rectangleClass: L.Rectangle,
          // 🍂option circleClass: class = L.Circle
          // Class to be used when creating a new Circle.
          circleClass: L.Circle,
          // 🍂option drawingCSSClass: string = 'leaflet-editable-drawing'
          // CSS class to be added to the map container while drawing.
          drawingCSSClass: "leaflet-editable-drawing",
          // 🍂option drawingCursor: const = 'crosshair'
          // Cursor mode set to the map while drawing.
          drawingCursor: "crosshair",
          // 🍂option editLayer: Layer = new L.LayerGroup()
          // Layer used to store edit tools (vertex, line guide…).
          editLayer: void 0,
          // 🍂option featuresLayer: Layer = new L.LayerGroup()
          // Default layer used to store drawn features (Marker, Polyline…).
          featuresLayer: void 0,
          // 🍂option polylineEditorClass: class = PolylineEditor
          // Class to be used as Polyline editor.
          polylineEditorClass: void 0,
          // 🍂option polygonEditorClass: class = PolygonEditor
          // Class to be used as Polygon editor.
          polygonEditorClass: void 0,
          // 🍂option markerEditorClass: class = MarkerEditor
          // Class to be used as Marker editor.
          markerEditorClass: void 0,
          // 🍂option circleMarkerEditorClass: class = CircleMarkerEditor
          // Class to be used as CircleMarker editor.
          circleMarkerEditorClass: void 0,
          // 🍂option rectangleEditorClass: class = RectangleEditor
          // Class to be used as Rectangle editor.
          rectangleEditorClass: void 0,
          // 🍂option circleEditorClass: class = CircleEditor
          // Class to be used as Circle editor.
          circleEditorClass: void 0,
          // 🍂option lineGuideOptions: hash = {}
          // Options to be passed to the line guides.
          lineGuideOptions: {},
          // 🍂option skipMiddleMarkers: boolean = false
          // Set this to true if you don't want middle markers.
          skipMiddleMarkers: false
        },
        initialize: function(map, options) {
          L.setOptions(this, options);
          this._lastZIndex = this.options.zIndex;
          this.map = map;
          this.editLayer = this.createEditLayer();
          this.featuresLayer = this.createFeaturesLayer();
          this.forwardLineGuide = this.createLineGuide();
          this.backwardLineGuide = this.createLineGuide();
        },
        fireAndForward: function(type, e) {
          e = e || {};
          e.editTools = this;
          this.fire(type, e);
          this.map.fire(type, e);
        },
        createLineGuide: function() {
          const options = L.extend({
            dashArray: "5,10",
            weight: 1,
            interactive: false
          }, this.options.lineGuideOptions);
          return L.polyline([], options);
        },
        createVertexIcon: (options) => L.Browser.mobile && L.Browser.touch ? new L.Editable.TouchVertexIcon(options) : new L.Editable.VertexIcon(options),
        createEditLayer: function() {
          return this.options.editLayer || new L.LayerGroup().addTo(this.map);
        },
        createFeaturesLayer: function() {
          return this.options.featuresLayer || new L.LayerGroup().addTo(this.map);
        },
        moveForwardLineGuide: function(latlng) {
          if (this.forwardLineGuide._latlngs.length) {
            this.forwardLineGuide._latlngs[1] = latlng;
            this.forwardLineGuide._bounds.extend(latlng);
            this.forwardLineGuide.redraw();
          }
        },
        moveBackwardLineGuide: function(latlng) {
          if (this.backwardLineGuide._latlngs.length) {
            this.backwardLineGuide._latlngs[1] = latlng;
            this.backwardLineGuide._bounds.extend(latlng);
            this.backwardLineGuide.redraw();
          }
        },
        anchorForwardLineGuide: function(latlng) {
          this.forwardLineGuide._latlngs[0] = latlng;
          this.forwardLineGuide._bounds.extend(latlng);
          this.forwardLineGuide.redraw();
        },
        anchorBackwardLineGuide: function(latlng) {
          this.backwardLineGuide._latlngs[0] = latlng;
          this.backwardLineGuide._bounds.extend(latlng);
          this.backwardLineGuide.redraw();
        },
        attachForwardLineGuide: function() {
          this.editLayer.addLayer(this.forwardLineGuide);
        },
        attachBackwardLineGuide: function() {
          this.editLayer.addLayer(this.backwardLineGuide);
        },
        detachForwardLineGuide: function() {
          this.forwardLineGuide.setLatLngs([]);
          this.editLayer.removeLayer(this.forwardLineGuide);
        },
        detachBackwardLineGuide: function() {
          this.backwardLineGuide.setLatLngs([]);
          this.editLayer.removeLayer(this.backwardLineGuide);
        },
        blockEvents: function() {
          if (!this._oldTargets) {
            this._oldTargets = this.map._targets;
            this.map._targets = {};
          }
        },
        unblockEvents: function() {
          if (this._oldTargets) {
            this.map._targets = L.extend(this.map._targets, this._oldTargets);
            delete this._oldTargets;
          }
        },
        registerForDrawing: function(editor) {
          if (this._drawingEditor) this.unregisterForDrawing(this._drawingEditor);
          this.blockEvents();
          editor.reset();
          this._drawingEditor = editor;
          this.map.on("mousemove touchmove", editor.onDrawingMouseMove, editor);
          this.map.on("mousedown", this.onMousedown, this);
          this.map.on("mouseup", this.onMouseup, this);
          L.DomUtil.addClass(this.map._container, this.options.drawingCSSClass);
          this.defaultMapCursor = this.map._container.style.cursor;
          this.map._container.style.cursor = this.options.drawingCursor;
        },
        unregisterForDrawing: function(editor) {
          this.unblockEvents();
          L.DomUtil.removeClass(this.map._container, this.options.drawingCSSClass);
          this.map._container.style.cursor = this.defaultMapCursor;
          editor = editor || this._drawingEditor;
          if (!editor) return;
          this.map.off("mousemove touchmove", editor.onDrawingMouseMove, editor);
          this.map.off("mousedown", this.onMousedown, this);
          this.map.off("mouseup", this.onMouseup, this);
          if (editor !== this._drawingEditor) return;
          delete this._drawingEditor;
          if (editor._drawing) editor.cancelDrawing();
        },
        onMousedown: function(e) {
          if (e.originalEvent.which != 1) return;
          this._mouseDown = e;
          this._drawingEditor.onDrawingMouseDown(e);
        },
        onMouseup: function(e) {
          if (this._mouseDown) {
            const editor = this._drawingEditor;
            const mouseDown = this._mouseDown;
            this._mouseDown = null;
            editor.onDrawingMouseUp(e);
            if (this._drawingEditor !== editor) return;
            const origin = L.point(mouseDown.originalEvent.clientX, mouseDown.originalEvent.clientY);
            const distance = L.point(e.originalEvent.clientX, e.originalEvent.clientY).distanceTo(origin);
            if (Math.abs(distance) < 9 * (window.devicePixelRatio || 1)) this._drawingEditor.onDrawingClick(e);
          }
        },
        // 🍂section Public methods
        // You will generally access them by the `map.editTools`
        // instance:
        //
        // `map.editTools.startPolyline();`
        // 🍂method drawing(): boolean
        // Return true if any drawing action is ongoing.
        drawing: function() {
          return this._drawingEditor?.drawing();
        },
        // 🍂method stopDrawing()
        // When you need to stop any ongoing drawing, without needing to know which editor is active.
        stopDrawing: function() {
          this.unregisterForDrawing();
        },
        // 🍂method commitDrawing()
        // When you need to commit any ongoing drawing, without needing to know which editor is active.
        commitDrawing: function(e) {
          if (!this._drawingEditor) return;
          this._drawingEditor.commitDrawing(e);
        },
        connectCreatedToMap: function(layer) {
          return this.featuresLayer.addLayer(layer);
        },
        // 🍂method startPolyline(latlng: L.LatLng, options: hash): L.Polyline
        // Start drawing a Polyline. If `latlng` is given, a first point will be added. In any case, continuing on user click.
        // If `options` is given, it will be passed to the Polyline class constructor.
        startPolyline: function(latlng, options) {
          const line = this.createPolyline([], options);
          line.enableEdit(this.map).newShape(latlng);
          return line;
        },
        // 🍂method startPolygon(latlng: L.LatLng, options: hash): L.Polygon
        // Start drawing a Polygon. If `latlng` is given, a first point will be added. In any case, continuing on user click.
        // If `options` is given, it will be passed to the Polygon class constructor.
        startPolygon: function(latlng, options) {
          const polygon = this.createPolygon([], options);
          polygon.enableEdit(this.map).newShape(latlng);
          return polygon;
        },
        // 🍂method startMarker(latlng: L.LatLng, options: hash): L.Marker
        // Start adding a Marker. If `latlng` is given, the Marker will be shown first at this point.
        // In any case, it will follow the user mouse, and will have a final `latlng` on next click (or touch).
        // If `options` is given, it will be passed to the Marker class constructor.
        startMarker: function(latlng, options) {
          latlng = latlng || this.map.getCenter().clone();
          const marker = this.createMarker(latlng, options);
          marker.enableEdit(this.map).startDrawing();
          return marker;
        },
        // 🍂method startCircleMarker(latlng: L.LatLng, options: hash): L.CircleMarker
        // Start adding a CircleMarker. If `latlng` is given, the CircleMarker will be shown first at this point.
        // In any case, it will follow the user mouse, and will have a final `latlng` on next click (or touch).
        // If `options` is given, it will be passed to the CircleMarker class constructor.
        startCircleMarker: function(latlng, options) {
          latlng = latlng || this.map.getCenter().clone();
          const marker = this.createCircleMarker(latlng, options);
          marker.enableEdit(this.map).startDrawing();
          return marker;
        },
        // 🍂method startRectangle(latlng: L.LatLng, options: hash): L.Rectangle
        // Start drawing a Rectangle. If `latlng` is given, the Rectangle anchor will be added. In any case, continuing on user drag.
        // If `options` is given, it will be passed to the Rectangle class constructor.
        startRectangle: function(latlng, options) {
          const corner = latlng || L.latLng([0, 0]);
          const bounds = new L.LatLngBounds(corner, corner);
          const rectangle = this.createRectangle(bounds, options);
          rectangle.enableEdit(this.map).startDrawing();
          return rectangle;
        },
        // 🍂method startCircle(latlng: L.LatLng, options: hash): L.Circle
        // Start drawing a Circle. If `latlng` is given, the Circle anchor will be added. In any case, continuing on user drag.
        // If `options` is given, it will be passed to the Circle class constructor.
        startCircle: function(latlng, options) {
          latlng = latlng || this.map.getCenter().clone();
          const circle = this.createCircle(latlng, options);
          circle.enableEdit(this.map).startDrawing();
          return circle;
        },
        startHole: (editor, latlng) => {
          editor.newHole(latlng);
        },
        createLayer: function(klass, latlngs, options) {
          options = L.Util.extend({
            editOptions: {
              editTools: this
            }
          }, options);
          const layer = new klass(latlngs, options);
          this.fireAndForward("editable:created", {
            layer
          });
          return layer;
        },
        createPolyline: function(latlngs, options) {
          return this.createLayer(options?.polylineClass || this.options.polylineClass, latlngs, options);
        },
        createPolygon: function(latlngs, options) {
          return this.createLayer(options?.polygonClass || this.options.polygonClass, latlngs, options);
        },
        createMarker: function(latlng, options) {
          return this.createLayer(options?.markerClass || this.options.markerClass, latlng, options);
        },
        createCircleMarker: function(latlng, options) {
          return this.createLayer(options?.circleMarkerClass || this.options.circleMarkerClass, latlng, options);
        },
        createRectangle: function(bounds, options) {
          return this.createLayer(options?.rectangleClass || this.options.rectangleClass, bounds, options);
        },
        createCircle: function(latlng, options) {
          return this.createLayer(options?.circleClass || this.options.circleClass, latlng, options);
        }
      });
      L.extend(L.Editable, {
        makeCancellable: (e) => {
          e.cancel = () => {
            e._cancelled = true;
          };
        }
      });
      L.Map.mergeOptions({
        // 🍂namespace Map
        // 🍂section Map Options
        // 🍂option editToolsClass: class = L.Editable
        // Class to be used as vertex, for path editing.
        editToolsClass: L.Editable,
        // 🍂option editable: boolean = false
        // Whether to create a L.Editable instance at map init.
        editable: false,
        // 🍂option editOptions: hash = {}
        // Options to pass to L.Editable when instantiating.
        editOptions: {}
      });
      L.Map.addInitHook(function() {
        this.whenReady(function() {
          if (this.options.editable) {
            this.editTools = new this.options.editToolsClass(this, this.options.editOptions);
          }
        });
      });
      L.Editable.VertexIcon = L.DivIcon.extend({
        options: {
          iconSize: new L.Point(8, 8)
        }
      });
      L.Editable.TouchVertexIcon = L.Editable.VertexIcon.extend({
        options: {
          iconSize: new L.Point(20, 20)
        }
      });
      L.Editable.VertexMarker = L.Marker.extend({
        options: {
          draggable: true,
          className: "leaflet-div-icon leaflet-vertex-icon"
        },
        // 🍂section Public methods
        // The marker used to handle path vertex. You will usually interact with a `VertexMarker`
        // instance when listening for events like `editable:vertex:ctrlclick`.
        initialize: function(latlng, latlngs, editor, options) {
          this.latlng = latlng;
          this.latlngs = latlngs;
          this.editor = editor;
          L.Marker.prototype.initialize.call(this, latlng, options);
          this.options.icon = this.editor.tools.createVertexIcon({
            className: this.options.className
          });
          this.latlng.__vertex = this;
          this.connect();
          this.setZIndexOffset(editor.tools._lastZIndex + 1);
        },
        connect: function() {
          this.editor.editLayer.addLayer(this);
        },
        onAdd: function(map) {
          L.Marker.prototype.onAdd.call(this, map);
          this.on("drag", this.onDrag);
          this.on("dragstart", this.onDragStart);
          this.on("dragend", this.onDragEnd);
          this.on("mouseup", this.onMouseup);
          this.on("click", this.onClick);
          this.on("contextmenu", this.onContextMenu);
          this.on("mousedown touchstart", this.onMouseDown);
          this.on("mouseover", this.onMouseOver);
          this.on("mouseout", this.onMouseOut);
          this.addMiddleMarkers();
        },
        onRemove: function(map) {
          if (this.middleMarker) this.middleMarker.delete();
          delete this.latlng.__vertex;
          this.off("drag", this.onDrag);
          this.off("dragstart", this.onDragStart);
          this.off("dragend", this.onDragEnd);
          this.off("mouseup", this.onMouseup);
          this.off("click", this.onClick);
          this.off("contextmenu", this.onContextMenu);
          this.off("mousedown touchstart", this.onMouseDown);
          this.off("mouseover", this.onMouseOver);
          this.off("mouseout", this.onMouseOut);
          L.Marker.prototype.onRemove.call(this, map);
        },
        onDrag: function(e) {
          e.vertex = this;
          this.editor.onVertexMarkerDrag(e);
          const iconPos = L.DomUtil.getPosition(this._icon);
          const latlng = this._map.layerPointToLatLng(iconPos);
          this.latlng.update(latlng);
          this._latlng = this.latlng;
          this.editor.refresh();
          if (this.middleMarker) this.middleMarker.updateLatLng();
          const next = this.getNext();
          if (next?.middleMarker) next.middleMarker.updateLatLng();
        },
        onDragStart: function(e) {
          e.vertex = this;
          this.editor.onVertexMarkerDragStart(e);
        },
        onDragEnd: function(e) {
          e.vertex = this;
          this.editor.onVertexMarkerDragEnd(e);
        },
        onClick: function(e) {
          e.vertex = this;
          this.editor.onVertexMarkerClick(e);
        },
        onMouseup: function(e) {
          L.DomEvent.stop(e);
          e.vertex = this;
          this.editor.map.fire("mouseup", e);
        },
        onContextMenu: function(e) {
          e.vertex = this;
          this.editor.onVertexMarkerContextMenu(e);
        },
        onMouseDown: function(e) {
          e.vertex = this;
          this.editor.onVertexMarkerMouseDown(e);
        },
        onMouseOver: function(e) {
          e.vertex = this;
          this.editor.onVertexMarkerMouseOver(e);
        },
        onMouseOut: function(e) {
          e.vertex = this;
          this.editor.onVertexMarkerMouseOut(e);
        },
        // 🍂method delete()
        // Delete a vertex and the related LatLng.
        delete: function() {
          const next = this.getNext();
          this.latlngs.splice(this.getIndex(), 1);
          this.editor.editLayer.removeLayer(this);
          this.editor.onVertexDeleted({
            latlng: this.latlng,
            vertex: this
          });
          if (!this.latlngs.length) this.editor.deleteShape(this.latlngs);
          if (next) next.resetMiddleMarker();
          this.editor.refresh();
        },
        // 🍂method getIndex(): int
        // Get the index of the current vertex among others of the same LatLngs group.
        getIndex: function() {
          return this.latlngs.indexOf(this.latlng);
        },
        // 🍂method getLastIndex(): int
        // Get last vertex index of the LatLngs group of the current vertex.
        getLastIndex: function() {
          return this.latlngs.length - 1;
        },
        // 🍂method getPrevious(): VertexMarker
        // Get the previous VertexMarker in the same LatLngs group.
        getPrevious: function() {
          if (this.latlngs.length < 2) return;
          const index = this.getIndex();
          let previousIndex = index - 1;
          if (index === 0 && this.editor.CLOSED) previousIndex = this.getLastIndex();
          const previous = this.latlngs[previousIndex];
          if (previous) return previous.__vertex;
        },
        // 🍂method getNext(): VertexMarker
        // Get the next VertexMarker in the same LatLngs group.
        getNext: function() {
          if (this.latlngs.length < 2) return;
          const index = this.getIndex();
          let nextIndex = index + 1;
          if (index === this.getLastIndex() && this.editor.CLOSED) nextIndex = 0;
          const next = this.latlngs[nextIndex];
          if (next) return next.__vertex;
        },
        addMiddleMarker: function(previous) {
          if (!this.editor.hasMiddleMarkers()) return;
          previous = previous || this.getPrevious();
          if (previous && !this.middleMarker) this.middleMarker = this.editor.addMiddleMarker(previous, this, this.latlngs, this.editor);
        },
        addMiddleMarkers: function() {
          if (!this.editor.hasMiddleMarkers()) return;
          const previous = this.getPrevious();
          if (previous) this.addMiddleMarker(previous);
          const next = this.getNext();
          if (next) next.resetMiddleMarker();
        },
        resetMiddleMarker: function() {
          if (this.middleMarker) this.middleMarker.delete();
          this.addMiddleMarker();
        },
        // 🍂method split()
        // Split the vertex LatLngs group at its index, if possible.
        split: function() {
          if (!this.editor.splitShape) return;
          this.editor.splitShape(this.latlngs, this.getIndex());
        },
        // 🍂method continue()
        // Continue the vertex LatLngs from this vertex. Only active for first and last vertices of a Polyline.
        continue: function() {
          if (!this.editor.continueBackward) return;
          const index = this.getIndex();
          if (index === 0) this.editor.continueBackward(this.latlngs);
          else if (index === this.getLastIndex()) this.editor.continueForward(this.latlngs);
        }
      });
      L.Editable.mergeOptions({
        // 🍂namespace Editable
        // 🍂option vertexMarkerClass: class = VertexMarker
        // Class to be used as vertex, for path editing.
        vertexMarkerClass: L.Editable.VertexMarker
      });
      L.Editable.MiddleMarker = L.Marker.extend({
        options: {
          opacity: 0.5,
          className: "leaflet-div-icon leaflet-middle-icon",
          draggable: true
        },
        initialize: function(left, right, latlngs, editor, options) {
          this.left = left;
          this.right = right;
          this.editor = editor;
          this.latlngs = latlngs;
          L.Marker.prototype.initialize.call(this, this.computeLatLng(), options);
          this._opacity = this.options.opacity;
          this.options.icon = this.editor.tools.createVertexIcon({
            className: this.options.className
          });
          this.editor.editLayer.addLayer(this);
          this.setVisibility();
        },
        setVisibility: function() {
          const leftPoint = this._map.latLngToContainerPoint(this.left.latlng);
          const rightPoint = this._map.latLngToContainerPoint(this.right.latlng);
          const size = L.point(this.options.icon.options.iconSize);
          if (leftPoint.distanceTo(rightPoint) < size.x * 3) this.hide();
          else this.show();
        },
        show: function() {
          this.setOpacity(this._opacity);
        },
        hide: function() {
          this.setOpacity(0);
        },
        updateLatLng: function() {
          this.setLatLng(this.computeLatLng());
          this.setVisibility();
        },
        computeLatLng: function() {
          const leftPoint = this.editor.map.latLngToContainerPoint(this.left.latlng);
          const rightPoint = this.editor.map.latLngToContainerPoint(this.right.latlng);
          const y = (leftPoint.y + rightPoint.y) / 2;
          const x = (leftPoint.x + rightPoint.x) / 2;
          return this.editor.map.containerPointToLatLng([x, y]);
        },
        onAdd: function(map) {
          L.Marker.prototype.onAdd.call(this, map);
          L.DomEvent.on(this._icon, "mousedown touchstart", this.onMouseDown, this);
          map.on("zoomend", this.setVisibility, this);
        },
        onRemove: function(map) {
          delete this.right.middleMarker;
          L.DomEvent.off(this._icon, "mousedown touchstart", this.onMouseDown, this);
          map.off("zoomend", this.setVisibility, this);
          L.Marker.prototype.onRemove.call(this, map);
        },
        onMouseDown: function(e) {
          const iconPos = L.DomUtil.getPosition(this._icon);
          const latlng = this.editor.map.layerPointToLatLng(iconPos);
          e = {
            originalEvent: e,
            latlng
          };
          if (this.options.opacity === 0) return;
          L.Editable.makeCancellable(e);
          this.editor.onMiddleMarkerMouseDown(e);
          if (e._cancelled) return;
          this.latlngs.splice(this.index(), 0, e.latlng);
          this.editor.refresh();
          const icon = this._icon;
          const marker = this.editor.addVertexMarker(e.latlng, this.latlngs);
          this.editor.onNewVertex(marker);
          const parent = marker._icon.parentNode;
          parent.removeChild(marker._icon);
          marker._icon = icon;
          parent.appendChild(marker._icon);
          marker._initIcon();
          marker._initInteraction();
          marker.setOpacity(1);
          L.Draggable._dragging = false;
          marker.dragging._draggable._onDown(e.originalEvent);
          this.delete();
        },
        delete: function() {
          this.editor.editLayer.removeLayer(this);
        },
        index: function() {
          return this.latlngs.indexOf(this.right.latlng);
        }
      });
      L.Editable.mergeOptions({
        // 🍂namespace Editable
        // 🍂option middleMarkerClass: class = VertexMarker
        // Class to be used as middle vertex, pulled by the user to create a new point in the middle of a path.
        middleMarkerClass: L.Editable.MiddleMarker
      });
      L.Editable.BaseEditor = L.Handler.extend({
        initialize: function(map, feature, options) {
          L.setOptions(this, options);
          this.map = map;
          this.feature = feature;
          this.feature.editor = this;
          this.editLayer = new L.LayerGroup();
          this.tools = this.options.editTools || map.editTools;
        },
        // 🍂method enable(): this
        // Set up the drawing tools for the feature to be editable.
        addHooks: function() {
          if (this.isConnected()) this.onFeatureAdd();
          else this.feature.once("add", this.onFeatureAdd, this);
          this.onEnable();
          this.feature.on(this._getEvents(), this);
        },
        // 🍂method disable(): this
        // Remove the drawing tools for the feature.
        removeHooks: function() {
          this.feature.off(this._getEvents(), this);
          if (this.feature.dragging) this.feature.dragging.disable();
          this.editLayer.clearLayers();
          this.tools.editLayer.removeLayer(this.editLayer);
          this.onDisable();
          if (this._drawing) this.cancelDrawing();
        },
        // 🍂method drawing(): boolean
        // Return true if any drawing action is ongoing with this editor.
        drawing: function() {
          return !!this._drawing;
        },
        reset: () => {
        },
        onFeatureAdd: function() {
          this.tools.editLayer.addLayer(this.editLayer);
          if (this.feature.dragging) this.feature.dragging.enable();
        },
        hasMiddleMarkers: function() {
          return !this.options.skipMiddleMarkers && !this.tools.options.skipMiddleMarkers;
        },
        fireAndForward: function(type, e) {
          e = e || {};
          e.layer = this.feature;
          this.feature.fire(type, e);
          this.tools.fireAndForward(type, e);
        },
        onEnable: function() {
          this.fireAndForward("editable:enable");
        },
        onDisable: function() {
          this.fireAndForward("editable:disable");
        },
        onEditing: function() {
          this.fireAndForward("editable:editing");
        },
        onEdited: function() {
          this.fireAndForward("editable:edited");
        },
        onStartDrawing: function() {
          this.fireAndForward("editable:drawing:start");
        },
        onEndDrawing: function() {
          this.fireAndForward("editable:drawing:end");
        },
        onCancelDrawing: function() {
          this.fireAndForward("editable:drawing:cancel");
        },
        onCommitDrawing: function(e) {
          this.fireAndForward("editable:drawing:commit", e);
          this.onEdited();
        },
        onDrawingMouseDown: function(e) {
          this.fireAndForward("editable:drawing:mousedown", e);
        },
        onDrawingMouseUp: function(e) {
          this.fireAndForward("editable:drawing:mouseup", e);
        },
        startDrawing: function() {
          if (!this._drawing) this._drawing = L.Editable.FORWARD;
          this.tools.registerForDrawing(this);
          this.onStartDrawing();
        },
        commitDrawing: function(e) {
          this.onCommitDrawing(e);
          this.endDrawing();
        },
        cancelDrawing: function() {
          L.Draggable._dragging = false;
          this.onCancelDrawing();
          this.endDrawing();
        },
        endDrawing: function() {
          this._drawing = false;
          this.tools.unregisterForDrawing(this);
          this.onEndDrawing();
        },
        onDrawingClick: function(e) {
          if (!this.drawing()) return;
          L.Editable.makeCancellable(e);
          this.fireAndForward("editable:drawing:click", e);
          if (e._cancelled) return;
          if (!this.isConnected()) this.connect(e);
          this.processDrawingClick(e);
        },
        isConnected: function() {
          return this.map.hasLayer(this.feature);
        },
        connect: function() {
          this.tools.connectCreatedToMap(this.feature);
          this.tools.editLayer.addLayer(this.editLayer);
        },
        onMove: function(e) {
          this.fireAndForward("editable:drawing:move", e);
        },
        onDrawingMouseMove: function(e) {
          this.onMove(e);
        },
        _getEvents: function() {
          return {
            dragstart: this.onDragStart,
            drag: this.onDrag,
            dragend: this.onDragEnd,
            remove: this.disable
          };
        },
        onDragStart: function(e) {
          this.onEditing();
          this.fireAndForward("editable:dragstart", e);
        },
        onDrag: function(e) {
          this.onMove(e);
          this.fireAndForward("editable:drag", e);
        },
        onDragEnd: function(e) {
          this.fireAndForward("editable:dragend", e);
          this.onEdited();
        }
      });
      L.Editable.MarkerEditor = L.Editable.BaseEditor.extend({
        onDrawingMouseMove: function(e) {
          L.Editable.BaseEditor.prototype.onDrawingMouseMove.call(this, e);
          if (this._drawing) this.feature.setLatLng(e.latlng);
        },
        processDrawingClick: function(e) {
          this.fireAndForward("editable:drawing:clicked", e);
          this.commitDrawing(e);
        },
        connect: function(e) {
          if (e) this.feature._latlng = e.latlng;
          L.Editable.BaseEditor.prototype.connect.call(this, e);
        }
      });
      L.Editable.CircleMarkerEditor = L.Editable.BaseEditor.extend({
        onDrawingMouseMove: function(e) {
          L.Editable.BaseEditor.prototype.onDrawingMouseMove.call(this, e);
          if (this._drawing) this.feature.setLatLng(e.latlng);
        },
        processDrawingClick: function(e) {
          this.fireAndForward("editable:drawing:clicked", e);
          this.commitDrawing(e);
        },
        connect: function(e) {
          if (e) this.feature._latlng = e.latlng;
          L.Editable.BaseEditor.prototype.connect.call(this, e);
        }
      });
      L.Editable.PathEditor = L.Editable.BaseEditor.extend({
        CLOSED: false,
        MIN_VERTEX: 2,
        addHooks: function() {
          L.Editable.BaseEditor.prototype.addHooks.call(this);
          if (this.feature) {
            this.initVertexMarkers();
            this.map.on("moveend", this.onMoveEnd, this);
          }
          return this;
        },
        removeHooks: function() {
          L.Editable.BaseEditor.prototype.removeHooks.call(this);
          if (this.feature) {
            this.map.off("moveend", this.onMoveEnd, this);
          }
        },
        onMoveEnd: function() {
          this.initVertexMarkers();
        },
        initVertexMarkers: function(latlngs) {
          if (!this.enabled()) return;
          latlngs = latlngs || this.getLatLngs();
          if (isFlat(latlngs)) {
            this.addVertexMarkers(latlngs);
          } else {
            for (const member of latlngs) {
              this.initVertexMarkers(member);
            }
          }
        },
        getLatLngs: function() {
          return this.feature.getLatLngs();
        },
        // 🍂method reset()
        // Rebuild edit elements (Vertex, MiddleMarker, etc.).
        reset: function() {
          this.editLayer.clearLayers();
          this.initVertexMarkers();
        },
        addVertexMarker: function(latlng, latlngs) {
          if (latlng.__vertex) {
            latlng.__vertex.connect();
            return latlng.__vertex;
          }
          return new this.tools.options.vertexMarkerClass(latlng, latlngs, this);
        },
        onNewVertex: function(vertex) {
          this.fireAndForward("editable:vertex:new", {
            latlng: vertex.latlng,
            vertex
          });
        },
        addVertexMarkers: function(latlngs) {
          const bounds = this.map.getBounds();
          for (const latlng of latlngs) {
            if (!bounds.contains(latlng)) continue;
            this.addVertexMarker(latlng, latlngs);
          }
        },
        refreshVertexMarkers: function(latlngs) {
          latlngs = latlngs || this.getDefaultLatLngs();
          for (const latlng of latlngs) {
            latlng.__vertex.update();
          }
        },
        addMiddleMarker: function(left, right, latlngs) {
          return new this.tools.options.middleMarkerClass(left, right, latlngs, this);
        },
        onVertexMarkerClick: function(e) {
          L.Editable.makeCancellable(e);
          this.fireAndForward("editable:vertex:click", e);
          if (e._cancelled) return;
          if (this.tools.drawing() && this.tools._drawingEditor !== this) return;
          const index = e.vertex.getIndex();
          let commit;
          if (e.originalEvent.ctrlKey) {
            this.onVertexMarkerCtrlClick(e);
          } else if (e.originalEvent.altKey) {
            this.onVertexMarkerAltClick(e);
          } else if (e.originalEvent.shiftKey) {
            this.onVertexMarkerShiftClick(e);
          } else if (e.originalEvent.metaKey) {
            this.onVertexMarkerMetaKeyClick(e);
          } else if (index === e.vertex.getLastIndex() && this._drawing === L.Editable.FORWARD) {
            if (index >= this.MIN_VERTEX - 1) commit = true;
          } else if (index === 0 && this._drawing === L.Editable.BACKWARD && this._drawnLatLngs.length >= this.MIN_VERTEX) {
            commit = true;
          } else if (index === 0 && this._drawing === L.Editable.FORWARD && this._drawnLatLngs.length >= this.MIN_VERTEX && this.CLOSED) {
            commit = true;
          } else {
            this.onVertexRawMarkerClick(e);
          }
          this.fireAndForward("editable:vertex:clicked", e);
          if (commit) this.commitDrawing(e);
        },
        onVertexRawMarkerClick: function(e) {
          this.fireAndForward("editable:vertex:rawclick", e);
          if (e._cancelled) return;
          if (!this.vertexCanBeDeleted(e.vertex)) return;
          e.vertex.delete();
        },
        vertexCanBeDeleted: function(vertex) {
          return vertex.latlngs.length > this.MIN_VERTEX;
        },
        onVertexDeleted: function(e) {
          this.fireAndForward("editable:vertex:deleted", e);
          this.onEdited();
        },
        onVertexMarkerCtrlClick: function(e) {
          this.fireAndForward("editable:vertex:ctrlclick", e);
        },
        onVertexMarkerShiftClick: function(e) {
          this.fireAndForward("editable:vertex:shiftclick", e);
        },
        onVertexMarkerMetaKeyClick: function(e) {
          this.fireAndForward("editable:vertex:metakeyclick", e);
        },
        onVertexMarkerAltClick: function(e) {
          this.fireAndForward("editable:vertex:altclick", e);
        },
        onVertexMarkerContextMenu: function(e) {
          this.fireAndForward("editable:vertex:contextmenu", e);
        },
        onVertexMarkerMouseDown: function(e) {
          this.fireAndForward("editable:vertex:mousedown", e);
        },
        onVertexMarkerMouseOver: function(e) {
          this.fireAndForward("editable:vertex:mouseover", e);
        },
        onVertexMarkerMouseOut: function(e) {
          this.fireAndForward("editable:vertex:mouseout", e);
        },
        onMiddleMarkerMouseDown: function(e) {
          this.fireAndForward("editable:middlemarker:mousedown", e);
        },
        onVertexMarkerDrag: function(e) {
          this.onMove(e);
          if (this.feature._bounds) this.extendBounds(e);
          this.fireAndForward("editable:vertex:drag", e);
        },
        onVertexMarkerDragStart: function(e) {
          this.fireAndForward("editable:vertex:dragstart", e);
        },
        onVertexMarkerDragEnd: function(e) {
          this.fireAndForward("editable:vertex:dragend", e);
          this.onEdited();
        },
        setDrawnLatLngs: function(latlngs) {
          this._drawnLatLngs = latlngs || this.getDefaultLatLngs();
        },
        startDrawing: function() {
          if (!this._drawnLatLngs) this.setDrawnLatLngs();
          L.Editable.BaseEditor.prototype.startDrawing.call(this);
        },
        startDrawingForward: function() {
          this.startDrawing();
        },
        endDrawing: function() {
          this.tools.detachForwardLineGuide();
          this.tools.detachBackwardLineGuide();
          if (this._drawnLatLngs && this._drawnLatLngs.length < this.MIN_VERTEX) this.deleteShape(this._drawnLatLngs);
          L.Editable.BaseEditor.prototype.endDrawing.call(this);
          delete this._drawnLatLngs;
        },
        addLatLng: function(latlng) {
          if (this._drawing === L.Editable.FORWARD) this._drawnLatLngs.push(latlng);
          else this._drawnLatLngs.unshift(latlng);
          this.feature._bounds.extend(latlng);
          const vertex = this.addVertexMarker(latlng, this._drawnLatLngs);
          this.onNewVertex(vertex);
          this.refresh();
        },
        newPointForward: function(latlng) {
          this.addLatLng(latlng);
          this.tools.attachForwardLineGuide();
          this.tools.anchorForwardLineGuide(latlng);
        },
        newPointBackward: function(latlng) {
          this.addLatLng(latlng);
          this.tools.anchorBackwardLineGuide(latlng);
        },
        // 🍂namespace PathEditor
        // 🍂method push()
        // Programmatically add a point while drawing.
        push: function(latlng) {
          if (!latlng) return console.error("L.Editable.PathEditor.push expect a valid latlng as parameter");
          if (this._drawing === L.Editable.FORWARD) this.newPointForward(latlng);
          else this.newPointBackward(latlng);
        },
        removeLatLng: function(latlng) {
          latlng.__vertex.delete();
          this.refresh();
        },
        // 🍂method pop(): L.LatLng or null
        // Programmatically remove last point (if any) while drawing.
        pop: function() {
          if (this._drawnLatLngs.length <= 1) return;
          let latlng;
          if (this._drawing === L.Editable.FORWARD) {
            latlng = this._drawnLatLngs[this._drawnLatLngs.length - 1];
          } else {
            latlng = this._drawnLatLngs[0];
          }
          this.removeLatLng(latlng);
          if (this._drawing === L.Editable.FORWARD) {
            this.tools.anchorForwardLineGuide(this._drawnLatLngs[this._drawnLatLngs.length - 1]);
          } else {
            this.tools.anchorForwardLineGuide(this._drawnLatLngs[0]);
          }
          return latlng;
        },
        processDrawingClick: function(e) {
          if (e.vertex && e.vertex.editor === this) return;
          if (this._drawing === L.Editable.FORWARD) this.newPointForward(e.latlng);
          else this.newPointBackward(e.latlng);
          this.fireAndForward("editable:drawing:clicked", e);
        },
        onDrawingMouseMove: function(e) {
          L.Editable.BaseEditor.prototype.onDrawingMouseMove.call(this, e);
          if (this._drawing) {
            this.tools.moveForwardLineGuide(e.latlng);
            this.tools.moveBackwardLineGuide(e.latlng);
          }
        },
        refresh: function() {
          this.feature.redraw();
          this.onEditing();
        },
        // 🍂namespace PathEditor
        // 🍂method newShape(latlng?: L.LatLng)
        // Add a new shape (Polyline, Polygon) in a multi, and setup up drawing tools to draw it;
        // if optional `latlng` is given, start a path at this point.
        newShape: function(latlng) {
          const shape = this.addNewEmptyShape();
          if (!shape) return;
          this.setDrawnLatLngs(shape[0] || shape);
          this.startDrawingForward();
          this.fireAndForward("editable:shape:new", {
            shape
          });
          if (latlng) this.newPointForward(latlng);
        },
        deleteShape: function(shape, latlngs) {
          const e = {
            shape
          };
          L.Editable.makeCancellable(e);
          this.fireAndForward("editable:shape:delete", e);
          if (e._cancelled) return;
          shape = this._deleteShape(shape, latlngs);
          if (this.ensureNotFlat) this.ensureNotFlat();
          this.feature.setLatLngs(this.getLatLngs());
          this.refresh();
          this.reset();
          this.fireAndForward("editable:shape:deleted", {
            shape
          });
          this.onEdited();
          return shape;
        },
        _deleteShape: function(shape, latlngs) {
          latlngs = latlngs || this.getLatLngs();
          if (!latlngs.length) return;
          const inplaceDelete = (latlngs2, shape2) => {
            return latlngs2.splice(0, Number.MAX_VALUE);
          };
          const spliceDelete = (latlngs2, shape2) => {
            latlngs2.splice(latlngs2.indexOf(shape2), 1);
            if (!latlngs2.length) this._deleteShape(latlngs2);
            return shape2;
          };
          if (latlngs === shape) return inplaceDelete(latlngs, shape);
          for (const member of latlngs) {
            if (member === shape) return spliceDelete(latlngs, shape);
            if (member.indexOf(shape) !== -1) return spliceDelete(member, shape);
          }
        },
        // 🍂namespace PathEditor
        // 🍂method deleteShapeAt(latlng: L.LatLng): Array
        // Remove a path shape at the given `latlng`.
        deleteShapeAt: function(latlng) {
          const shape = this.feature.shapeAt(latlng);
          if (shape) return this.deleteShape(shape);
        },
        // 🍂method appendShape(shape: Array)
        // Append a new shape to the Polygon or Polyline.
        appendShape: function(shape) {
          this.insertShape(shape);
        },
        // 🍂method prependShape(shape: Array)
        // Prepend a new shape to the Polygon or Polyline.
        prependShape: function(shape) {
          this.insertShape(shape, 0);
        },
        // 🍂method insertShape(shape: Array, index: int)
        // Insert a new shape to the Polygon or Polyline at given index (default is to append).
        insertShape: function(shape, index) {
          this.ensureMulti();
          shape = this.formatShape(shape);
          if (index === void 0) index = this.feature._latlngs.length;
          this.feature._latlngs.splice(index, 0, shape);
          this.feature.redraw();
          if (this._enabled) this.reset();
        },
        extendBounds: function(e) {
          this.feature._bounds.extend(e.vertex.latlng);
        },
        onDragStart: function(e) {
          this.editLayer.clearLayers();
          L.Editable.BaseEditor.prototype.onDragStart.call(this, e);
        },
        onDragEnd: function(e) {
          this.initVertexMarkers();
          L.Editable.BaseEditor.prototype.onDragEnd.call(this, e);
        }
      });
      L.Editable.PolylineEditor = L.Editable.PathEditor.extend({
        startDrawingBackward: function() {
          this._drawing = L.Editable.BACKWARD;
          this.startDrawing();
        },
        // 🍂method continueBackward(latlngs?: Array)
        // Set up drawing tools to continue the line backward.
        continueBackward: function(latlngs) {
          if (this.drawing()) return;
          latlngs = latlngs || this.getDefaultLatLngs();
          this.setDrawnLatLngs(latlngs);
          if (latlngs.length > 0) {
            this.tools.attachBackwardLineGuide();
            this.tools.anchorBackwardLineGuide(latlngs[0]);
          }
          this.startDrawingBackward();
        },
        // 🍂method continueForward(latlngs?: Array)
        // Set up drawing tools to continue the line forward.
        continueForward: function(latlngs) {
          if (this.drawing()) return;
          latlngs = latlngs || this.getDefaultLatLngs();
          this.setDrawnLatLngs(latlngs);
          if (latlngs.length > 0) {
            this.tools.attachForwardLineGuide();
            this.tools.anchorForwardLineGuide(latlngs[latlngs.length - 1]);
          }
          this.startDrawingForward();
        },
        getDefaultLatLngs: function(latlngs) {
          latlngs = latlngs || this.feature._latlngs;
          if (!latlngs.length || latlngs[0] instanceof L.LatLng) return latlngs;
          return this.getDefaultLatLngs(latlngs[0]);
        },
        ensureMulti: function() {
          if (this.feature._latlngs.length && isFlat(this.feature._latlngs)) {
            this.feature._latlngs = [this.feature._latlngs];
          }
        },
        addNewEmptyShape: function() {
          if (this.feature._latlngs.length) {
            const shape = [];
            this.appendShape(shape);
            return shape;
          }
          return this.feature._latlngs;
        },
        formatShape: function(shape) {
          if (isFlat(shape)) return shape;
          if (shape[0]) return this.formatShape(shape[0]);
        },
        // 🍂method splitShape(latlngs?: Array, index: int)
        // Split the given `latlngs` shape at index `index` and integrate new shape in instance `latlngs`.
        splitShape: function(shape, index) {
          if (!index || index >= shape.length - 1) return;
          this.ensureMulti();
          const shapeIndex = this.feature._latlngs.indexOf(shape);
          if (shapeIndex === -1) return;
          const first = shape.slice(0, index + 1);
          const second = shape.slice(index);
          second[0] = L.latLng(second[0].lat, second[0].lng, second[0].alt);
          this.feature._latlngs.splice(shapeIndex, 1, first, second);
          this.refresh();
          this.reset();
          this.onEdited();
        }
      });
      L.Editable.PolygonEditor = L.Editable.PathEditor.extend({
        CLOSED: true,
        MIN_VERTEX: 3,
        newPointForward: function(latlng) {
          L.Editable.PathEditor.prototype.newPointForward.call(this, latlng);
          if (!this.tools.backwardLineGuide._latlngs.length) this.tools.anchorBackwardLineGuide(latlng);
          if (this._drawnLatLngs.length === 2) this.tools.attachBackwardLineGuide();
        },
        addNewEmptyHole: function(latlng) {
          this.ensureNotFlat();
          const latlngs = this.feature.shapeAt(latlng);
          if (!latlngs) return;
          const holes = [];
          latlngs.push(holes);
          return holes;
        },
        // 🍂method newHole(latlng?: L.LatLng, index: int)
        // Set up drawing tools for creating a new hole on the Polygon. If the `latlng` param is given, a first point is created.
        newHole: function(latlng) {
          const holes = this.addNewEmptyHole(latlng);
          if (!holes) return;
          this.setDrawnLatLngs(holes);
          this.startDrawingForward();
          if (latlng) this.newPointForward(latlng);
        },
        addNewEmptyShape: function() {
          if (this.feature._latlngs.length && this.feature._latlngs[0].length) {
            const shape = [];
            this.appendShape(shape);
            return shape;
          }
          return this.feature._latlngs;
        },
        ensureMulti: function() {
          if (this.feature._latlngs.length && isFlat(this.feature._latlngs[0])) {
            this.feature._latlngs = [this.feature._latlngs];
          }
        },
        ensureNotFlat: function() {
          if (!this.feature._latlngs.length || isFlat(this.feature._latlngs)) this.feature._latlngs = [this.feature._latlngs];
        },
        vertexCanBeDeleted: function(vertex) {
          const parent = this.feature.parentShape(vertex.latlngs);
          const idx = L.Util.indexOf(parent, vertex.latlngs);
          if (idx > 0) return true;
          return L.Editable.PathEditor.prototype.vertexCanBeDeleted.call(this, vertex);
        },
        getDefaultLatLngs: function() {
          if (!this.feature._latlngs.length) this.feature._latlngs.push([]);
          return this.feature._latlngs[0];
        },
        formatShape: (shape) => {
          if (isFlat(shape) && (!shape[0] || shape[0].length !== 0)) return [shape];
          return shape;
        }
      });
      L.Editable.RectangleEditor = L.Editable.PathEditor.extend({
        CLOSED: true,
        MIN_VERTEX: 4,
        options: {
          skipMiddleMarkers: true
        },
        extendBounds: function(e) {
          const index = e.vertex.getIndex();
          const next = e.vertex.getNext();
          const previous = e.vertex.getPrevious();
          const oppositeIndex = (index + 2) % 4;
          const opposite = e.vertex.latlngs[oppositeIndex];
          const bounds = new L.LatLngBounds(e.latlng, opposite);
          previous.latlng.update([e.latlng.lat, opposite.lng]);
          next.latlng.update([opposite.lat, e.latlng.lng]);
          this.updateBounds(bounds);
          this.refreshVertexMarkers();
        },
        onDrawingMouseDown: function(e) {
          L.Editable.PathEditor.prototype.onDrawingMouseDown.call(this, e);
          this.connect();
          const latlngs = this.getDefaultLatLngs();
          if (latlngs.length === 3) latlngs.push(e.latlng);
          const bounds = new L.LatLngBounds(e.latlng, e.latlng);
          this.updateBounds(bounds);
          this.updateLatLngs(bounds);
          this.refresh();
          this.reset();
          e.originalEvent._simulated = false;
          this.map.dragging._draggable._onUp(e.originalEvent);
          latlngs[3].__vertex.dragging._draggable._onDown(e.originalEvent);
        },
        onDrawingMouseUp: function(e) {
          this.commitDrawing(e);
          e.originalEvent._simulated = false;
          L.Editable.PathEditor.prototype.onDrawingMouseUp.call(this, e);
        },
        onDrawingMouseMove: function(e) {
          e.originalEvent._simulated = false;
          L.Editable.PathEditor.prototype.onDrawingMouseMove.call(this, e);
        },
        getDefaultLatLngs: function(latlngs) {
          return latlngs || this.feature._latlngs[0];
        },
        updateBounds: function(bounds) {
          this.feature._bounds = bounds;
        },
        updateLatLngs: function(bounds) {
          const latlngs = this.getDefaultLatLngs();
          const newLatlngs = this.feature._boundsToLatLngs(bounds);
          for (let i = 0; i < latlngs.length; i++) {
            latlngs[i].update(newLatlngs[i]);
          }
        }
      });
      L.Editable.CircleEditor = L.Editable.PathEditor.extend({
        MIN_VERTEX: 2,
        options: {
          skipMiddleMarkers: true
        },
        initialize: function(map, feature, options) {
          L.Editable.PathEditor.prototype.initialize.call(this, map, feature, options);
          this._resizeLatLng = this.computeResizeLatLng();
        },
        computeResizeLatLng: function() {
          const delta = (this.feature._radius || this.feature._mRadius) * Math.cos(Math.PI / 4);
          const point = this.map.project(this.feature._latlng);
          return this.map.unproject([point.x + delta, point.y - delta]);
        },
        updateResizeLatLng: function() {
          this._resizeLatLng.update(this.computeResizeLatLng());
          this._resizeLatLng.__vertex.update();
        },
        getLatLngs: function() {
          return [this.feature._latlng, this._resizeLatLng];
        },
        getDefaultLatLngs: function() {
          return this.getLatLngs();
        },
        onVertexMarkerDrag: function(e) {
          if (e.vertex.getIndex() === 1) this.resize(e);
          else this.updateResizeLatLng(e);
          L.Editable.PathEditor.prototype.onVertexMarkerDrag.call(this, e);
        },
        resize: function(e) {
          let radius;
          if (this.map.options.crs) {
            radius = this.map.options.crs.distance(this.feature._latlng, e.latlng);
          } else {
            radius = this.feature._latlng.distanceTo(e.latlng);
          }
          this.feature.setRadius(radius);
        },
        onDrawingMouseDown: function(e) {
          L.Editable.PathEditor.prototype.onDrawingMouseDown.call(this, e);
          this._resizeLatLng.update(e.latlng);
          this.feature._latlng.update(e.latlng);
          this.connect();
          e.originalEvent._simulated = false;
          this.map.dragging._draggable._onUp(e.originalEvent);
          this._resizeLatLng.__vertex.dragging._draggable._onDown(e.originalEvent);
        },
        onDrawingMouseUp: function(e) {
          this.commitDrawing(e);
          e.originalEvent._simulated = false;
          L.Editable.PathEditor.prototype.onDrawingMouseUp.call(this, e);
        },
        onDrawingMouseMove: function(e) {
          e.originalEvent._simulated = false;
          L.Editable.PathEditor.prototype.onDrawingMouseMove.call(this, e);
        },
        onDrag: function(e) {
          L.Editable.PathEditor.prototype.onDrag.call(this, e);
          this.feature.dragging.updateLatLng(this._resizeLatLng);
        }
      });
      const EditableMixin = {
        createEditor: function(map) {
          map = map || this._map;
          const tools = this.options.editOptions?.editTools || map.editTools;
          if (!tools) throw Error("Unable to detect Editable instance.");
          const Klass = this.options.editorClass || this.getEditorClass(tools);
          return new Klass(map, this, this.options.editOptions);
        },
        // 🍂method enableEdit(map?: L.Map): this.editor
        // Enable editing, by creating an editor if not existing, and then calling `enable` on it.
        enableEdit: function(map) {
          if (!this.editor) this.createEditor(map);
          this.editor.enable();
          return this.editor;
        },
        // 🍂method editEnabled(): boolean
        // Return true if current instance has an editor attached, and this editor is enabled.
        editEnabled: function() {
          return this.editor?.enabled();
        },
        // 🍂method disableEdit()
        // Disable editing, also remove the editor property reference.
        disableEdit: function() {
          if (this.editor) {
            this.editor.disable();
            delete this.editor;
          }
        },
        // 🍂method toggleEdit()
        // Enable or disable editing, according to current status.
        toggleEdit: function() {
          if (this.editEnabled()) this.disableEdit();
          else this.enableEdit();
        },
        _onEditableAdd: function() {
          if (this.editor) this.enableEdit();
        }
      };
      const PolylineMixin = {
        getEditorClass: (tools) => {
          return tools?.options?.polylineEditorClass || L.Editable.PolylineEditor;
        },
        shapeAt: function(latlng, latlngs) {
          let shape = null;
          latlngs = latlngs || this._latlngs;
          if (!latlngs.length) return shape;
          if (isFlat(latlngs) && this.isInLatLngs(latlng, latlngs)) shape = latlngs;
          else {
            for (const member of latlngs) {
              if (this.isInLatLngs(latlng, member)) return member;
            }
          }
          return shape;
        },
        isInLatLngs: function(l, latlngs) {
          if (!latlngs) return false;
          let i;
          let k;
          let len;
          let part = [];
          let p;
          const w = this._clickTolerance();
          this._projectLatlngs(latlngs, part, this._pxBounds);
          part = part[0];
          p = this._map.latLngToLayerPoint(l);
          if (!this._pxBounds.contains(p)) {
            return false;
          }
          for (i = 1, len = part.length, k = 0; i < len; k = i++) {
            if (L.LineUtil.pointToSegmentDistance(p, part[k], part[i]) <= w) {
              return true;
            }
          }
          return false;
        }
      };
      const PolygonMixin = {
        getEditorClass: (tools) => {
          return tools?.options?.polygonEditorClass || L.Editable.PolygonEditor;
        },
        shapeAt: function(latlng, latlngs) {
          let shape = null;
          latlngs = latlngs || this._latlngs;
          if (!latlngs.length) return shape;
          if (isFlat(latlngs) && this.isInLatLngs(latlng, latlngs)) shape = latlngs;
          if (isFlat(latlngs[0]) && this.isInLatLngs(latlng, latlngs[0])) {
            shape = latlngs;
          } else {
            for (const member of latlngs) {
              if (this.isInLatLngs(latlng, member[0])) return member;
            }
          }
          return shape;
        },
        isInLatLngs: (l, latlngs) => {
          let inside = false;
          let l1;
          let l2;
          let j;
          let k;
          let len2;
          for (j = 0, len2 = latlngs.length, k = len2 - 1; j < len2; k = j++) {
            l1 = latlngs[j];
            l2 = latlngs[k];
            if (l1.lat > l.lat !== l2.lat > l.lat && l.lng < (l2.lng - l1.lng) * (l.lat - l1.lat) / (l2.lat - l1.lat) + l1.lng) {
              inside = !inside;
            }
          }
          return inside;
        },
        parentShape: function(shape, latlngs) {
          latlngs = latlngs || this._latlngs;
          if (!latlngs) return;
          let idx = L.Util.indexOf(latlngs, shape);
          if (idx !== -1) return latlngs;
          for (const member of latlngs) {
            idx = L.Util.indexOf(member, shape);
            if (idx !== -1) return member;
          }
        }
      };
      const MarkerMixin = {
        getEditorClass: (tools) => {
          return tools?.options?.markerEditorClass || L.Editable.MarkerEditor;
        }
      };
      const CircleMarkerMixin = {
        getEditorClass: (tools) => {
          return tools?.options?.circleMarkerEditorClass || L.Editable.CircleMarkerEditor;
        }
      };
      const RectangleMixin = {
        getEditorClass: (tools) => {
          return tools?.options?.rectangleEditorClass || L.Editable.RectangleEditor;
        }
      };
      const CircleMixin = {
        getEditorClass: (tools) => {
          return tools?.options?.circleEditorClass || L.Editable.CircleEditor;
        }
      };
      const keepEditable = function() {
        this.on("add", this._onEditableAdd);
      };
      const isFlat = L.LineUtil.isFlat || L.LineUtil._flat || L.Polyline._flat;
      if (L.Polyline) {
        L.Polyline.include(EditableMixin);
        L.Polyline.include(PolylineMixin);
        L.Polyline.addInitHook(keepEditable);
      }
      if (L.Polygon) {
        L.Polygon.include(EditableMixin);
        L.Polygon.include(PolygonMixin);
      }
      if (L.Marker) {
        L.Marker.include(EditableMixin);
        L.Marker.include(MarkerMixin);
        L.Marker.addInitHook(keepEditable);
      }
      if (L.CircleMarker) {
        L.CircleMarker.include(EditableMixin);
        L.CircleMarker.include(CircleMarkerMixin);
        L.CircleMarker.addInitHook(keepEditable);
      }
      if (L.Rectangle) {
        L.Rectangle.include(EditableMixin);
        L.Rectangle.include(RectangleMixin);
      }
      if (L.Circle) {
        L.Circle.include(EditableMixin);
        L.Circle.include(CircleMixin);
      }
      L.LatLng.prototype.update = function(latlng) {
        latlng = L.latLng(latlng);
        this.lat = latlng.lat;
        this.lng = latlng.lng;
      };
    }, window);
  }
});
export default require_Leaflet_Editable();
//# sourceMappingURL=leaflet-editable.js.map
