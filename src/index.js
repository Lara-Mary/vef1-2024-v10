/**
 * Gefið efni fyrir verkefni 9, ekki er krafa að nota nákvæmlega þetta en nota
 * verður gefnar staðsetningar.
 */

import { el, empty } from "./lib/elements.js";
import { weatherSearch } from "./lib/weather.js";

/**
 * @typedef {Object} SearchLocation
 * @property {string} title
 * @property {number} lat
 * @property {number} lng
 */

/**
 * Allar staðsetning sem hægt er að fá veður fyrir.
 * @type Array<SearchLocation>
 */
const locations = [
  {
    title: "Reykjavík",
    lat: 64.1355,
    lng: -21.8954,
  },
  {
    title: "Akureyri",
    lat: 65.6835,
    lng: -18.0878,
  },
  {
    title: "New York",
    lat: 40.7128,
    lng: -74.006,
  },
  {
    title: "Tokyo",
    lat: 35.6764,
    lng: 139.65,
  },
  {
    title: "Sydney",
    lat: 33.8688,
    lng: 151.2093,
  },
];

// Geymir valda staðsetningu
let selectedLocation;

/**
 * Allar staðsetning sem hægt er að fá veður fyrir.
 * @type Array<SearchLocation>
 */
let dates = [];

/**
 * Bætir dögum við dagsetningu.
 * @param {Date} date
 * @param {number} days
 * @returns Nýrri dagsetningu
 */
function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
}

/**
 * Býr til dagsetningar næstu 7 daga og setur í dates fylki.
 */
function createDates() {
  for (let i = 0; i < 7; i++) {
    const dateToAdd = addDays(new Date(), i);
    dates.push({ title: dateToAdd.toDateString(), date: dateToAdd });
  }
}

/**
 * Hreinsar fyrri niðurstöður, passar að niðurstöður séu birtar og birtir element.
 * @param {Element} element
 */
function renderIntoResultsContent(element) {
  const outputElement = document.querySelector(".output");

  if (!outputElement) {
    console.warn("fann ekki .output");
    return;
  }

  empty(outputElement);

  outputElement.appendChild(element);
}

/**
 * Birtir niðurstöður í viðmóti.
 * @param {SearchLocation} location
 * @param {Date} date
 * @param {Array<import('./lib/weather.js').Forecast>} results
 */
