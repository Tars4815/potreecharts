var jsonResponse;
proj4.defs(
  "EPSG:21781",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"
);
proj4.defs(
  "EPSG:2056",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"
);

$.get(
  "https://geoservice2.ist.supsi.ch/indg/frost/v1.1/Things?$expand=Locations($select=location)",
  function (response, status) {
    jsonResponse = response;

    // Loop through each item in the response
    jsonResponse.value.forEach(function (item) {
      // Check if Locations array is not empty and location.coordinates is not null
      if (
        item.Locations.length > 0 &&
        item.Locations[0].location.coordinates !== null
      ) {
        // Extract necessary information for each item
        var id = item["@iot.id"];
        var titleText = item.name;
        var position = proj4(
          "EPSG:21781",
          "EPSG:2056",
          item.Locations[0].location.coordinates
        );
        var cameraPosition = [];
        var cameraTarget = [];
        var descriptionText =
          "<b>Descrizione:</b> " +
          item.description +
          "<br><b>ID:</b> " +
          id +
          "<br><b>Coordinates:</b> " +
          position;

        // Add div for chart container with inline styles
        descriptionText +=
          "<br><button class='annotationGraph' data-id='" +
          id +
          "'>Graph</button>";

        // Append annotation with description text
        createAnnotation(
          id,
          potreeViewer.scene,
          titleText,
          position,
          cameraPosition,
          cameraTarget,
          descriptionText
        );
      }
    });

    // Variable to keep track of the currently displayed chart container ID
    var currentChartContainerId = null;

    // Add click event listener to dynamically created buttons
    $(document).on("click", ".annotationGraph", function () {
      var id = $(this).data("id");

      // Hide all existing chart panels
      $(".chart-panel").hide();

      // Remove the currently displayed chart container if it exists
      if (currentChartContainerId) {
        $("#panel-" + currentChartContainerId).remove();
      }
      var element = document.getElementById('panels-container');
      element.style.visibility = 'visible';
      var urlDatastream =
        "https://geoservice2.ist.supsi.ch/indg/frost/v1.1/Things(" +
        id +
        ")/Datastreams?$expand=ObservedProperty,Observations($orderby=phenomenonTime%20desc;$top=100)";
      // Make API request to fetch latest observation data
      fetch(urlDatastream)
        .then((response) => response.json())
        .then((data) => {
          var observations = data.value[0].Observations;
          var variableName = data.value[0].ObservedProperty.name;
          var variableUnit = data.value[0].unitOfMeasurement.symbol;

          // Create or update panel and chart container
          var panelId = "panel-" + id;
          var chartContainerId = "chart-container-" + id;
          if ($("#" + panelId).length === 0) {
            var panelHtml =
              '<div id="' +
              panelId +
              '" class="chart-panel">' +
              '<div class="panel-heading">' +
              '<h3 class="panel-title">' +
              variableName +
              " (" +
              variableUnit +
              ")</h3>" +
              '<button class="close-panel" style="float:right; display:none;">Close</button>' +
              "</div>" +
              '<div id="' +
              chartContainerId +
              '" class="chart-container"></div>' +
              "</div>";
            $("#panels-container").append(panelHtml);
          }

          // Process data and create chart
          // Extract "result" and "phenomenonTime" from each observation
          var xAxisData = observations.map(
            (observation) => observation.phenomenonTime
          );
          var yAxisData = observations.map((observation) => observation.result);

          var option = {
            title: {
              text: "Sensor observations",
            },
            toolbox: {
              show: true,
              feature: {
                dataZoom: {
                  yAxisIndex: "none",
                },
                dataView: { readOnly: false },
                magicType: { type: ["line", "bar"] },
                restore: {},
                saveAsImage: {},
              },
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

          // Initialize chart
          var myChart = echarts.init(
            document.getElementById(chartContainerId),
            null,
            { renderer: "canvas", useDirtyRect: false }
          );

          // Check if option is defined and apply it to the chart
          if (option && typeof option === "object") {
            myChart.setOption(option);
          }

          // Update the currently displayed chart container ID
          currentChartContainerId = id;

          // Show the close button for the current panel
          $("#" + panelId + " .close-panel").show();
        })
        .catch((error) => console.error("Error loading data:", error));
    });

    // Add click event listener to close buttons
    $(document).on("click", ".close-panel", function () {
      var panelId = $(this).closest(".chart-panel").attr("id");
      $("#" + panelId).remove();
      currentChartContainerId = null; // Reset the currently displayed chart container ID
    });
  }
);
