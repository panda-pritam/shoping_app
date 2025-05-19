import React, {useEffect, useRef, useContext, useState} from "react";
import {MyContext} from "../store/store";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import "ol/ol.css";
import axios from "axios";
import "ol-ext/dist/ol-ext.min.css";
import SearchNominatim from "ol-ext/control/SearchNominatim";
import {fromLonLat, toLonLat} from "ol/proj";
import {Feature} from "ol";
import {Point} from "ol/geom";
import {Vector as VectorLayer} from "ol/layer";
import {Vector as VectorSource} from "ol/source";
import {Style, Circle, Fill, Stroke} from "ol/style";
import {useForm} from "react-hook-form";
import {ToastContainer, toast} from "react-toastify";

// Status choices as per your requirements
const STATUS_CHOICES = [
  {value: "active", label: "Active"},
  {value: "inactive", label: "Inactive"},
  {value: "unk", label: "Unknown"},
];

// Type choices as per your requirements
const TYPE_CHOICES = [
  {value: "drone", label: "Drone"},
  {value: "iot", label: "IoT Devices"},
  {value: "satellite", label: "Satellite Image"},
  {value: "other", label: "Other"},
];

export default function AddNew() {
  const {map2, setMap2} = useContext(MyContext);
  const mapRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showCustomType, setShowCustomType] = useState(false);

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: {errors},
  } = useForm({
    defaultValues: {
      name: "",
      lat: null,
      lng: null,
      location_name: "",
      type: "",
      custom_type: "",
      usage: "",
      status: "unk",
      last_serviced_date: "",
    },
  });

  // Watch type field to show/hide custom type input
  const typeValue = watch("type");

  useEffect(() => {
    if (typeValue === "other") {
      setShowCustomType(true);
    } else {
      setShowCustomType(false);
      setValue("custom_type", "");
    }
  }, [typeValue, setValue]);

  // Handle form submission
  const onSubmit = async data => {
    setIsSubmitting(true);

    // Combine type and custom_type if needed
    const finalData = {
      ...data,
      type: data.type === "other" ? data.custom_type : data.type,
    };

    try {
      const response = await axios.post(
        "http://178.236.185.244:8008/locations/",
        finalData
      );
      if (response) {
        setSubmitStatus({
          type: "success",
          message: "Location added successfully!",
        });

        // Reset form after successful submission
        reset();

        // Remove marker from map
        if (vectorSourceRef.current) {
          vectorSourceRef.current.clear();
        }
        toast.success("Location added successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Failed to add location. Please try again.",
      });
    } finally {
      setIsSubmitting(false);

      // Hide status message after 3 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 3000);
    }
  };

  // Function to update marker and form data
  const updateMarkerAndForm = (map, coordinates, vectorSource) => {
    // Clear existing markers
    vectorSource.clear();

    // Create new marker feature
    const feature = new Feature({
      geometry: new Point(coordinates),
    });

    // Add marker to vector source
    vectorSource.addFeature(feature);

    // Update form with new coordinates (rounded to 4 decimal places)
    setValue("lat", parseFloat(coordinates[1].toFixed(4)), {
      shouldValidate: true,
    });
    setValue("lng", parseFloat(coordinates[0].toFixed(4)), {
      shouldValidate: true,
    });
  };

  useEffect(() => {
    if (mapRef.current) {
      console.log("Initializing map...");

      // Convert initial coordinates to Web Mercator
      const initialCenter = [73.79, 20.011];

      // Create vector source for markers
      const vectorSource = new VectorSource();
      vectorSourceRef.current = vectorSource;

      // Create vector layer for markers
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          image: new Circle({
            radius: 8,
            fill: new Fill({color: "#ff0000"}),
            stroke: new Stroke({color: "#ffffff", width: 2}),
          }),
        }),
      });

      // Create map
      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new XYZ({
              url: "https://mts1.google.com/vt/lyrs=m@186112443&hl=x-local&src=app&x={x}&y={y}&z={z}&s=Galile",
              maxZoom: 19,
              maxNativeZoom: 19,
            }),
          }),
          vectorLayer,
        ],
        view: new View({
          center: initialCenter,
          zoom: 13,
          projection: "EPSG:4326",
        }),
      });

      // Add Nominatim search control
      const search = new SearchNominatim({
        position: "top-left",
        polygon: false,
        centerToResult: true,
        collapsed: true,
        placeholder: "Search for a place...",
        delay: 500,
      });

      // Add the search control to the map
      map.addControl(search);

      // Handle search selection event
      search.on("select", function (e) {
        const coords = [e.coordinate[0], e.coordinate[1]];
        map.getView().setCenter(coords);
        map.getView().setZoom(16);

        // Update marker position and form data
        updateMarkerAndForm(map, coords, vectorSource);
      });

      // Add click event to map
      map.on("click", function (evt) {
        console.log("Map clicked!");
        const clickedCoord = evt.coordinate;

        // Update marker position and form data
        updateMarkerAndForm(map, clickedCoord, vectorSource);
      });

      setMap2(map);

      return () => {
        console.log("Cleaning up map resources...");
        map.removeControl(search);
        map.setTarget(undefined);
      };
    }
  }, []);

  return (
    <div className="w-full h-full overflow-hidden relative grid grid-cols-1 grid-rows-2 lg:grid-rows-1 lg:grid-cols-3 bg-white">
      <div
        ref={mapRef}
        className="w-full h-full col-span-1 lg:col-span-2"
      ></div>

      <div className="w-full h-full col-span-1 bg-white p-6 overflow-y-auto border-l border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Add New Location
        </h2>

        {/* Status alerts */}
        {submitStatus && (
          <div
            className={`p-3 mb-6 rounded-md ${
              submitStatus.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {submitStatus.message}
          </div>
        )}

        <p className="mb-6 text-sm text-gray-600">
          Click on the map to select a location or use the search box.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Name *
            </label>
            <input
              type="text"
              {...register("name", {required: "Name is required"})}
              className={`block w-full px-3 py-2 border ${
                errors.name ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Coordinates Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Coordinates *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                {...register("lat", {required: "Please select a location"})}
                readOnly
                placeholder="Latitude"
                className={`block w-full px-3 py-2 border ${
                  errors.lat ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm bg-gray-100 focus:outline-none focus:ring-1 focus:ring-black`}
              />
              <input
                type="text"
                {...register("lng", {required: "Please select a location"})}
                readOnly
                placeholder="Longitude"
                className={`block w-full px-3 py-2 border ${
                  errors.lng ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm bg-gray-100 focus:outline-none focus:ring-1 focus:ring-black`}
              />
            </div>
            {(errors.lat || errors.lng) && (
              <p className="mt-1 text-sm text-red-600">
                Please select a location on the map
              </p>
            )}
          </div>

          {/* Location Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Location Name *
            </label>
            <input
              type="text"
              {...register("location_name", {
                required: "Location name is required",
              })}
              className={`block w-full px-3 py-2 border ${
                errors.location_name ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black`}
            />
            {errors.location_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.location_name.message}
              </p>
            )}
          </div>

          {/* Type Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Type *
            </label>
            <select
              {...register("type", {required: "Type is required"})}
              className={`block w-full px-3 py-2 border ${
                errors.type ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black`}
            >
              <option value="">Select a type</option>
              {TYPE_CHOICES.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              <option value="other">Other (specify)</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Custom Type Field (shown when 'other' is selected) */}
          {showCustomType && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Specify Type *
              </label>
              <input
                type="text"
                {...register("custom_type", {
                  required: showCustomType ? "Please specify the type" : false,
                })}
                className={`block w-full px-3 py-2 border ${
                  errors.custom_type ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black`}
              />
              {errors.custom_type && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.custom_type.message}
                </p>
              )}
            </div>
          )}

          {/* Usage Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Usage *
            </label>
            <textarea
              {...register("usage", {
                required: "Usage information is required",
              })}
              rows="3"
              className={`block w-full px-3 py-2 border ${
                errors.usage ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black`}
            ></textarea>
            {errors.usage && (
              <p className="mt-1 text-sm text-red-600">
                {errors.usage.message}
              </p>
            )}
          </div>

          {/* Status Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Status
            </label>
            <select
              {...register("status")}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black"
            >
              {STATUS_CHOICES.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Last Serviced Date Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Last Serviced Date
            </label>
            <input
              type="date"
              {...register("last_serviced_date", {
                pattern: {
                  value: /^\d{4}-\d{2}-\d{2}$/,
                  message: "Date must be in YYYY-MM-DD format",
                },
              })}
              className={`block w-full px-3 py-2 border ${
                errors.last_serviced_date ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black`}
            />
            {errors.last_serviced_date && (
              <p className="mt-1 text-sm text-red-600">
                {errors.last_serviced_date.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-black py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