function renderResults(location, date, results) {
  const header = el(
    "tr",
    {},
    el("th", {}, "Tími"),
    el("th", {}, "Hiti (C°)"),
    el("th", {}, "Úrkoma (mm)")
  );
  console.log(results);

  const resultsTable = el("table", { class: "table" }, header);

  for (let i = 0; i < results.length; i++) {
    const time = new Date(results[i].time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const temperature =
      results[i].temperature !== 0 ? results[i].temperature : "0";
    const precipitation =
      results[i].precipitation !== 0 ? results[i].precipitation : "0";

    const row = el(
      "tr",
      {},
      el("td", {}, time),
      el("td", {}, temperature),
      el("td", {}, precipitation)
    );

    resultsTable.appendChild(row);
  }

  renderIntoResultsContent(
    el(
      "section",
      {},
      el("h2", {}, `${location.title} þann ${date.toLocaleDateString()}`),
      el(
        "p",
        {},
        `Spá fyrir ${date.toLocaleDateString()} á breiddargráðu ${location.lat} og lengdargráðu ${location.lng}`
      ),
      resultsTable
    )
  );
}

/**
 * Birta villu í viðmóti.
 * @param {Error} error
 */
function renderError(error) {
  console.log(error);
  const message = error.message;
  renderIntoResultsContent(
    el("p", { class: "text-warning" }, `Villa: ${message}`)
  );
}

/**
 * Birta biðstöðu í viðmóti.
 */
function renderLoading() {
  renderIntoResultsContent(el("p", { class: "text-success" }, "Leita..."));
}

/**
 * Framkvæmir leit að veðri fyrir gefna staðsetningu.
 * Birtir biðstöðu, villu eða niðurstöður í viðmóti.
 * @param {SearchLocation} location Staðsetning sem á að leita eftir.
 * @param {Date} date Dagsetning sem á að leita eftir.
 */
async function onSearch(location, date) {
  if (location === undefined) {
    console.log(location);
    renderIntoResultsContent(
      el("p", { class: "text-warning" }, "Fyrst þarf að velja staðsetningu")
    );
    return;
  }
  renderLoading();

  let results;
  try {
    results = await weatherSearch(location.lat, location.lng);
    results = results.filter(
      (x) => new Date(x.time).getDate() === date.getDate()
    );
    selectedLocation = location;
  } catch (error) {
    renderError(error);
    return;
  }

  renderResults(location, date, results ?? []);
}

async function onGeolocationSuccess(pos) {
  const location = {
    title: "Mín staðsetning",
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
  };

  renderLoading();

  let results;
  try {
    results = await weatherSearch(location.lat, location.lng);
    results = results.filter(
      (x) => new Date(x.time).getDate() === new Date().getDate()
    );
    selectedLocation = location;
  } catch (error) {
    renderError(error);
    return;
  }

  renderResults(location, results ?? []);
}

function onGeolocationError(err) {
  console.log("err", err);
  renderError(err);
}

/**
 * Framkvæmir leit að veðri fyrir núverandi staðsetningu.
 * Biður notanda um leyfi gegnum vafra.
 */
async function onSearchMyLocation() {
  navigator.geolocation.getCurrentPosition(
    onGeolocationSuccess,
    onGeolocationError
  );
}

/**
 * Býr til takka fyrir staðsetningu.
 * @param {string} locationTitle
 * @param {() => void} onSearch
 * @returns {HTMLElement}
 */
function renderLocationButton(locationTitle, onSearch) {
  // Notum `el` fallið til að búa til element og spara okkur nokkur skref.
  const locationElement = el(
    "li",
    {},
    el("button", { class: "btn", click: onSearch }, locationTitle)
  );

  return locationElement;
}

/**
 * Býr til grunnviðmót: haus og lýsingu, lista af staðsetningum og niðurstöður (falið í byrjun).
 * @param {Element} container HTML element sem inniheldur allt.
 * @param {Array<SearchLocation>} locations Staðsetningar sem hægt er að fá veður fyrir.
 * @param {(location: SearchLocation) => void} onSearch
 * @param {() => void} onSearchMyLocation
 */
function render(container, locations, onSearch, onSearchMyLocation) {
  // Búum til <main> og setjum `weather` class
  const parentElement = document.createElement("main");
  parentElement.classList.add("row-gap-4");

  // Búum til <header> með beinum DOM aðgerðum
  const headerElement = document.createElement("header");
  const heading = document.createElement("h1");
  heading.appendChild(document.createTextNode("Veðrið"));
  headerElement.appendChild(heading);
  parentElement.appendChild(headerElement);

  // Búa til <div class="loctions">
  const locationsElement = document.createElement("div");
  locationsElement.appendChild(
    document.createTextNode("Veldu stað til að sjá hita- og úrkomuspá")
  );

  const h2Element = document.createElement("h2");
  h2Element.appendChild(document.createTextNode("Staðsetningar"));
  h2Element.classList.add("card-subtitle");
  locationsElement.appendChild(h2Element);

  // Búa til <ul class="locations__list">
  const locationsListElement = document.createElement("ul");
  locationsListElement.classList.add("nav", "nav-tabs", "gap-5");

  locationsElement.appendChild(locationsListElement);

  const liButtonElement = renderLocationButton(
    "Mín staðsetning (þarf leyfi)",
    () => {
      onSearchMyLocation();
    }
  );
  locationsListElement.appendChild(liButtonElement);

  parentElement.appendChild(locationsElement);

  for (const location of locations) {
    const liButtonElement = renderLocationButton(location.title, () => {
      onSearch(location, new Date());
    });
    locationsListElement.appendChild(liButtonElement);
  }

  // takkar fyrir aðrar dagsetningar
  const h3Element = document.createElement("h3");
  h3Element.appendChild(document.createTextNode("Dagsetning"));
  h3Element.classList.add("card-subtitle");
  locationsElement.appendChild(h3Element);

  const datesListElement = document.createElement("ul");
  datesListElement.classList.add("nav", "nav-tabs", "gap-5");

  createDates();
  for (const date of dates) {
    const liButtonElement = renderLocationButton(date.title, () => {
      onSearch(selectedLocation, date.date);
    });
    datesListElement.appendChild(liButtonElement);
  }

  locationsElement.appendChild(datesListElement);

  parentElement.appendChild(locationsElement);

  const outputElement = document.createElement("div");
  outputElement.classList.add("output");
  parentElement.appendChild(outputElement);

  container.appendChild(parentElement);
}

// Þetta fall býr til grunnviðmót og setur það í `document.body`
render(document.body, locations, onSearch, onSearchMyLocation);
