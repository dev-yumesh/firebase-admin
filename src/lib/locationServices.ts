const SCRIPT_ID = "google-maps-js-places";

export type ParsedPlaceLocation = {
  city: string;
  state: string;
  pincode: string;
  locality: string;
  latitude: string;
  longitude: string;
  googleMapLocation: string;
};

type ComponentEntry = { long: string; short: string };

function componentMap(
  components: google.maps.GeocoderAddressComponent[] | undefined,
): Record<string, ComponentEntry> {
  const map: Record<string, ComponentEntry> = {};
  if (!components) return map;
  for (const c of components) {
    for (const t of c.types) {
      if (!map[t]) map[t] = { long: c.long_name, short: c.short_name };
    }
  }
  return map;
}

/** Maps Google address_components to shop signup fields (India-oriented). */
export function addressComponentsToFields(
  components: google.maps.GeocoderAddressComponent[] | undefined,
): Pick<ParsedPlaceLocation, "city" | "state" | "pincode" | "locality"> {
  const m = componentMap(components);

  const state = m.administrative_area_level_1?.long ?? "";

  const city =
    m.locality?.long ||
    m.administrative_area_level_2?.long ||
    m.administrative_area_level_3?.long ||
    m.postal_town?.long ||
    "";

  const locality =
    m.sublocality_level_1?.long ||
    m.sublocality_level_2?.long ||
    m.neighborhood?.long ||
    m.premise?.long ||
    "";

  const pincode = m.postal_code?.long ?? "";

  return { city, state, pincode, locality };
}

export function parsePlaceResult(
  place: google.maps.places.PlaceResult,
): ParsedPlaceLocation | null {
  const loc = place.geometry?.location;
  if (!loc) return null;

  const lat = loc.lat();
  const lng = loc.lng();
  const { city, state, pincode, locality } = addressComponentsToFields(
    place.address_components,
  );

  const placeId = place.place_id;
  const googleMapLocation = placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}&query_place_id=${encodeURIComponent(placeId)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;

  return {
    city,
    state,
    pincode,
    locality,
    latitude: String(lat),
    longitude: String(lng),
    googleMapLocation,
  };
}

let mapsLoadPromise: Promise<void> | null = null;

function waitForPlacesReady(timeoutMs = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.google?.maps?.places) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Google Maps Places API did not become ready in time."));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/**
 * Loads the Maps JavaScript API with the `places` library (idempotent).
 * Use the same key you configure for Places; this project uses `NEXT_PUBLIC_GOOGLE_PLACE_API_KEY`.
 */
export function loadGoogleMapsPlaces(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadGoogleMapsPlaces must run in the browser."));
  }
  if (window.google?.maps?.places) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      waitForPlacesReady()
        .then(() => resolve())
        .catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`;
    script.onerror = () => {
      mapsLoadPromise = null;
      reject(new Error("Failed to load Google Maps JavaScript API."));
    };
    script.onload = () => {
      waitForPlacesReady()
        .then(() => resolve())
        .catch((e) => {
          mapsLoadPromise = null;
          reject(e);
        });
    };
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

export function getDefaultGooglePlacesApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY;
}

export type AttachPlacesAutocompleteOptions = {
  /** ISO 3166-1 Alpha-2 country code(s). Defaults to India (`in`) to match signup `country: "India"`. */
  country?: string | string[];
  onPlaceSelected: (parsed: ParsedPlaceLocation) => void;
};

/**
 * Binds Google Places Autocomplete to an input. Call after `loadGoogleMapsPlaces` resolves.
 * Returns a detach function (run on unmount).
 */
export function attachPlacesAutocomplete(
  input: HTMLInputElement,
  options: AttachPlacesAutocompleteOptions,
): () => void {
  const country = options.country ?? "in";
  const componentRestrictions =
    typeof country === "string"
      ? { country }
      : country.length > 0
        ? { country }
        : undefined;

  const autocomplete = new google.maps.places.Autocomplete(input, {
    fields: ["address_components", "geometry", "place_id", "formatted_address"],
    ...(componentRestrictions ? { componentRestrictions } : {}),
  });

  const listener = autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    const parsed = parsePlaceResult(place);
    if (parsed) options.onPlaceSelected(parsed);
  });

  return () => {
    listener.remove();
    google.maps.event.clearInstanceListeners(autocomplete);
  };
}
