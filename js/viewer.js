import * as THREE from "../libs/three.js/build/three.module.js";

window.cesiumViewer = new Cesium.Viewer("cesiumContainer", {
  useDefaultRenderLoop: false,
  animation: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  sceneModePicker: false,
  selectionIndicator: false,
  timeline: false,
  navigationHelpButton: false,
  imageryProvider: Cesium.createOpenStreetMapImageryProvider({
    url: "https://a.tile.openstreetmap.org/",
  }),
});

cesiumViewer.terrainProvider = new Cesium.CesiumTerrainProvider({
  url: "https://api.maptiler.com/tiles/terrain-quantized-mesh/?key=2hTOFLPdXApzq9gVeMKq", // get your own key at https://cloud.maptiler.com/
});

let cp = new Cesium.Cartesian3(
  4303414.154026048,
  552161.235598733,
  4660771.704035539
);
cesiumViewer.camera.setView({
  destination: cp,
  orientation: {
    heading: 10,
    pitch: -Cesium.Math.PI_OVER_TWO * 0.5,
    roll: 0.0,
  },
});

window.potreeViewer = new Potree.Viewer(
  document.getElementById("potree_render_area"),
  {
    useDefaultRenderLoop: false,
  }
);
potreeViewer.setEDLEnabled(true);
potreeViewer.setFOV(60);
potreeViewer.setPointBudget(3_000_000);
potreeViewer.setMinNodeSize(50);
potreeViewer.loadSettingsFromURL();
potreeViewer.setBackground(null);
potreeViewer.useHQ = true;

potreeViewer.setDescription(`
		Potree using <a href="https://cesiumjs.org/" target="_blank">Cesium</a> to display an 
		<a href="https://www.openstreetmap.org" target="_blank">OpenStreetMap</a> map below.<br>`);

potreeViewer.loadGUI(() => {
  potreeViewer.setLanguage("en");
  $("#menu_appearance").next().show();
  $("#menu_tools").next().show();
  $("#menu_scene").next().show();
  potreeViewer.toggleSidebar();
});

Potree.loadPointCloud(
  "./pointclouds/test2/metadata.json",
  "Retz",
  function (e) {
    let scene = potreeViewer.scene;

    scene.addPointCloud(e.pointcloud);
    let material = e.pointcloud.material;
    material.activeAttributeName = "classification";
    material.intensityRange = [1, 100];
    material.gradient = Potree.Gradients.RAINBOW;
    material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
    material.size = 0.7;
    material.elevationRange = [0, 70];
    material.weightRGB = 1.0;
    material.weightElevation = 1.0;
    potreeViewer.setFrontView();
    let pointcloudProjection =
      "+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs +type=crs";
    let mapProjection = proj4.defs("WGS84");

    window.toMap = proj4(pointcloudProjection, mapProjection);
    window.toScene = proj4(mapProjection, pointcloudProjection);

    {
      let bb = potreeViewer.getBoundingBox();

      let minWGS84 = proj4(
        pointcloudProjection,
        mapProjection,
        bb.min.toArray()
      );
      let maxWGS84 = proj4(
        pointcloudProjection,
        mapProjection,
        bb.max.toArray()
      );
    }
  }
);

function loop(timestamp) {
  requestAnimationFrame(loop);

  potreeViewer.update(potreeViewer.clock.getDelta(), timestamp);

  potreeViewer.render();

  if (window.toMap !== undefined) {
    {
      let camera = potreeViewer.scene.getActiveCamera();

      let pPos = new THREE.Vector3(0, 0, 0).applyMatrix4(camera.matrixWorld);
      let pRight = new THREE.Vector3(600, 0, 0).applyMatrix4(
        camera.matrixWorld
      );
      let pUp = new THREE.Vector3(0, 600, 0).applyMatrix4(camera.matrixWorld);
      let pTarget = potreeViewer.scene.view.getPivot();

      let toCes = (pos) => {
        let xy = [pos.x, pos.y];
        let height = pos.z;
        let deg = toMap.forward(xy);
        let cPos = Cesium.Cartesian3.fromDegrees(...deg, height);

        return cPos;
      };

      let cPos = toCes(pPos);
      let cUpTarget = toCes(pUp);
      let cTarget = toCes(pTarget);

      let cDir = Cesium.Cartesian3.subtract(
        cTarget,
        cPos,
        new Cesium.Cartesian3()
      );
      let cUp = Cesium.Cartesian3.subtract(
        cUpTarget,
        cPos,
        new Cesium.Cartesian3()
      );

      cDir = Cesium.Cartesian3.normalize(cDir, new Cesium.Cartesian3());
      cUp = Cesium.Cartesian3.normalize(cUp, new Cesium.Cartesian3());

      cesiumViewer.camera.setView({
        destination: cPos,
        orientation: {
          direction: cDir,
          up: cUp,
        },
      });
    }

    let aspect = potreeViewer.scene.getActiveCamera().aspect;
    if (aspect < 1) {
      let fovy = Math.PI * (potreeViewer.scene.getActiveCamera().fov / 180);
      cesiumViewer.camera.frustum.fov = fovy;
    } else {
      let fovy = Math.PI * (potreeViewer.scene.getActiveCamera().fov / 180);
      let fovx = Math.atan(Math.tan(0.5 * fovy) * aspect) * 2;
      cesiumViewer.camera.frustum.fov = fovx;
    }
  }

  cesiumViewer.render();
}

requestAnimationFrame(loop);
