var jsonResponse;
proj4.defs("EPSG:21781", "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:2056", "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs");

function fetchAndRenderChart(id) {
    // Make the API request for the specific ID
    fetch(
      "https://geoservice2.ist.supsi.ch/indg/frost/v1.1/Things(" + id + ")/Datastreams?$expand=ObservedProperty,Observations($orderby=phenomenonTime%20desc;$top=200)"
    )
      .then((response) => response.json())
      .then((data) => {
        // Extract Datastream and Observations
        var datastream = data.value[0];
        var observations = data.value[0].Observations;
        // Extract ObservedProperty name
        var variableName = datastream.ObservedProperty.name;
        // Extract observation measurement unit
        var variableUnit = datastream.unitOfMeasurement.symbol;
        // Extract "result" and "phenomenonTime" from each observation
        var xAxisData = observations.map(
          (observation) => observation.phenomenonTime
        );
        var yAxisData = observations.map((observation) => observation.result);
  
        var option = {
          title: {
            text: 'Sensor observations' 
          },
          toolbox: {
            show: true,
            feature: {
              dataZoom: {
                yAxisIndex: 'none'
              },
              dataView: { readOnly: false },
              magicType: { type: ['line', 'bar'] },
              restore: {},
              saveAsImage: {}
            }
          },      
          xAxis: {
            type: "category",
            data: xAxisData,
          },
          yAxis: {
            type: "value",
            name: variableName + " (" + variableUnit + ")",
          },
          series: [
            {
              data: yAxisData,
              type: "line",
            },
          ],
        };
  
        // Render chart inside the corresponding chart container
        var dom = document.getElementById("chart-container-" + id);
        var myChart = echarts.init(dom, null, {
          renderer: "canvas",
          useDirtyRect: false,
        });
  
        if (option && typeof option === "object") {
          myChart.setOption(option);
        }
      })
      .catch((error) => console.error("Error loading data for ID:", id, error));
  }
  

$.get(
  "https://geoservice2.ist.supsi.ch/indg/frost/v1.1/Things?$expand=Locations($select=location)",
  function(response, status) {
    jsonResponse = response;

    // Loop through each item in the response
    jsonResponse.value.forEach(function(item) {
      // Check if Locations array is not empty and location.coordinates is not null
      if (item.Locations.length > 0 && item.Locations[0].location.coordinates !== null) {
        // Extract necessary information for each item
        console.log(item["@iot.id"]);
        var id = item["@iot.id"];
        var titleText = item.name;
        var position = proj4("EPSG:21781", "EPSG:2056", item.Locations[0].location.coordinates);
        console.log(item.Locations[0].location.coordinates);
        var cameraPosition = [
          /* not mandatory */
        ];
        var cameraTarget = [
          /* not mandatory */
        ];
        var descriptionText = "<div id='chart-container-" + id + "' class='chart-container'></div><b>Descrizione:</b> " + item.description + '<br><b>ID:</b> ' + id + '<br><b>Coordinates:</b> ' + position;        console.log(descriptionText);
        createAnnotation(
          id,
          potreeViewer.scene,
          titleText,
          position,
          cameraPosition,
          cameraTarget,
          descriptionText
        );

        // Fetch and render chart for each annotation
        fetchAndRenderChart(id);
      }
    });
  }
);

