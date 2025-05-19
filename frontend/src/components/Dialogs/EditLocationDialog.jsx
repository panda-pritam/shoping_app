import React, {useEffect, useRef, useState} from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import "ol/ol.css";
import axios from "axios";
import "ol-ext/dist/ol-ext.min.css";
import SearchNominatim from "ol-ext/control/SearchNominatim";
import {Feature} from "ol";
import {Point} from "ol/geom";
import {Vector as VectorLayer} from "ol/layer";
import {Vector as VectorSource} from "ol/source";
import {Style, Circle, Fill, Stroke} from "ol/style";
import {useForm} from "react-hook-form";
import {toast} from "react-toastify";

const STATUS_CHOICES = [
  {value: "active", label: "Active"},
  {value: "inactive", label: "Inactive"},
  {value: "unk", label: "Unknown"},
];

const TYPE_CHOICES = [
  {value: "drone", label: "Drone"},
  {value: "iot", label: "IoT Devices"},
  {value: "satellite", label: "Satellite Image"},
  {value: "other", label: "Other"},
];

export default function EditLocationDialog({
  open,
  setOpen,
  initialData,
  onUpdate,
}) {
  const mapRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const [showCustomType, setShowCustomType] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: {errors},
  } = useForm();

  const typeValue = watch("type");

  useEffect(() => {
    if (typeValue === "other") {
      setShowCustomType(true);
    } else {
      setShowCustomType(false);
      setValue("custom_type", "");
    }
  }, [typeValue, setValue]);

  useEffect(() => {
    if (!open || !initialData) return;

    console.log("data-> ", initialData);

    const normalizedType = ["drone", "iot", "satellite"].includes(
      initialData.type
    )
      ? initialData.type
      : "other";

    reset({
      ...initialData,
      custom_type: normalizedType === "other" ? initialData.type : "",
      type: normalizedType,
    });

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({color: "#3b82f6"}),
          stroke: new Stroke({color: "#fff", width: 2}),
        }),
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: "https://mts1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
          }),
        }),
        vectorLayer,
      ],
      view: new View({
        center: [initialData.lng, initialData.lat],
        zoom: 13,
        projection: "EPSG:4326",
      }),
    });

    const feature = new Feature({
      geometry: new Point([initialData.lng, initialData.lat]),
    });
    vectorSource.addFeature(feature);

    const search = new SearchNominatim({
      position: "top-left",
      collapsed: true,
      polygon: false,
      centerToResult: true,
    });

    map.addControl(search);

    const updateCoords = coords => {
      vectorSource.clear();
      const f = new Feature(new Point(coords));
      vectorSource.addFeature(f);
      setValue("lat", parseFloat(coords[1].toFixed(4)));
      setValue("lng", parseFloat(coords[0].toFixed(4)));
    };

    search.on("select", e => updateCoords(e.coordinate));
    map.on("click", e => updateCoords(e.coordinate));

    return () => {
      map.setTarget(null);
    };
  }, [open, initialData, reset, setValue]);

  const onSubmit = async formData => {
    const finalPayload = {
      ...formData,
      type: formData.type === "other" ? formData.custom_type : formData.type,
    };

    try {
      await axios.put(
        `http://178.236.185.244:8008/locations/${initialData.id}/`,
        finalPayload
      );
      toast.success("Location updated successfully!");
      setOpen(false);
      onUpdate(); // trigger parent reload
    } catch (err) {
      console.error(err);
      toast.error("Failed to update location.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-scroll">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row max-h-[90%]">
        {/* Map container - full height on mobile, half width on desktop */}
        <div className="w-full md:w-1/2 h-80 md:h-auto" ref={mapRef}></div>

        {/* Form container */}
        <div className="w-full md:w-1/2 p-6  max-h-[80vh] overflow-y-scroll">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Edit Location</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("id")} />

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                {...register("name", {required: "Name is required"})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter location name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  {...register("lat", {required: true})}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  {...register("lng", {required: true})}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name *
              </label>
              <input
                {...register("location_name", {
                  required: "Location name is required",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter physical location name"
              />
              {errors.location_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.location_name.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                {...register("type", {required: "Type is required"})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
              >
                <option value="">Select type</option>
                {TYPE_CHOICES.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.type.message}
                </p>
              )}
            </div>

            {showCustomType && (
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Type *
                </label>
                <input
                  {...register("custom_type", {
                    required: "Custom type is required",
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter custom type"
                />
                {errors.custom_type && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.custom_type.message}
                  </p>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage *
              </label>
              <textarea
                {...register("usage", {
                  required: "Usage information is required",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                rows="3"
                placeholder="Describe the usage of this location"
              ></textarea>
              {errors.usage && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.usage.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bookmarked
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register("bockmarked")}
                  onChange={e => setValue("bockmarked", e.target.checked)}
                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  checked={watch("bockmarked")}
                />
                {/* <label className="ml-2 block text-sm text-gray-900">
                  Bookmark this location
                </label> */}
              </div>{" "}
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
              >
                {STATUS_CHOICES.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Serviced Date
              </label>
              <input
                type="date"
                {...register("last_serviced_date")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex justify-end items-center space-x-4 pt-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2  focus:ring-offset-2 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
