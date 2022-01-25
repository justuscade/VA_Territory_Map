const urlGoogleSheetsTerritoriesData =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmf6o6Xynlqv4UVrj_WMWn_oSXgRGnPDGvzCObrUwFoncct3iMHBnvHGwYKWSirMByMY4ExI_KSNan/pub?output=csv";

const keyAPI = "AIzaSyAXaZ0bkkxO42cfv9RAE71ztdkEWptTg6s";

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
    disableDoubleClickZoom: true,
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

  // TERRITORIES LAYER
  let layerTerritories = new google.maps.Data({ map: map });
  layerTerritories.addGeoJson(territories);
  layerTerritories.setStyle(function (feature) {
    let colorId = feature.getProperty("color");
    let color = "#FFFFFF";

    if (colorId === 1) {
      color = "#c3ecb2";
    } else if (colorId == 2) {
      color = "#aadaff";
    } else if (colorId == 3) {
      color = "#f58c9b";
    } else if (colorId == 4) {
      color = "#f6cf65";
    } else if (colorId == 5) {
      color = "#d79ce6";
    } else {
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

  let infoAreas = new google.maps.InfoWindow();

  function infoWindowContent(event) {
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
  }

  infoWindow = new google.maps.InfoWindow();

  // MAP CLICK EVENTS HANDLING
  map.addListener("dblclick", function (e) {
    reverseGeocode(e);
  });

  let update_timeout = null;

  layerTerritories.addListener("click", function (e) {
    update_timeout = setTimeout(function () {
      infoWindowContent(e);
    }, 200);
  });

  layerTerritories.addListener("dblclick", function (e) {
    clearTimeout(update_timeout);
    reverseGeocode(e);
  });

  // GEOLOCATION
  // const locationButton = document.createElement("button");
  // locationButton.textContent = "Location";
  // locationButton.classList.add("custom-map-control-button");
  // map.controls[google.maps.ControlPosition.TOP_LEFT].push(locationButton);
  let locationButton = document.getElementById("location-button");

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

  // REVERSE GEOCODING
  function reverseGeocode(mapsMouseEvent) {
    let latitudeClickedPoint = mapsMouseEvent.latLng.toJSON().lat;
    let longitudeClickedPoint = mapsMouseEvent.latLng.toJSON().lng;

    let latlngClickedPoint = {
      lat: parseFloat(latitudeClickedPoint),
      lng: parseFloat(longitudeClickedPoint),
    };

    let latlngQueryString = latitudeClickedPoint + "," + longitudeClickedPoint;

    axios
      .get("https://maps.googleapis.com/maps/api/geocode/json", {
        params: {
          latlng: latlngQueryString,
          key: keyAPI,
        },
      })
      .then(function (response) {
        let obtainedAddress = response.data.results[0].formatted_address;

        let markerClickedPoint = new google.maps.Marker({
          position: latlngClickedPoint,
          map: map,
        });

        let infoWindow = new google.maps.InfoWindow({
          position: mapsMouseEvent.latLng,
        });

        let infoWindowContent =
          '<p class="address-result">' +
          obtainedAddress +
          "</p>" +
          "Latitude: " +
          latitudeClickedPoint.toPrecision(8) +
          "<br>" +
          "Longitude: " +
          longitudeClickedPoint.toPrecision(8);

        infoWindow.setContent(infoWindowContent);
        infoWindow.open(map, markerClickedPoint);
      })
      .catch(function (error) {
        console.log(error);
        let markerClickedPoint = new google.maps.Marker({
          position: latlngClickedPoint,
          map: map,
        });

        let infoWindow = new google.maps.InfoWindow({
          position: mapsMouseEvent.latLng,
        });

        infoWindow.setContent("Error obtaining address");
        infoWindow.open(map, markerClickedPoint);
      });
  }

  // GEOCODING
  let locationForm = document.getElementById("location-form");
  locationForm.addEventListener("submit", geocode);

  function geocode(e) {
    e.preventDefault();

    let location = document.getElementById("location-input").value;

    axios
      .get("https://maps.googleapis.com/maps/api/geocode/json", {
        params: {
          address: location,
          key: keyAPI,
        },
      })
      .then(function (response) {
        // Formatted Address
        let formattedAddress = response.data.results[0].formatted_address;
        let formattedAddressOutput = `
            <ul class="list-group">
              <li class="list-group-item">${formattedAddress}</li>
            </ul>
          `;

        // Address Components
        let addressComponents = response.data.results[0].address_components;
        let addressComponentsOutput = '<ul class="list-group">';
        for (let i = 0; i < addressComponents.length; i++) {
          addressComponentsOutput += `
              <li class="list-group-item"><strong>${addressComponents[i].types[0]}</strong>: ${addressComponents[i].long_name}</li>
            `;
        }
        addressComponentsOutput += "</ul>";

        // Geometry
        let latitude = response.data.results[0].geometry.location.lat;
        let longitude = response.data.results[0].geometry.location.lng;
        let foundAddressLatLng = { lat: latitude, lng: longitude };

        map.setCenter(foundAddressLatLng);

        let markerFoundPoint = new google.maps.Marker({
          position: foundAddressLatLng,
          map,
        });

        let infoWindow = new google.maps.InfoWindow({
          position: foundAddressLatLng,
        });

        let infoWindowContent =
          '<p class="address-result">' +
          formattedAddress +
          "</p>" +
          "Latitude: " +
          latitude.toPrecision(8) +
          "<br>" +
          "Longitude: " +
          longitude.toPrecision(8);

        infoWindow.setContent(infoWindowContent);
        infoWindow.open(map, markerFoundPoint);

        let geometryOutput = `
            <ul class="list-group">
              <li class="list-group-item"><strong>Latitude</strong>: ${latitude}</li>
              <li class="list-group-item"><strong>Longitude</strong>: ${longitude}</li>
            </ul>
          `;

        // Output to app
        document.getElementById("formatted-address").innerHTML =
          formattedAddressOutput;
        document.getElementById("address-components").innerHTML =
          addressComponentsOutput;
        document.getElementById("geometry").innerHTML = geometryOutput;
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}
