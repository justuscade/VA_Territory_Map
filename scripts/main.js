const urlGoogleSheetsTerritoriesData =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmf6o6Xynlqv4UVrj_WMWn_oSXgRGnPDGvzCObrUwFoncct3iMHBnvHGwYKWSirMByMY4ExI_KSNan/pub?output=csv";

function getTerritoriesData() {
  Papa.parse(urlGoogleSheetsTerritoriesData, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      mapTerritoryData = results.data;

      let sheetColumns = Object.keys(mapTerritoryData[0]);

      territories.features.map((geoJsonItem) => {
        let stateId = geoJsonItem.properties.id;
        let filteredCsvData = mapTerritoryData.filter(function (e) {
          return parseInt(e.terr_id) === stateId;
        });

        sheetColumns.forEach((col, i) => {
          geoJsonItem.properties[col] = filteredCsvData[0][col];
        });
      });
    },
  });
}

getTerritoriesData();

function initMap() {
  const center = { lat: 38.366, lng: -77.7329 };

  let map = new google.maps.Map(document.getElementById("map"), {
    center: center,
    zoom: 8.5,
    mapTypeControl: true,
    styles: [
      {
        featureType: "poi.business",
        stylers: [
          {
            visibility: "off",
          },
        ],
      },
    ],
  });



  let layer1 = new google.maps.Data({ map: map });
  layer1.addGeoJson(territories);
  layer1.setStyle(function (feature) {
    let colorId = feature.getProperty('color');
    let color = "#FFFFFF";

    if (colorId === 1) {
      color = "#c3ecb2";
    }
    else if (colorId == 2) {
      color = "#aadaff";
    }
    else if (colorId == 3) {
      color = "#f58c9b";
    }
    else if (colorId == 4) {
      color = "#f6cf65";
    }
    else if (colorId == 5) {
      color = "#d79ce6";
    }
    else {
      color = "#FFFFFF";
    }

    return {
      strokeColor: "#000000",
      strokeOpacity: 1,
      strokeWeight: 0.5,
      fillColor: color,
      fillOpacity: 0.4,
    };
  });

  layer1.addListener("mouseover", (event) => {
    layer1.revertStyle();
    layer1.overrideStyle(event.feature, {
      strokeColor: "#000000",
      strokeOpacity: 1,
      strokeWeight: 2,
    });
  });
  layer1.addListener("mouseout", (event) => {
    layer1.revertStyle();
  });

  let infoAreas = new google.maps.InfoWindow();

  layer1.addListener("click", function (event) {
    let feat = event.feature;
    let html =
      "<div id = 'zip-info'>" +
      '<p class="territory-number">Territory ' +
      feat.getProperty("id") +
      "</p>" +
      "<p>Name: " +
      feat.getProperty("rep_name") +
      "</p>" +
      "<p>Email: " +
      feat.getProperty("rep_email") +
      "</p>" +
      "</div>";

    infoAreas.setContent(html);
    infoAreas.setPosition(event.latLng);
    infoAreas.setOptions({ pixelOffset: new google.maps.Size(0, 0) });
    infoAreas.open(map);
  });

  infoWindow = new google.maps.InfoWindow();
  const locationButton = document.createElement("button");

  locationButton.textContent = "Location";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(locationButton);
  locationButton.addEventListener("click", () => {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          infoWindow.setPosition(pos);
          infoWindow.setContent("Location found.");
          infoWindow.open(map);
          map.setCenter(pos);
        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }
  });

  function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
      browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation."
    );
    infoWindow.open(map);
  }
}

